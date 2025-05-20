window.addEventListener('load', function () {
    // 1. Espera 5 segundos antes de ocultar el loader
    setTimeout(function () {
        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }

        // 2. Muestra el botón de accesibilidad (si existe)
        const accessibilityBtn = document.querySelector('.asw-menu-btn');
        if (accessibilityBtn) {
            accessibilityBtn.style.display = 'flex'; // o 'block' según tu CSS
        }
    }, 2000); // 5000 milisegundos = 5 segundos
});
