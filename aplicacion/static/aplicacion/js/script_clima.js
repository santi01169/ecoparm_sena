const apiKey = "d4ddfc4bc2a5af2d893c5ad9c9553fd8"; 
const city = "Sogamoso"; 
const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=es`;

async function obtenerClima() {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Error en la petición");
        }
        const data = await response.json();

        document.getElementById("ciudad").textContent = data.name;
        document.getElementById("temperatura").textContent = `🌡️ ${data.main.temp}°C`;
        document.getElementById("humedad").textContent = `💧 Humedad: ${data.main.humidity}%`;
        document.getElementById("descripcion").textContent = `☁️ ${data.weather[0].description}`;
    } catch (error) {
        console.error("Error al obtener los datos del clima", error);
        document.getElementById("clima").textContent = "No se pudo obtener el clima.";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    obtenerClima();
    setInterval(obtenerClima, 300000);

    const btnToggle = document.getElementById("toggleClima");
    const textoClima = document.getElementById("textoClima");
    const divClima = document.getElementById("clima");

    // Función para mostrar el clima
    function mostrarClima() {
        divClima.style.display = "block";
        textoClima.style.display = "inline";
        obtenerClima();
    }

    // Función para ocultar el clima
    function ocultarClima() {
        divClima.style.display = "none";
        textoClima.style.display = "none";
    }

    // Evento para el botón del clima
    btnToggle.addEventListener("click", (e) => {
        e.stopPropagation(); // Evita que el evento se propague al documento
        if (divClima.style.display === "none" || divClima.style.display === "") {
            mostrarClima();
        } else {
            ocultarClima();
        }
    });

    // Cerrar al hacer clic fuera del modal
    document.addEventListener("click", (e) => {
        // Si el clic no fue dentro del modal ni en el botón del clima
        if (!divClima.contains(e.target) && e.target !== btnToggle) {
            ocultarClima();
        }
    });

    // Evitar que el clic dentro del modal lo cierre
    divClima.addEventListener("click", (e) => {
        e.stopPropagation();
    });
});