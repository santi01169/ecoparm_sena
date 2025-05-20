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