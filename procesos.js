var cantProcesos = 0;
var matrizProcesos = [];
var procesos = [];

var colaNuevos = [];
var colaListos = [];
var colaCorriendo = []; // Siempre habrá 1 sólo proceso
var colaBloqueados = [];
var colaTerminados = [];
var colaAux = [];
var contador = 0; //Tcp que se resetea y decrece
var q = 0;

/***********************
**Definición de clases**
***********************/
class Proceso {
    constructor(nombre, cantidadR, duracionR, inputR, arrivalTime, prioridad) {
        this.nombre         = nombre;
        this.cantidadR      = cantidadR;
        this.duracionR      = duracionR;
        this.inputR         = inputR;
        this.arrivalTime    = arrivalTime;
        this.prioridad      = prioridad;
        

        //Atributos adicionales
        this.tiempoEjecucionAux = duracionR;
        this.arrivalTimeReal    = arrivalTime;
        this.iteracionES        = inputR;
        this.tiempoInicio       = null;
        this.tiempoFinalizacion = null;
    }
}

/* Detección de file input, su procesado y eventual carga a la tabla de procesos*/
const cargarTabla = (fr) => {
    let p = fr.result;

    lineas    = p.split('\n'); //Divido en salto de lineas
    let tabla = document.getElementById('datos-procesos');

    cantProcesos = lineas.length;

    //Agrego los valores a la tabla
    for (let i = 0; i < lineas.length; i++) {
        let valores = lineas[i].split(' '); // Divide la línea en valores
        
        if (valores.length === 6) {         // Verifica que haya 5 valores en cada línea
            let fila = tabla.insertRow();   // Crea una nueva fila

            //Creo el objeto y lo meto en el array de procesos
            const proceso = new Proceso(valores[0], parseInt(valores[1]), parseInt(valores[2]), parseInt(valores[3]), parseInt(valores[4]), parseInt(valores[5]));
            procesos.push(proceso);

            //Agrego el proceso a la tabla HTML
            for (let j = 0; j < valores.length; j++) {
                //Agrego a la tabla
                let celda = fila.insertCell();  // Crea una nueva celda
                celda.textContent = valores[j]; // Asigna el valor a la celda
            }
        }
    }
}

document.getElementById("fileInput").addEventListener("change", function(event) {
    event.preventDefault();
    var fr = new FileReader();
    fr.onload = function() {
        cargarTabla(fr);
    }

    fr.readAsText(this.files[0]);

})

/* Ejecuta en función de la planificación */
function simularProceso() {
    let tip = $("#tip").val();
    let tcp = $("#tcp").val(); // Tiempo de Conmutación entre Procesos (TCP) + Lo ingresa el usuario
    let tfp = $("#tfp").val(); // Tiempo de Finalización de Proceso (TFP) + Lo ingresa el usuario
    let quantum = $("#q").val();

    let planificacion = $("#politica").val();

    switch (planificacion) {
        case "FCFS": 
            simularFCFS(tip, tfp, tcp);
            break;
        case "Prioridad": 
            simularPrioridad(tip, tfp, tfp); 
            break;
        case "RoundRobin": 
            simularRoundRobin(tip, tfp, tfp, quantum); 
            break;
        case "SPN":
            simularSPN(tip, tfp, tfp); 
            break;
        case "SRTN": 
            simularSRT(tip, tfp, tfp);
            break;
    }
}

// Elimina todos los elementos del array usando splice
const clearArray = (a) => {
    a.splice(0, a.length);
}

//Borra todo los objetos de la cola A que estén en la cola B (Aux)
const deleteFromArray = (a, aux) => {
    for (const p of aux) {
        const index = a.indexOf(p);
        if (index !== -1) {
            a.splice(index, 1);
        }
    }
}

const newHandler = (tiempo) => {
    for (const p of procesos) {
        if (p.arrivalTimeReal == tiempo) {
            colaNuevos.push(p);
            colaAux.push(p);
        }
    }

    deleteFromArray(procesos, colaAux)
    clearArray(colaAux);
}

const toReady = (tiempo) => { 
    for (const p of colaNuevos)
        if (p.arrivalTimeReal + 1 == tiempo) {
            colaListos.push(p);
            colaAux.push(p);
        }
    
    deleteFromArray(colaNuevos, colaAux);
    clearArray(colaAux);
}

const runningHandler = (tiempo) => {

    if (colaCorriendo.length == 0 ) 
        if (colaListos.length != 0 && contador == 0) {
            colaCorriendo.push(colaListos.shift());
            console.log("El proceso " + colaCorriendo[0].nombre + " entró a ejecutarse en el tiempo " + tiempo);
        } else if (contador > 0){ 
            contador--;
        }

    //Resto uno a la ejecución
    if (colaCorriendo.length == 1) colaCorriendo[0].tiempoEjecucionAux--;
}

const checkRunningProcess = (tiempo, tcp) => {
    if (colaCorriendo[0].tiempoEjecucionAux === 0){ 
        colaCorriendo[0].cantidadR--;
        console.log("El proceso " + colaCorriendo[0].nombre + " se bloquéo en el tiempo " + tiempo);
        colaCorriendo[0].iteracionES--;
        colaBloqueados.push(colaCorriendo.shift());
        contador = tcp;
    } 
}

const checkBlockedProcess = (tiempo, tfp) => {
    for (const p of colaBloqueados) {
        if (p.iteracionES === 0) {
            if (p.cantidadR === 0) {
                colaTerminados.push(p);
                colaAux.push(p);
                p.tiempoFinalizacion = parseInt(tiempo) + parseInt(tfp);
                console.log("El proceso " + p.nombre + " finalizó en el tiempo " + p.tiempoFinalizacion);
            }
            else { //Desbloqueo el proceso
                colaListos.push(p); 
                colaAux.push(p);
                console.log("El proceso " + p.nombre + " se desbloqueó en el tiempo " + tiempo);
                p.tiempoEjecucionAux = p.duracionR;
                p.iteracionES = p.inputR;
            }
        } else 
            p.iteracionES--;
    }

    if (colaAux.length > 0) {
        deleteFromArray(colaBloqueados, colaAux);
        clearArray(colaAux);
    }
}

//---------------------------- FCFS  ------------------------------------------------

const simularFCFS = (tip, tfp, tcp) => {
    let tiempo = 0;
    let cantidadProcesos = procesos.length;

    //Ordeno los procesos por tiempo de llegada
    procesos.sort((a, b) => a.arrivalTime - b.arrivalTime);

    //Lleno los atributos de los procesos que va a servir para más adelante
    for (const p of procesos) 
        p.arrivalTimeReal = parseInt(p.arrivalTime) + parseInt(tip);

    while (colaTerminados.length != cantidadProcesos) {
        if (colaCorriendo.length > 0) 
            checkRunningProcess(tiempo, tcp);

        newHandler(tiempo);

        if (colaNuevos.length > 0) 
            toReady(tiempo);

        runningHandler(tiempo);

        if (colaBloqueados.length > 0) 
            checkBlockedProcess(tiempo, tfp);
        tiempo++;
    }
}

//---------------------- PRIORIDAD EXTERNA ------------------------------------------

const highestPriorityProcess = (arrayOfProcess) => {
    let procesoPrioridadMaxima = arrayOfProcess[0];

    for (const p of arrayOfProcess) {
        if (p.prioridad < procesoPrioridadMaxima.prioridad) {
            procesoPrioridadMaxima = p;
        }
    }

    return procesoPrioridadMaxima;
}

const priorityRunningHandler = (tiempo) => {

    if (colaCorriendo.length == 0 ) 
        if (colaListos.length != 0 && contador == 0) {
            colaCorriendo.push(highestPriorityProcess(colaListos));
            colaListos.splice(colaListos.indexOf(highestPriorityProcess(colaListos)), 1);
            console.log("El proceso " + colaCorriendo[0].nombre + " entró a ejecutarse en el tiempo " + tiempo);
        } else if (contador > 0){ 
            contador--;
            alert("se restó al contador, es "+ contador + " en tiempo " + tiempo);
        }

    //Resto uno a la ejecución
    if (colaCorriendo.length == 1) colaCorriendo[0].tiempoEjecucionAux--;
}

const simularPrioridad = (tip, tfp, tcp) => {
    let tiempo = 0;
    let cantidadProcesos = procesos.length;

    //Ordeno los procesos por tiempo de llegada
    procesos.sort((a, b) => a.arrivalTime - b.arrivalTime);

    //Lleno los atributos de los procesos que va a servir para más adelante
    for (const p of procesos) 
        p.arrivalTimeReal = parseInt(p.arrivalTime) + parseInt(tip);

    while (colaTerminados.length != cantidadProcesos) {
        if (colaCorriendo.length > 0) 
            checkRunningProcess(tiempo, tcp);

        newHandler(tiempo);

        if (colaNuevos.length > 0) 
            toReady(tiempo);

        priorityRunningHandler(tiempo);

        if (colaBloqueados.length > 0) 
            checkBlockedProcess(tiempo, tfp);
        
        tiempo++;
    }
}

//---------------------- ROUND ROBIN ------------------------------------------
const roundRobinRunningHandler = (tiempo) => {
    if (colaCorriendo.length == 0 ) 
        if (colaListos.length != 0 && contador == 0) {
            colaCorriendo.push(colaListos.shift());
        } else if (contador > 0){ 
            contador--;
        }

    //Resto uno a la ejecución y al quantum
    if (colaCorriendo.length == 1) {
        q--;
        colaCorriendo[0].tiempoEjecucionAux--;
    }
}

const checkRunningProcessRR = (tiempo, tcp, quantum) => {
    if (q == 0 || colaCorriendo[0].tiempoEjecucionAux === 0){ 
        
        //Primero compruebo si finalizó su tiempo de ejecución, sino, compruebo el estado del quantum.
        if (colaCorriendo[0].tiempoEjecucionAux === 0) {
            //Ajusto sus valores
            colaCorriendo[0].cantidadR--;
            colaCorriendo[0].iteracionES--;
            console.log("El proceso " + colaCorriendo[0].nombre + " se bloquéo en el tiempo " + tiempo);

            //Bloqueo el proceso
            colaBloqueados.push(colaCorriendo.shift());

            //Reseteo tcp y quantum
            contador = tcp;
            q = quantum;

        } else  if (q == 0 && colaCorriendo.length == 1) {
            colaListos.push(colaCorriendo.shift());
            q = quantum;
        }
    } 
}

const simularRoundRobin = (tip, tfp, tcp, quantum) => {
    let tiempo = 0;
    let cantidadProcesos = procesos.length;
    q = quantum;
    //Ordeno los procesos por tiempo de llegada
    procesos.sort((a, b) => a.arrivalTime - b.arrivalTime);

    //Lleno los atributos de los procesos que va a servir para más adelante
    for (const p of procesos) 
        p.arrivalTimeReal = parseInt(p.arrivalTime) + parseInt(tip);

    while (colaTerminados.length != cantidadProcesos) {
        
        if (colaCorriendo.length > 0) 
            checkRunningProcessRR(tiempo, tcp, quantum);

        newHandler(tiempo);

        if (colaNuevos.length > 0) 
            toReady(tiempo);

        roundRobinRunningHandler(tiempo, q);

        if (colaBloqueados.length > 0) 
            checkBlockedProcess(tiempo, tfp);
        
        tiempo++;
    }
}

//---------------------- SHORTEST PROCESS NEXT ------------------------------------------

const shortestProcess = (arrayOfProcess) => {
    let procesoMasCorto = arrayOfProcess[0];

    for (const p of arrayOfProcess) {
        if (p.duracionR < procesoMasCorto.duracionR) {
            procesoMasCorto = p;
        }
    }

    return procesoMasCorto;
}

const spnRunningHandler = (tiempo) => {

    if (colaCorriendo.length == 0 ) 
        if (colaListos.length != 0 && contador == 0) {
            colaCorriendo.push(shortestProcess(colaListos));
            colaListos.splice(colaListos.indexOf(shortestProcess(colaListos)), 1);
            console.log("El proceso " + colaCorriendo[0].nombre + " entró a ejecutarse en el tiempo " + tiempo);
        } else if (contador > 0){ 
            contador--;
            alert("se restó al contador, es "+ contador + " en tiempo " + tiempo);
        }

    //Resto uno a la ejecución
    if (colaCorriendo.length == 1) colaCorriendo[0].tiempoEjecucionAux--;
}

const simularSPN = (tip, tfp, tcp) => {
    let tiempo = 0;
    let cantidadProcesos = procesos.length;

    //Ordeno los procesos por tiempo de llegada
    procesos.sort((a, b) => a.arrivalTime - b.arrivalTime);

    //Lleno los atributos de los procesos que va a servir para más adelante
    for (const p of procesos) 
        p.arrivalTimeReal = parseInt(p.arrivalTime) + parseInt(tip);

    while (colaTerminados.length != cantidadProcesos) {
        if (colaCorriendo.length > 0) 
            checkRunningProcess(tiempo, tcp);

        newHandler(tiempo);

        if (colaNuevos.length > 0) 
            toReady(tiempo);

        spnRunningHandler(tiempo);

        if (colaBloqueados.length > 0) 
            checkBlockedProcess(tiempo, tfp);
        
        tiempo++;
    }
}

//---------------------- SHORTEST REMAINING TIME ------------------------------------------

const srtProcess = (arrayOfProcess) => {
    let srtp = arrayOfProcess[0];

    for (const p of arrayOfProcess) {
        if (p.tiempoEjecucionAux < srtp.tiempoEjecucionAux) {
            srtp = p;
        }
    }

    return srtp;
}

const permutarProcesos = (tiempo) => {
    //Se entra chequeando que la cola de listos no está vacía

    //Obtnego el proceso con menor tiempo de ejecución restante en cola de listos
    let p = srtProcess(colaListos);

    //Si hay un proceso corriendo y ese proceso tiene mayor tiempo de ejecución restante, los permuto
    if (colaCorriendo.length == 1)
        if (p.tiempoEjecucionAux < colaCorriendo[0].tiempoEjecucionAux) {
            //Permuto los procesos
            colaListos.push(colaCorriendo.shift());
            colaCorriendo.push(p);

            //Elimino el proceso de la cola de listos
            colaListos.splice(colaListos.indexOf(p), 1);
        }
}


const srtRunningHandler = (tiempo) => {

    if (colaCorriendo.length == 0) 
        if (colaListos.length != 0 && contador == 0) {
            colaCorriendo.push(srtProcess(colaListos));
            colaListos.splice(colaListos.indexOf(srtProcess(colaListos)), 1);
            console.log("El proceso " + colaCorriendo[0].nombre + " entró a ejecutarse en el tiempo " + tiempo);
        } else if (contador > 0){ 
            contador--;
            alert("se restó al contador, es "+ contador + " en tiempo " + tiempo);
        }

    //Resto uno a la ejecución
    if (colaCorriendo.length == 1) colaCorriendo[0].tiempoEjecucionAux--;
}

const checkBlockedProcessSRT = (tiempo, tfp) => {
    for (const p of colaBloqueados) {
        if (p.iteracionES === 0) {
            if (p.cantidadR === 0) { //Finalizo el proceso
                colaTerminados.push(p);
                colaAux.push(p);
                p.tiempoFinalizacion = parseInt(tiempo) + parseInt(tfp);
                console.log("El proceso " + p.nombre + " finalizó en el tiempo " + p.tiempoFinalizacion);
            }
            else { //Desbloqueo el proceso
                colaListos.push(p); 
                colaAux.push(p);

                console.log("El proceso " + p.nombre + " se desbloqueó en el tiempo " + tiempo);

                p.tiempoEjecucionAux = p.duracionR;
                p.iteracionES = p.inputR;

                permutarProcesos(tiempo);
            }
        } else 
            p.iteracionES--;
    }

    if (colaAux.length > 0) {
        deleteFromArray(colaBloqueados, colaAux);
        clearArray(colaAux);
    }
}

const simularSRT = (tip, tfp, tcp) => {
    let tiempo = 0;
    let cantidadProcesos = procesos.length;

    //Ordeno los procesos por tiempo de llegada
    procesos.sort((a, b) => a.arrivalTime - b.arrivalTime);

    //Lleno los atributos de los procesos que va a servir para más adelante
    for (const p of procesos) 
        p.arrivalTimeReal = parseInt(p.arrivalTime) + parseInt(tip);

    while (colaTerminados.length != cantidadProcesos) {
        if (colaCorriendo.length > 0) 
            checkRunningProcess(tiempo, tcp);

        newHandler(tiempo);

        if (colaNuevos.length > 0) 
            toReady(tiempo);

        srtRunningHandler(tiempo);

        if (colaBloqueados.length > 0) 
            checkBlockedProcessSRT(tiempo, tfp);
        
        tiempo++;
    }
}
