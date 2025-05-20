document.addEventListener('DOMContentLoaded', function () {
    console.log("⚙️ Script validar_usuario.js cargado");

    // 1. Funciones auxiliares
    function getCSRFToken() {
        const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
        return csrfInput ? csrfInput.value : '';
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }, 100);
    }

    function mostrarError(campo, mensaje) {
        campo.classList.add('is-invalid');
        const errorFeedback = campo.nextElementSibling;
        if (errorFeedback && errorFeedback.classList.contains('invalid-feedback')) {
            errorFeedback.textContent = mensaje;
        }
    }

    function limpiarErrores() {
        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        document.querySelectorAll('.invalid-feedback').forEach(el => el.textContent = '');
    }

    // 2. Crear usuario
    const saveBtn = document.getElementById('guardar-usuario');
    if (saveBtn) {
        saveBtn.addEventListener('click', async function (e) {
            e.preventDefault();
            
            if (!validarFormularioCreacion()) {
                const mensaje = document.getElementById('mensaje-usuario');
                mensaje.textContent = "Por favor corrija los errores en el formulario";
                mensaje.style.color = 'red';
                return;
            }

            const guardarText = document.getElementById('guardar-text');
            const guardarSpinner = document.getElementById('guardar-spinner');
            guardarText.style.display = 'none';
            guardarSpinner.style.display = 'inline-block';
            saveBtn.disabled = true;

            const formData = new FormData();
            formData.append('nombre', document.getElementById('nombre').value.trim());
            formData.append('apellido', document.getElementById('apellidos').value.trim());
            formData.append('telefono', document.getElementById('telefono').value.trim());
            formData.append('identificacion', document.getElementById('identificacion').value.trim());
            formData.append('email', document.getElementById('email').value.trim().toLowerCase());
            formData.append('password', document.getElementById('password').value);
            formData.append('confirmPassword', document.getElementById('confirm-password').value);
            formData.append('rol', document.getElementById('rol').value);
            formData.append('zona', document.getElementById('zona').value);
            formData.append('csrfmiddlewaretoken', getCSRFToken());

            try {
                const response = await fetch('', {
                    method: 'POST',
                    body: formData,
                    headers: { 'X-Requested-With': 'XMLHttpRequest' }
                });

                const data = await response.json();
                const mensaje = document.getElementById('mensaje-usuario');

                if (!response.ok) throw new Error(data.error || 'Error del servidor');

                mensaje.textContent = data.message || "✅ Usuario creado correctamente";
                mensaje.style.color = 'green';
                setTimeout(() => window.location.reload(), 2000);

            } catch (error) {
                const mensaje = document.getElementById('mensaje-usuario');
                mensaje.textContent = error.message.includes('cedula') 
                    ? 'La cédula ya está registrada' 
                    : error.message;
                mensaje.style.color = 'red';
            } finally {
                guardarText.style.display = 'inline-block';
                guardarSpinner.style.display = 'none';
                saveBtn.disabled = false;
            }
        });
    }

    function validarFormularioCreacion() {
        limpiarErrores();
        let valido = true;
        const campos = {
            nombre: document.getElementById('nombre'),
            apellidos: document.getElementById('apellidos'),
            telefono: document.getElementById('telefono'),
            identificacion: document.getElementById('identificacion'),
            email: document.getElementById('email'),
            password: document.getElementById('password'),
            confirmPassword: document.getElementById('confirm-password')
        };
        // Añadir validaciones si lo deseas
        return valido;
    }

function eliminarUsuario(userId) {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

    const csrfToken = getCSRFToken();
    
    fetch(`/usuarios/${userId}/eliminar/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            csrfmiddlewaretoken: csrfToken
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || 'Error del servidor'); });
        }
        return response.json();
    })
    .then(data => {
        if (!data.success) {
            throw new Error(data.error || 'Error al eliminar usuario');
        }
        
        const row = document.querySelector(`tr[data-user-id="${userId}"]`);
        if (row) {
            row.style.transition = 'opacity 0.3s ease';
            row.style.opacity = '0';
            setTimeout(() => row.remove(), 300);
        }
        showToast(data.message || 'Usuario eliminado correctamente', 'success');
    })
    .catch(error => {
        showToast(error.message, 'error');
        console.error('Error:', error);
    });
}

    // 4. Editar usuario
    function abrirModalEdicion(userId) {
        console.log("🔧 Clic en botón editar con ID:", userId);  // ✅ Mensaje clave

        const modal = document.getElementById('edit-user-modal');
        const spinner = document.getElementById('actualizar-spinner');
        const text = document.getElementById('actualizar-text');
        const mensaje = document.getElementById('edit-mensaje-usuario');

        if (spinner) spinner.style.display = 'inline-block';
        if (text) text.style.display = 'none';
        if (mensaje) mensaje.textContent = '';
        limpiarErrores();

        fetch(`/usuarios/${userId}/editar/`, {
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('Error al obtener datos');
            return response.json();
        })
        .then(data => {
            if (!data.success) throw new Error(data.error);
            document.getElementById('edit-usuario-id').value = data.usuario.id;
            document.getElementById('edit-nombre').value = data.usuario.nombre || '';
            document.getElementById('edit-apellidos').value = data.usuario.apellido || '';
            document.getElementById('edit-telefono').value = data.usuario.telefono || '';
            document.getElementById('edit-identificacion').value = data.usuario.cedula || '';
            document.getElementById('edit-email').value = data.usuario.email || '';
            document.getElementById('edit-rol').value = data.usuario.rol || 'Usuario';
            document.getElementById('edit-zona').value = data.usuario.zona || '3';
            modal.classList.add('show');
            document.body.classList.add('modal-open');
        })
        .catch(error => {
            showToast('Error al cargar datos: ' + error.message, 'error');
        })
        .finally(() => {
            if (spinner) spinner.style.display = 'none';
            if (text) text.style.display = 'inline-block';
        });
    }

    function actualizarUsuario() {
        if (!validarFormularioEdicion()) {
            const mensaje = document.getElementById('edit-mensaje-usuario');
            mensaje.textContent = "Por favor corrija los errores en el formulario";
            mensaje.style.color = 'red';
            return;
        }

        const userId = document.getElementById('edit-usuario-id').value;
        const csrfToken = getCSRFToken();
        const mensaje = document.getElementById('edit-mensaje-usuario');
        const spinner = document.getElementById('actualizar-spinner');
        const text = document.getElementById('actualizar-text');

        spinner.style.display = 'inline-block';
        text.style.display = 'none';

        const formData = new FormData();
        formData.append('nombre', document.getElementById('edit-nombre').value.trim());
        formData.append('apellido', document.getElementById('edit-apellidos').value.trim());
        formData.append('telefono', document.getElementById('edit-telefono').value.trim());
        formData.append('identificacion', document.getElementById('edit-identificacion').value.trim());
        formData.append('email', document.getElementById('edit-email').value.trim().toLowerCase());
        formData.append('rol', document.getElementById('edit-rol').value);
        formData.append('zona', document.getElementById('edit-zona').value);
        formData.append('csrfmiddlewaretoken', csrfToken);

        fetch(`/usuarios/${userId}/actualizar/`, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) throw new Error(data.error || 'Error al actualizar usuario');
            mensaje.textContent = data.message || 'Usuario actualizado correctamente';
            mensaje.style.color = 'green';
            showToast(data.message || 'Cambios guardados', 'success');
            setTimeout(() => {
                document.getElementById('edit-user-modal').style.display = 'none';
                document.body.classList.remove('modal-open');
                window.location.reload();
            }, 1500);
        })
        .catch(error => {
            mensaje.textContent = error.message.includes('cedula') 
                ? 'La cédula ya está registrada' 
                : error.message;
            mensaje.style.color = 'red';
        })
        .finally(() => {
            spinner.style.display = 'none';
            text.style.display = 'inline-block';
        });
    }

    function validarFormularioEdicion() {
        limpiarErrores();
        let valido = true;
        // Puedes agregar validaciones aquí si quieres
        return valido;
    }

    // ✅ Nuevos listeners explícitos
    const botonesEditar = document.querySelectorAll('.btn-icon.edit');
    botonesEditar.forEach(boton => {
        boton.addEventListener('click', function () {
            const userId = this.dataset.id;
            console.log("🔧 Clic en botón editar con ID:", userId);
            if (userId) abrirModalEdicion(userId);
        });
    });

    // Listener para botón actualizar
    const actualizarBtn = document.getElementById('actualizar-usuario');
    if (actualizarBtn) {
        actualizarBtn.addEventListener('click', actualizarUsuario);
    }

    // Cierre de modales
    document.addEventListener('click', function (e) {
        if (e.target.closest('.modal-close, .modal-close-btn')) {
            document.querySelectorAll('.modal-backdrop').forEach(modal => {
                modal.classList.remove('show');
            });
            document.body.classList.remove('modal-open');
        }
    });

    // Listener para eliminar (puede mantenerse como está)
    document.querySelectorAll('.btn-icon.delete').forEach(btn => {
        btn.addEventListener('click', function () {
            const userId = this.dataset.id;
            if (userId) eliminarUsuario(userId);
        });
    });
});
    