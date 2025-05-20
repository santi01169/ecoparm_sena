document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('loginModal');
    const openModal = document.getElementById('loginBtn');
    const openFooterModal = document.getElementById('footerLoginBtn');
    const closeModal = document.querySelector('.close-modal');
    const loginForm = document.getElementById('loginForm');
    const tipoUsuario = document.getElementById('tipo-usuario');
    const cedula = document.getElementById('cedula');
    const password = document.getElementById('password');

    const passwordRecoveryForm = document.getElementById('passwordRecoveryForm');
    const recoveryModal = document.getElementById('recoveryModal');
    const openRecoveryBtn = document.getElementById('openRecoveryBtn');
    const closeRecoveryBtn = document.querySelector('.close-recovery-modal');

    // ===== ALERTAS PERSONALIZADAS =====
    function showAlert(type, message, duration = 5000) {
        const existingAlerts = document.querySelectorAll('.ecoparm-alert');
        existingAlerts.forEach(alert => alert.remove());

        const alert = document.createElement('div');
        alert.className = `ecoparm-alert ecoparm-alert-${type}`;
        alert.innerHTML = `
            <div class="ecoparm-alert-content">
                <span class="ecoparm-alert-icon">
                    ${type === 'success' ? '✓' : type === 'error' ? '✗' : '!'}
                </span>
                <span class="ecoparm-alert-message">${message}</span>
                <span class="ecoparm-alert-close">&times;</span>
            </div>
        `;

        document.body.appendChild(alert);

        setTimeout(() => {
            alert.classList.add('show');
        }, 10);

        alert.querySelector('.ecoparm-alert-close').onclick = () => {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 300);
        };

        if (duration) {
            setTimeout(() => {
                alert.classList.remove('show');
                setTimeout(() => alert.remove(), 300);
            }, duration);
        }
    }

    // ===== LIMPIAR FORMULARIO =====
    function limpiarFormulario() {
        if (tipoUsuario) tipoUsuario.value = '';
        if (cedula) cedula.value = '';
        if (password) password.value = '';
        const existingMessages = document.querySelector('.login-messages');
        if (existingMessages) existingMessages.remove();
    }

    // ===== ABRIR MODAL LOGIN =====
    function abrirModal() {
        modal.style.display = 'block';
        limpiarFormulario();
    }

    if (openModal) openModal.onclick = abrirModal;
    if (openFooterModal) openFooterModal.onclick = abrirModal;

    if (closeModal) closeModal.onclick = () => {
        modal.style.display = 'none';
        limpiarFormulario();
    };

    // ===== ABRIR MODAL RECUPERACIÓN =====
    if (openRecoveryBtn) openRecoveryBtn.onclick = () => {
        recoveryModal.style.display = 'block';
    };

    if (closeRecoveryBtn) closeRecoveryBtn.onclick = () => {
        recoveryModal.style.display = 'none';
    };

    // ===== CERRAR MODALES AL CLIC FUERA =====
    window.onclick = function (e) {
        if (e.target === modal || e.target.classList.contains('modal-background')) {
            modal.style.display = 'none';
            limpiarFormulario();
        }
        if (e.target === recoveryModal || e.target.classList.contains('modal-background')) {
            recoveryModal.style.display = 'none';
        }
    };

    // ===== VALIDACIÓN LOGIN =====
    function validateForm() {
        if (!tipoUsuario.value) {
            showAlert('error', 'Por favor seleccione un tipo de usuario');
            tipoUsuario.focus();
            return false;
        }

        if (!cedula.value) {
            showAlert('error', 'Por favor ingrese su número de cédula');
            cedula.focus();
            return false;
        }

        if (!/^\d+$/.test(cedula.value)) {
            showAlert('error', 'La cédula debe contener solo números');
            cedula.focus();
            return false;
        }

        if (!password.value) {
            showAlert('error', 'Por favor ingrese su contraseña');
            password.focus();
            return false;
        }

        return true;
    }

    // ===== LOGIN =====
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();

        if (!validateForm()) return;

        const formData = new FormData(loginForm);

        showAlert('info', 'Verificando credenciales...', null);

        fetch("/login", {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': formData.get('csrfmiddlewaretoken')
            },
            body: formData
        })
        .then(async response => {
            document.querySelector('.ecoparm-alert')?.remove();

            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                throw new Error('Respuesta inesperada del servidor');
            }

            const data = await response.json();

            if (data.success) {
                showAlert('success', 'Inicio de sesión exitoso. Redirigiendo...', 2000);
                setTimeout(() => {
                    window.location.href = data.redirect_url;
                }, 2000);
            } else {
                showAlert('error', data.error || 'Credenciales incorrectas');
                if (data.attempts_remaining !== undefined) {
                    showAlert('warning', `Le quedan ${data.attempts_remaining} intentos.`);
                }
                password.value = '';
                password.focus();
            }
        })
        .catch(error => {
            console.error('Error en login:', error);
            showAlert('error', 'Error de conexión al iniciar sesión');
        });
    });

    // ===== RECUPERACIÓN DE CONTRASEÑA =====
    if (passwordRecoveryForm) {
        passwordRecoveryForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const formData = new FormData(passwordRecoveryForm);
            const email = formData.get('email');
            const newPassword = formData.get('new_password');

            if (!email || !newPassword) {
                showAlert('error', 'Todos los campos son obligatorios');
                return;
            }

            showAlert('info', 'Actualizando contraseña...', null);

            fetch('/recuperar-password', {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': formData.get('csrfmiddlewaretoken')
                },
                body: formData
            })
            .then(async response => {
                document.querySelector('.ecoparm-alert')?.remove();

                const contentType = response.headers.get('content-type') || '';
                if (!contentType.includes('application/json')) {
                    throw new Error('Respuesta inesperada del servidor');
                }

                const data = await response.json();

                if (data.success) {
                    showAlert('success', 'Contraseña cambiada con éxito. Redirigiendo...', 2000);
                    setTimeout(() => {
                        window.location.href = data.redirect_url || '/password-success.html';
                    }, 2000);
                } else {
                    showAlert('error', data.error || 'No se pudo cambiar la contraseña');
                }
            })
            .catch(error => {
                console.error('Error en recuperación:', error);
                showAlert('error', 'Error al actualizar la contraseña');
            });
        });
    }

    // Mostrar mensaje de bienvenida si está en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    if (message) {
        showAlert('success', decodeURIComponent(message));
    }
});
