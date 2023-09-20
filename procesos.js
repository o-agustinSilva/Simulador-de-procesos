var cantProcesos = 0;
var matrizProcesos = [];

var colaNuevos = [];
var colaListos = [];
var colaCorriendo = []; // Siempre habrá 1 sólo proceso
var colaBloqueados = [];
var colaTerminados = [];

/* Detección de file input, su procesado y eventual carga a la tabla de procesos*/
const cargarTabla = (fr) => {
    let procesos = fr.result;

    lineas = procesos.split('\n'); //Divido en salto de lineas
    let tabla = document.getElementById('datos-procesos');

    cantProcesos = lineas.length;

    //Agrego los valores a la tabla
    for (let i = 0; i < lineas.length; i++) {
        let valores = lineas[i].split(' '); // DividE la línea en valores
        
        if (valores.length === 6) {         // Verifica que haya 5 valores en cada línea
            let fila = tabla.insertRow();   // Crea una nueva fila
            let proceso = []; //Para ir agregando procesos y agregarlos a la matriz
            for (let j = 0; j < valores.length; j++) {

                //Agrego a la tabla
                let celda = fila.insertCell();  // Crea una nueva celda
                celda.textContent = valores[j]; // Asigna el valor a la celda

                //Agrego al array
                proceso.push(valores[j]); // Agrega el valor directamente
            }

            matrizProcesos.push(proceso);
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

const ejecutarTiemposSO = (t, tiempo) => {
    delay(t);
    tiempo = tiempo + t; //Incremento el tiempo que estuve esperando
}

const getIndex = (matrix, valueToSearch) => {
    let i = 0;

    while (i < matrix.length && matrix[i][4] != valueToSearch) {
        i++;
    }

    if (i == matrix.length) return -1
    else return i;
}

//Ordeno por tiempo de arribo 
const sortMatrix = (a,b) => {
    if (a[4] === b[4])
        return 0;
    else 
        return (a[4] < b[4]) ? -1 : 1;
} 

const simularFCFS = (tip, tcp, tfp) => {
    let tiempo = 0;
    let tandaProcesosFin = false;

    matrizProcesos.sort(sortMatrix);

    let tiempoDeArribo = [];
    for (let i = 0; i < matrizProcesos.length; i++) {
        tiempoDeArribo.push(matrizProcesos[i][4]);
    }

    //Cargo la lista de nuevos
    for (let i = 0; i < matrizProcesos.length; i++) {
        colaNuevos.push(matrizProcesos[i]);
    }

    while (!(colaTerminados.length == matrizProcesos.length)) {

        //Acepto los procesos y pasas a la cola de listos
        if (colaListos.length == 0 && colaBloqueados.length == 0) { 
            for (let i = 0; i < colaNuevos.length; i++) {
                colaListos.push(colaNuevos[i]);
            }
        }
        else
            if (colaBloqueados.length > 0)
                colaListos.push(colaBloqueados.shift());
        
        //Corre el primer proceso y lo saca de la cola de listos
        if (colaListos.length > 0){
            colaCorriendo.push(colaListos.shift());
            //tiempo += (colaListos.length == 1? colaCorriendo[2] : colaCorriendo[0][2]);
            tiempo += parseInt(colaCorriendo[0][2]);
            alert("el tiempo es: " + tiempo);
            colaCorriendo[0][1] -= 1;
        }
        
        //Si no hay más repeticiones para el proceso, lo agrego a la cola de terminados
        if (colaCorriendo[0][1] == 0) {
            colaTerminados.push(colaCorriendo.shift());
            alert("Se terminó de ejecutar el proceso " + colaTerminados[colaTerminados.length-1][0]);
        }
        else
            colaBloqueados.push(colaCorriendo.shift());

    }

    alert(tiempo);
}
