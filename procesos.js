var cantProcesos = 0;
var matrizProcesos = [];
var procesos = [];

var colaNuevos = [];
var colaListos = [];
var colaCorriendo = []; // Siempre habrá 1 sólo proceso
var colaBloqueados = [];
var colaTerminados = [];
var colaAux = [];

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
            simularFCFS(tip, tcp, tfp);
            break;
        case "Prioridad": 
            break;
        case "RoundRobin": 
            break;
        case "SPN": 
            break;
        case "SRTN": 
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

//Pasa elementos de un array, a otro array y a su vez a un array aux.
const transferTo = () => {}

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

    if (colaCorriendo.length == 0) 
        if (colaListos.length != 0) {
            colaCorriendo.push(colaListos.shift());
            console.log("El proceso " + colaCorriendo[0].nombre + " entró a ejecutarse en el tiempo " + tiempo);
        }

    //Resto uno a la ejecución
    if (colaCorriendo.length == 1) colaCorriendo[0].tiempoEjecucionAux--;
}

const checkRunningProcess = (tiempo) => {
    if (colaCorriendo[0].tiempoEjecucionAux === 0){ 
        colaCorriendo[0].cantidadR--;
        console.log("El proceso " + colaCorriendo[0].nombre + " se bloquéo en el tiempo " + tiempo);
        colaCorriendo[0].iteracionES--;
        colaBloqueados.push(colaCorriendo.shift());
    }
}

const checkBlockedProcess = (tiempo) => {
//let colaAux2 = [];
    for (const p of colaBloqueados) {
        if (p.iteracionES === 0) {
            if (p.cantidadR === 0) {
                colaTerminados.push(p);
                colaAux.push(p);
                console.log("El proceso " + p.nombre + " finalizó en el tiempo " + tiempo);
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

const simularFCFS = (tip) => {
    let tiempo = 0;
    let cantidadProcesos = procesos.length;

    //Ordeno los procesos por tiempo de llegada
    procesos.sort((a, b) => a.arrivalTime - b.arrivalTime);

    //Lleno los atributos de los procesos que va a servir para más adelante
    for (const p of procesos) {
        p.arrivalTimeReal = parseInt(p.arrivalTime) + parseInt(tip);

    }

    while (tiempo <= 15) {
        if (colaCorriendo.length > 0) checkRunningProcess(tiempo);
        if (colaBloqueados.length > 0) checkBlockedProcess(tiempo);

        newHandler(tiempo);
        if (colaNuevos.length > 0) toReady(tiempo);
        runningHandler(tiempo);
    
        tiempo++;
    }
}