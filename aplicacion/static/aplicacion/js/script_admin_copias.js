document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const modals = {
        create: document.getElementById('create-backup-modal'),
        download: document.getElementById('download-modal'),
        restore: document.getElementById('restore-modal'),
        delete: document.getElementById('delete-modal')
    };
    
    // Botones de acción
    const actionButtons = {
        create: document.getElementById('create-backup-btn'),
        download: document.querySelectorAll('.download-btn'),
        restore: document.querySelectorAll('.restore-btn'),
        delete: document.querySelectorAll('.delete-btn')
    };
    
    // Botones de confirmación
    const confirmButtons = {
        create: document.querySelector('#create-backup-modal .btn-primary'),
        download: document.getElementById('confirm-download'),
        restore: document.getElementById('confirm-restore'),
        delete: document.getElementById('confirm-delete')
    };
    
    // Variables de estado
    let currentBackupId = null;
    
    // Inicializar eventos
    initModals();
    initActionButtons();
    initProgressBar();
    initFormSubmissions();
    
    function initModals() {
        // Abrir modales
        if (actionButtons.create) {
            actionButtons.create.addEventListener('click', () => openModal('create'));
        }
        
        // Cerrar modales
        document.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
            btn.addEventListener('click', closeAllModals);
        });
        
        // Cerrar al hacer clic fuera del contenido
        Object.values(modals).forEach(modal => {
            if (modal) {
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        closeAllModals();
                    }
                });
                
                const modalContent = modal.querySelector('.modal');
                if (modalContent) {
                    modalContent.addEventListener('click', e => e.stopPropagation());
                }
            }
        });
    }
    
    function initActionButtons() {
        // Configurar eventos para botones de acción en la tabla
        actionButtons.download.forEach(btn => {
            btn.addEventListener('click', function() {
                const row = this.closest('tr');
                currentBackupId = row.dataset.backupId || row.querySelector('td').textContent;
                document.getElementById('download-filename').textContent = currentBackupId;
                openModal('download');
            });
        });
        
        actionButtons.restore.forEach(btn => {
            btn.addEventListener('click', function() {
                const row = this.closest('tr');
                currentBackupId = row.dataset.backupId || row.querySelector('td').textContent;
                document.getElementById('restore-filename').textContent = currentBackupId;
                openModal('restore');
            });
        });
        
        actionButtons.delete.forEach(btn => {
            btn.addEventListener('click', function() {
                const row = this.closest('tr');
                currentBackupId = row.dataset.backupId || row.querySelector('td').textContent;
                document.getElementById('delete-filename').textContent = currentBackupId;
                openModal('delete');
            });
        });
    }
    
    function initProgressBar() {
        // Actualizar visualización de la barra de progreso
        const progressBar = document.querySelector('.progress-bar .progress');
        if (progressBar) {
            const usedGB = parseFloat(progressBar.style.width) / 100 * 5; // 5GB es el total
            document.querySelector('.storage-info span:first-child').textContent = 
                `${usedGB.toFixed(1)} GB / 5 GB`;
            document.querySelector('.storage-info span:last-child').textContent = 
                `${progressBar.style.width}`;
        }
    }
    
    function initFormSubmissions() {
        // Configurar envío de formularios
        if (confirmButtons.create) {
            confirmButtons.create.addEventListener('click', createBackup);
        }
        
        if (confirmButtons.download) {
            confirmButtons.download.addEventListener('click', downloadBackup);
        }
        
        if (confirmButtons.restore) {
            confirmButtons.restore.addEventListener('click', restoreBackup);
        }
        
        if (confirmButtons.delete) {
            confirmButtons.delete.addEventListener('click', deleteBackup);
        }
    }
    
    function openModal(modalType) {
        if (modals[modalType]) {
            modals[modalType].classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }
    
    function closeAllModals() {
        Object.values(modals).forEach(modal => {
            if (modal) modal.classList.remove('show');
        });
        document.body.style.overflow = '';
        currentBackupId = null;
    }
    
    // Funciones para manejar las acciones
    function createBackup() {
        const backupName = document.querySelector('#create-backup-modal input[type="text"]').value;
        const backupType = document.querySelector('#create-backup-modal select').value;
        const includeDb = document.querySelector('#create-backup-modal input[type="checkbox"]:nth-of-type(1)').checked;
        const includeFiles = document.querySelector('#create-backup-modal input[type="checkbox"]:nth-of-type(2)').checked;
        const includeConfig = document.querySelector('#create-backup-modal input[type="checkbox"]:nth-of-type(3)').checked;
        
        fetch('/admin/backups/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                action: 'create',
                backup_name: backupName,
                backup_type: backupType,
                include_db: includeDb,
                include_files: includeFiles,
                include_config: includeConfig
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                closeAllModals();
                addBackupToTable(data.backup);
                updateStorageDisplay();
                showAlert('success', 'Copia de seguridad creada exitosamente');
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            showAlert('error', `Error al crear copia: ${error.message}`);
        });
    }
    
    function downloadBackup() {
        const includeMetadata = document.getElementById('include-metadata').checked;
        
        fetch(`/admin/backups/${currentBackupId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                action: 'download',
                include_metadata: includeMetadata
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                closeAllModals();
                // En producción, aquí manejarías la descarga del archivo
                showAlert('success', `Iniciando descarga de ${currentBackupId}`);
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            showAlert('error', `Error al descargar: ${error.message}`);
        });
    }
    
    function restoreBackup() {
        const restoreOption = document.getElementById('restore-option').value;
        
        if (!confirm(`¿ESTÁ SEGURO? Esta acción RESTAURARÁ el sistema desde ${currentBackupId} y puede sobrescribir datos actuales.`)) {
            return;
        }
        
        fetch(`/admin/backups/${currentBackupId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                action: 'restore',
                restore_option: restoreOption
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                closeAllModals();
                showAlert('success', `Sistema restaurado desde ${currentBackupId}`);
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            showAlert('error', `Error al restaurar: ${error.message}`);
        });
    }
    
    function deleteBackup() {
        fetch(`/admin/backups/${currentBackupId}/`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                closeAllModals();
                removeBackupFromTable(currentBackupId);
                updateStorageDisplay();
                showAlert('success', `Copia ${currentBackupId} eliminada`);
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            showAlert('error', `Error al eliminar: ${error.message}`);
        });
    }
    
    // Funciones auxiliares
    function addBackupToTable(backupData) {
        const tbody = document.querySelector('table tbody');
        const newRow = document.createElement('tr');
        newRow.dataset.backupId = backupData.id;
        
        newRow.innerHTML = `
            <td>${backupData.nombre}</td>
            <td>${backupData.fecha}</td>
            <td>${backupData.tamano}</td>
            <td>${backupData.creado_por}</td>
            <td><span class="badge badge-success">${backupData.estado}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn download-btn" title="Descargar" data-backup-id="${backupData.id}">
                        <i class="fas fa-download"></i> Descargar
                    </button>
                    <button class="action-btn restore-btn" title="Restaurar" data-backup-id="${backupData.id}">
                        <i class="fas fa-undo"></i> Restaurar
                    </button>
                    <button class="action-btn delete-btn" title="Eliminar" data-backup-id="${backupData.id}">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </td>
        `;
        
        tbody.prepend(newRow);
        initActionButtons(); // Re-inicializar eventos para los nuevos botones
    }
    
    function removeBackupFromTable(backupId) {
        const row = document.querySelector(`tr[data-backup-id="${backupId}"]`);
        if (row) row.remove();
    }
    
    function updateStorageDisplay() {
        fetch('/admin/backups/storage/')
            .then(response => response.json())
            .then(data => {
                const percentage = (data.used / data.total) * 100;
                const progressBar = document.querySelector('.progress-bar .progress');
                if (progressBar) {
                    progressBar.style.width = `${percentage}%`;
                    document.querySelector('.storage-info span:first-child').textContent = 
                        `${data.used.toFixed(1)} GB / ${data.total} GB`;
                    document.querySelector('.storage-info span:last-child').textContent = 
                        `${percentage.toFixed(1)}%`;
                }
            });
    }
    
    function showAlert(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            ${message}
            <button class="close-alert">&times;</button>
        `;
        
        const container = document.querySelector('.main-content');
        container.prepend(alertDiv);
        
        setTimeout(() => {
            alertDiv.classList.add('fade-out');
            setTimeout(() => alertDiv.remove(), 500);
        }, 5000);
        
        alertDiv.querySelector('.close-alert').addEventListener('click', () => {
            alertDiv.remove();
        });
    }
    
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});