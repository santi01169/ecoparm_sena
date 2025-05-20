document.addEventListener('DOMContentLoaded', function() {
    // Obtener el modal y el contenido de la imagen ampliada
    const imageModal = document.getElementById('imageModal');
    const expandedImg = document.getElementById('expandedImg');
    const closeModal = document.querySelector('.close-modal-imagen-expandida');
    const prevBtn = document.querySelector('.nav-prev');
    const nextBtn = document.querySelector('.nav-next');

    // Obtener todas las imágenes de la galería y los botones de ampliar
    const galleryImages = document.querySelectorAll('.gallery-image');
    const galleryBtns = document.querySelectorAll('.gallery-view-btn');
    
    // Variable para almacenar el índice de la imagen actual
    let currentImageIndex = 0;
    
    // Función para abrir el modal y mostrar la imagen ampliada
    function openModal(imageSrc, index) {
        expandedImg.src = imageSrc;  // Establecer la fuente de la imagen ampliada
        currentImageIndex = index;   // Guardar el índice de la imagen actual
        imageModal.style.display = 'flex';  // Mostrar el modal
    }
    
    // Función para navegar a la imagen anterior
    function prevImage() {
        currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
        expandedImg.src = galleryImages[currentImageIndex].src;
    }
    
    // Función para navegar a la siguiente imagen
    function nextImage() {
        currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
        expandedImg.src = galleryImages[currentImageIndex].src;
    }

    // Agregar evento a cada imagen para abrir el modal al hacer clic en la imagen
    galleryImages.forEach((image, index) => {
        image.addEventListener('click', function() {
            openModal(image.src, index);  // Llama a la función con la imagen clickeada y su índice
        });
    });

    // Agregar evento a cada botón para abrir el modal al hacer clic en el botón de ampliar
    galleryBtns.forEach((btn, index) => {
        btn.addEventListener('click', function() {
            const image = this.closest('.gallery-card').querySelector('.gallery-image');
            openModal(image.src, index);  // Llama a la función con la imagen asociada al botón y su índice
        });
    });

    // Cerrar el modal cuando se hace clic en la "X"
    closeModal.addEventListener('click', function() {
        imageModal.style.display = 'none';  // Ocultar el modal correctamente
    });

    // Navegar a la imagen anterior
    prevBtn.addEventListener('click', prevImage);
    
    // Navegar a la siguiente imagen
    nextBtn.addEventListener('click', nextImage);
    
    // Navegación con teclas de flecha
    document.addEventListener('keydown', function(event) {
        if (imageModal.style.display === 'flex') {
            if (event.key === 'ArrowLeft') {
                prevImage();
            } else if (event.key === 'ArrowRight') {
                nextImage();
            } else if (event.key === 'Escape') {
                imageModal.style.display = 'none';
            }
        }
    });

    // Cerrar el modal cuando se hace clic fuera de la imagen ampliada
    window.addEventListener('click', function(event) {
        if (event.target === imageModal) {
            imageModal.style.display = 'none';  // Ocultar el modal
        }
    });
});