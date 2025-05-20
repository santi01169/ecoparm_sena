document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('video-ubicacion');
    
    // Configuración del Intersection Observer
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.7 // Cuando el 70% del video es visible
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Intenta reproducir el video
                video.play()
                    .then(() => {
                        console.log('Video reproducido automáticamente');
                    })
                    .catch(error => {
                        console.log('Autoplay no permitido:', error);
                        // Mostrar botón de play manual si falla
                        video.controls = true;
                    });
            } else {
                // Pausa y rebobina el video cuando no es visible
                video.pause();
                video.currentTime = 0;
            }
        });
    }, observerOptions);

    // Observar el video
    observer.observe(video);

    // Pausar cuando cambia de pestaña
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            video.pause();
        } else if (isElementInViewport(video)) {
            video.play().catch(e => console.log("Error al reanudar:", e));
        }
    });

    // Función auxiliar para verificar si el elemento está visible
    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
});