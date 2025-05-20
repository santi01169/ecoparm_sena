document.addEventListener('DOMContentLoaded', function () {
    // --- Cambio de pestañas ---
    const tabs = document.querySelectorAll('.profile-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // --- Manejo de foto de perfil ---
    const fotoInput = document.getElementById('foto-input');
    const imgPreview = document.getElementById('profile-img-preview');
    const changePhotoBtn = document.getElementById('change-photo-btn');
    const photoForm = document.getElementById('photo-form');

    if (changePhotoBtn) {
        changePhotoBtn.addEventListener('click', function () {
            fotoInput.click();
        });
    }

    if (fotoInput && imgPreview) {
        fotoInput.addEventListener('change', function () {
            const file = this.files[0];
            if (file) {
                showConfirmationDialog(
                    'Cambiar foto de perfil',
                    '¿Estás seguro de que deseas actualizar tu foto de perfil?',
                    function () {
                        // Validaciones de archivo
                        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
                        const maxSize = 5 * 1024 * 1024; // 5MB

                        if (!validTypes.includes(file.type)) {
                            showInlineError('foto-input', 'Formato no válido. Sube una imagen JPEG o PNG');
                            return;
                        }

                        if (file.size > maxSize) {
                            showInlineError('foto-input', 'La imagen no debe exceder los 5MB');
                            return;
                        }

                        const img = new Image();
                        img.src = URL.createObjectURL(file);
                        img.onload = function () {
                            if (this.width < 100 || this.height < 100) {
                                showInlineError('foto-input', 'La imagen es muy pequeña (mínimo 100x100px)');
                                return;
                            }
                            imgPreview.src = this.src;
                            uploadProfilePhoto(file);
                        };
                    },
                    {
                        confirmText: 'Sí, cambiar',
                        cancelText: 'No, mantener'
                    }
                );
            }
        });
    }

    function uploadProfilePhoto(file) {
        const uploadUrl = imgPreview.dataset.uploadUrl;
        const defaultAvatar = imgPreview.dataset.defaultAvatar;
        const isFirstUpload = imgPreview.src.includes(defaultAvatar);

        const formData = new FormData();
        formData.append('foto_perfil', file);
        formData.append('csrfmiddlewaretoken', document.querySelector('[name=csrfmiddlewaretoken]').value);

        changePhotoBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
        changePhotoBtn.disabled = true;

        fetch(uploadUrl, {
            method: 'POST',
            body: formData,
        })
            .then(response => {
                if (!response.ok) throw new Error('Error en la respuesta del servidor');
                return response.json();
            })
            .then(data => {
                if (data.success && data.foto_url) {
                    imgPreview.src = data.foto_url;
                    showEcoparmAlert(
                        'Foto de perfil',
                        isFirstUpload ? '¡Foto de perfil establecida con éxito!' : 'Foto de perfil actualizada correctamente',
                        {
                            buttonText: 'Entendido'
                        }
                    );
                } else {
                    throw new Error(data.error || 'Error desconocido');
                }
            })
            .catch(error => {
                console.error('Error al subir imagen:', error);
                let errorMessage = 'Error al actualizar la foto';

                if (error.message.includes('Tamaño')) {
                    errorMessage = 'La imagen es demasiado grande (máximo 5MB)';
                } else if (error.message.includes('formato')) {
                    errorMessage = 'Formato no válido (solo JPG/PNG)';
                } else {
                    errorMessage = error.message;
                }

                showInlineError('foto-input', errorMessage);
                if (!isFirstUpload) {
                    imgPreview.src = defaultAvatar;
                }
            })
            .finally(() => {
                changePhotoBtn.innerHTML = 'Cambiar Foto';
                changePhotoBtn.disabled = false;
                fotoInput.value = '';
            });
    }

    // --- Guardar cambios básicos del perfil ---
    const saveBtn = document.getElementById('save-profile-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', function (e) {
            e.preventDefault();
            saveProfileChanges();
        });
    }

    function saveProfileChanges() {
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        saveBtn.disabled = true;

        // Simulación de guardado
        setTimeout(() => {
            saveBtn.innerHTML = '<i class="fas fa-check"></i> Guardado';
            showEcoparmAlert('Cambios guardados', 'Los cambios se han guardado correctamente', {
                buttonText: 'Aceptar'
            });

            setTimeout(() => {
                saveBtn.innerHTML = originalText;
                saveBtn.disabled = false;
            }, 2000);
        }, 1500);
    }

    // --- Cambiar Contraseña ---
    const passwordForm = document.getElementById('password-form');
    const savePasswordBtn = document.getElementById('save-password-btn');

    if (passwordForm && savePasswordBtn) {
        passwordForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Validaciones previas a la confirmación
            const formData = new FormData(passwordForm);
            const data = {
                current_password: formData.get('current_password'),
                new_password: formData.get('new_password'),
                confirm_password: formData.get('confirm_password')
            };

            if (!data.current_password) {
                showInlineError('current-password', 'Debes ingresar tu contraseña actual');
                return;
            }

            if (data.new_password.length < 8) {
                showInlineError('new-password', 'La contraseña debe tener al menos 8 caracteres', 'Mínimo 8 caracteres');
                return;
            }

            if (!/[A-Z]/.test(data.new_password)) {
                showInlineError('new-password', 'La contraseña debe contener al menos una mayúscula');
                return;
            }

            if (!/[0-9]/.test(data.new_password)) {
                showInlineError('new-password', 'La contraseña debe contener al menos un número');
                return;
            }

            if (data.new_password !== data.confirm_password) {
                showInlineError('confirm-password', 'Las contraseñas no coinciden');
                return;
            }

            if (data.current_password === data.new_password) {
                showInlineError('new-password', 'La nueva contraseña debe ser diferente a la actual');
                return;
            }

            // Mostrar confirmación antes de cambiar
            showConfirmationDialog(
                'Cambiar contraseña',
                '¿Estás seguro de que deseas cambiar tu contraseña?',
                function () {
                    // Proceder con el cambio
                    const originalText = savePasswordBtn.innerHTML;
                    savePasswordBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
                    savePasswordBtn.disabled = true;

                    fetch(CHANGE_PASSWORD_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                        },
                        body: JSON.stringify(data)
                    })
                        .then(response => {
                            if (response.status === 400) {
                                return response.json().then(errData => {
                                    throw new Error(errData.error || 'Error en la solicitud');
                                });
                            }
                            if (!response.ok) throw new Error('Error en la respuesta del servidor');
                            return response.json();
                        })
                        .then(data => {
                            if (data.success) {
                                showEcoparmAlert('Contraseña actualizada', 'Tu contraseña ha sido cambiada exitosamente', {
                                    buttonText: 'Aceptar',
                                    autocloseTime: 2000,
                                    onAccept: function () {
                                        passwordForm.reset();
                                    }
                                });
                            } else {
                                throw new Error(data.error || 'Error al cambiar la contraseña');
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            let errorMessage = error.message;

                            if (error.message.includes('incorrecta')) {
                                errorMessage = 'La contraseña actual es incorrecta';
                                showInlineError('current-password', errorMessage);
                            } else if (error.message.includes('similar')) {
                                errorMessage = 'La contraseña es demasiado similar a tu información personal';
                                showInlineError('new-password', errorMessage);
                            } else if (error.message.includes('común')) {
                                errorMessage = 'Esta contraseña es muy común, elige una más segura';
                                showInlineError('new-password', errorMessage);
                            } else {
                                showInlineError('current-password', errorMessage);
                            }
                        })
                        .finally(() => {
                            savePasswordBtn.innerHTML = '<i class="fas fa-save"></i> Cambiar Contraseña';
                            savePasswordBtn.disabled = false;
                        });
                },
                {
                    confirmText: 'Sí, cambiar',
                    cancelText: 'Cancelar'
                }
            );
        });
    }

    // --- Mostrar notificaciones ---
    function showToast(message, type = 'success') {
        // Eliminar toasts anteriores si existen
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());

        // Crear toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        // Configurar contenido
        let icon, title;
        switch (type) {
            case 'success':
                icon = 'fas fa-check-circle';
                title = 'Éxito';
                break;
            case 'error':
                icon = 'fas fa-times-circle';
                title = 'Error';
                break;
            case 'warning':
                icon = 'fas fa-exclamation-triangle';
                title = 'Advertencia';
                break;
            default:
                icon = 'fas fa-info-circle';
                title = 'Información';
        }

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${icon}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;

        document.body.appendChild(toast);

        // Mostrar con animación
        setTimeout(() => toast.classList.add('show'), 10);

        // Auto-eliminar después de 5 segundos
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    // --- Activadores de switches si existen ---
    const toggleSwitches = document.querySelectorAll('.toggle-switch');
    toggleSwitches.forEach(switchEl => {
        switchEl.addEventListener('click', function () {
            this.classList.toggle('active');
            // Puedes añadir aquí la lógica para guardar el estado
        });
    });
});

// ==================== FUNCIONES DE ALERTAS ECOPARM ====================

// Función para mostrar diálogos de confirmación
function showConfirmationDialog(title, message, confirmCallback, options = {}) {
    showEcoparmAlert(title, message, {
        buttonText: options.confirmText || 'Confirmar',
        autoclose: false, // Siempre requerir interacción para confirmaciones
        onAccept: confirmCallback,
        showCancel: true
    });
}

function showEcoparmAlert(title, message, options = {}) {
    const alert = document.getElementById('custom-alert');
    const progressContainer = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const alertFooter = document.querySelector('.ecoparm-alert-footer');

    // Configurar contenido
    document.getElementById('alert-title').textContent = title;
    document.getElementById('alert-message').textContent = message;

    // Configurar progreso si se especifica
    if (options.progress !== undefined) {
        progressContainer.style.display = 'block';
        progressFill.style.width = options.progress + '%';
        progressText.textContent = options.progress + '%';
    } else {
        progressContainer.style.display = 'none';
    }

    // Configurar botones
    alertFooter.innerHTML = ''; // Limpiar botones anteriores

    if (options.showCancel) {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'ecoparm-alert-button cancel';
        cancelBtn.textContent = options.cancelText || 'Cancelar';
        cancelBtn.onclick = function () {
            closeAlert();
            if (options.onCancel) options.onCancel();
        };
        alertFooter.appendChild(cancelBtn);
    }

    const okBtn = document.createElement('button');
    okBtn.className = 'ecoparm-alert-button confirm';
    okBtn.textContent = options.buttonText || 'Aceptar';
    okBtn.onclick = function () {
        closeAlert();
        if (options.onAccept) options.onAccept();
    };
    alertFooter.appendChild(okBtn);

    // Mostrar alerta
    alert.classList.remove('hidden');

    // Configurar autoclose si no es una confirmación
    const autocloseTime = options.autoclose === false ? null : (options.autocloseTime || 5000);

    if (autocloseTime && !options.showCancel) {
        // Limpiar timeout anterior si existe
        if (alert.timeoutId) {
            clearTimeout(alert.timeoutId);
        }

        alert.timeoutId = setTimeout(() => {
            closeAlert();
            if (options.onAccept) options.onAccept();
        }, autocloseTime);
    }

    function closeAlert() {
        alert.classList.add('hidden');
        if (alert.timeoutId) {
            clearTimeout(alert.timeoutId);
            alert.timeoutId = null;
        }
    }
}

function showInlineError(inputId, message, hint = '') {
    const inputElement = document.getElementById(inputId);
    const errorContainer = document.getElementById('inline-error');

    if (inputElement) {
        inputElement.classList.add('input-error');

        // Configurar mensajes
        document.getElementById('error-message-text').textContent = message;
        document.getElementById('error-hint-text').textContent = hint;

        // Posicionar después del campo
        inputElement.insertAdjacentElement('afterend', errorContainer);
        errorContainer.style.display = 'block';
    }
}

function hideInlineError(inputId) {
    const inputElement = document.getElementById(inputId);
    const errorContainer = document.getElementById('inline-error');

    if (inputElement) {
        inputElement.classList.remove('input-error');
    }
    errorContainer.style.display = 'none';
}

// Función de compatibilidad para mantener tu código existente
function showCustomAlert(options) {
    showEcoparmAlert(options.title || "Alerta", options.message || "", {
        buttonText: options.buttonText || "Aceptar",
        onAccept: options.onAccept
    });
}