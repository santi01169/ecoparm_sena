/**
 * Funcionalidad principal del panel de administración
 * 
 * Este script maneja:
 * - Navegación entre pestañas
 * - Apertura/cierre de modales
 * - Funcionalidad del menú móvil
 */

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // 1. Toggle del menú móvil
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    
    menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('open');
    });

    // 2. Navegación entre pestañas principales
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            // Quitar clase active de todos los items del menú
            document.querySelectorAll('.menu-item').forEach(el => {
                el.classList.remove('active');
            });
            
            // Añadir clase active al item clickeado
            this.classList.add('active');
            
            // Ocultar todos los paneles de contenido
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('active');
            });
            
            // Mostrar el panel de contenido correspondiente
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // 3. Navegación entre pestañas internas (dentro de cada sección)
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // Obtener el contenedor de pestañas padre
            const tabsContainer = this.parentElement;
            
            // Quitar clase active de todas las pestañas en este contenedor
            tabsContainer.querySelectorAll('.tab').forEach(el => {
                el.classList.remove('active');
            });
            
            // Añadir clase active a la pestaña clickeada
            this.classList.add('active');
            
            // Obtener el contenedor de contenido
            const contentContainer = tabsContainer.nextElementSibling;
            
            // Ocultar todos los contenidos
            contentContainer.querySelectorAll('> div').forEach(content => {
                content.classList.remove('active');
            });
            
            // Mostrar el contenido seleccionado
            const contentId = this.getAttribute('data-tab');
            contentContainer.querySelector('#' + contentId)?.classList.add('active');
        });
    });

    // 4. Funcionalidad de los modales
    /**
     * Configura un modal para abrir/cerrar
     * @param {string} triggerBtnId - ID del botón que abre el modal
     * @param {string} modalId - ID del modal a controlar
     */
    function setupModal(triggerBtnId, modalId) {
        const triggerBtn = document.getElementById(triggerBtnId);
        const modal = document.getElementById(modalId);
        if (!triggerBtn || !modal) return;
        
        // Abrir modal al hacer clic en el botón
        triggerBtn.addEventListener('click', function() {
            modal.classList.add('show');
        });
        
        // Cerrar modal al hacer clic en la X
        modal.querySelector('.modal-close').addEventListener('click', function() {
            modal.classList.remove('show');
        });
        
        // Cerrar modal al hacer clic en el botón de cancelar
        const closeBtn = modal.querySelector('.modal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                modal.classList.remove('show');
            });
        }
        
        // Cerrar modal al hacer clic fuera del contenido
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    }

    // Configurar todos los modales
    setupModal('add-user-btn', 'add-user-modal');
    setupModal('add-evidence-btn', 'add-evidence-modal');
    setupModal('create-backup-btn', 'create-backup-modal');

    // 5. Animación de las barras de progreso (solo para demostración)
    document.querySelectorAll('.progress-bar').forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0';
        setTimeout(() => {
            bar.style.width = width;
        }, 300);
    });
});