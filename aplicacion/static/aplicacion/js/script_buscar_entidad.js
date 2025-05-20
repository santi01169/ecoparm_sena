function filtrarTabla() {
    // Obtiene el valor del input y lo convierte a minúsculas
    const input = document.getElementById("search");
    const filtro = input.value.toLowerCase();
    const tabla = document.getElementById("tabla-emergencia");
    const filas = tabla.getElementsByTagName("tr");

    // Recorre todas las filas de la tabla
    for (let i = 0; i < filas.length; i++) {
        let celdas = filas[i].getElementsByTagName("td");
        let coincide = false;

        // Recorre las celdas de cada fila
        for (let j = 0; j < celdas.length; j++) {
            let textoCelda = celdas[j].textContent || celdas[j].innerText;
            if (textoCelda.toLowerCase().includes(filtro)) {
                coincide = true;
                break;
            }
        }

        // Muestra u oculta la fila según si hay coincidencia
        filas[i].style.display = coincide ? "" : "none";
    }
}