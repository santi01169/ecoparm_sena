document.addEventListener('DOMContentLoaded', function () {
    // Abrir modal
    const addBtn = document.getElementById('add-evidence-btn');
    if (addBtn) {
        addBtn.addEventListener('click', function () {
            const modal = document.getElementById('add-evidence-modal');
            modal.classList.add('show');
        });
    }

    // Cerrar modal con botón x
    const closeX = document.querySelector('.modal-close');
    if (closeX) {
        closeX.addEventListener('click', function () {
            document.getElementById('add-evidence-modal').classList.remove('show');
        });
    }

    // Cerrar modal con botón cancelar
    const closeBtn = document.querySelector('.modal-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            document.getElementById('add-evidence-modal').classList.remove('show');
        });
    }

    // Cambiar pestañas
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Manejo del botón de descarga
    document.querySelectorAll('.download-btn').forEach(btn => {
        const dropdown = btn.nextElementSibling;

        btn.addEventListener('click', function (e) {
            e.stopPropagation(); // Prevenir que se cierre al hacer clic
            // Ocultar otros dropdowns
            document.querySelectorAll('.dropdown-content').forEach(dc => {
                if (dc !== dropdown) dc.style.display = 'none';
            });
            // Alternar visibilidad
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });
    });

    // Cerrar cualquier dropdown al hacer clic fuera
    document.addEventListener('click', function () {
        document.querySelectorAll('.dropdown-content').forEach(dc => {
            dc.style.display = 'none';
        });
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // Ocultar menú hamburguesa
    const menuToggle = document.querySelector('.sidebar-toggle, .navbar-toggler, [data-toggle="sidebar"]');
    if (menuToggle) menuToggle.style.display = 'none';

    // Ocultar iconos de carpetas
    const folderIcons = document.querySelectorAll('.fa-folder, .fas.fa-folder, i[class*="folder"]');
    folderIcons.forEach(icon => icon.style.display = 'none');

    // Ajustar margen del contenido principal
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.marginLeft = '0';
        mainContent.style.width = '100%';
    }
});