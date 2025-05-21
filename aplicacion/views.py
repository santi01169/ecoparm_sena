from django.http import JsonResponse
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.contrib import messages
from django.urls import reverse
from django.views.decorators.http import require_http_methods
from .models import CustomUser, Rol, Zona
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
import logging
from django.views.decorators.csrf import csrf_protect
from .models import CustomUser
from django.contrib.auth import logout
from django.core.files.storage import default_storage
import json
from django.contrib.auth import update_session_auth_hash
from django.contrib.sessions.models import Session
from django.utils import timezone
from django.shortcuts import redirect, render
from .models import Evidencia
import cloudinary.uploader
from django.contrib.auth.views import PasswordResetView
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.urls import reverse_lazy
from django.http import HttpResponse
from reportlab.pdfgen import canvas
import openpyxl
from reportlab.lib.utils import ImageReader
import requests
from io import BytesIO
from reportlab.lib.pagesizes import letter


# Vistas básicas
def inicio(request):
    return render(request, 'paginas/index.html')

def nosotros(request):
    return render(request, 'paginas/nosotros.html')

def portafolio(request):
    return render(request, 'paginas/portafolio.html')

def login(request):
    return render(request, 'paginas/login.html')

def recuperar_contrasena(request):
    return render(request, 'paginas/recuperar_contrasena.html')

def admin_inicio(request):
    return render(request, 'paginas/admin_inicio.html')

def admin_evidencias(request):
    return render(request, 'paginas/admin_evidencias.html')

def admin_perfil(request):
    return render(request, 'paginas/admin_perfil.html')

def admin_copias_seguridad(request):
    return render(request, 'paginas/admin_copias_seguridad.html')

def admin_dashboard(request):
    return render(request, 'paginas/admin_dashboard.html')

def users_perfil(request):
    return render(request, 'paginas/users_perfil.html')

def users_dashboard(request):
    return render(request, 'paginas/users_dashboard.html')

def users_evidencias(request):
    return render(request, 'paginas/users_evidencias.html')

def users_flora_fauna(request):
    return render(request, 'paginas/users_flora_fauna.html')

def admin_flora_fauna(request):
    return render(request, 'paginas/admin_flora_fauna.html')

# Vista principal para administración de usuarios
@require_http_methods(["GET", "POST"])
def admin_users(request):
    if request.method == 'POST':
        return handle_user_request(request)
    usuarios = CustomUser.objects.all().select_related('rol', 'zona')
    return render(request, 'paginas/admin_users.html', {'usuarios': usuarios})



# Manejo de solicitudes POST
def handle_user_request(request):
    try:
        form_data = extract_form_data(request)
        validate_form_data(form_data, request)
        
        rol = get_or_create_model(Rol, 'rol', form_data['rol_nombre'])
        zona = get_or_create_model(Zona, 'nombre', form_data['zona_nombre'])
        
        user = create_user(form_data, rol, zona)
        return send_success_response(request, user)
        
    except Exception as e:
        return send_error_response(request, str(e))

# Funciones auxiliares
def extract_form_data(request):
    return {
        'nombre': request.POST.get('nombre', '').strip(),
        'apellido': request.POST.get('apellido', '').strip(),
        'cedula': request.POST.get('identificacion', '').strip(),
        'telefono': request.POST.get('telefono', '').strip(),
        'email': request.POST.get('email', '').strip().lower(),
        'password': request.POST.get('password', ''),
        'confirmPassword': request.POST.get('confirmPassword', ''),
        'rol_nombre': request.POST.get('rol', 'Usuario').capitalize(),
        'zona_nombre': request.POST.get('zona', '3').capitalize()
    }

def validate_form_data(form_data, request):
    if not all(form_data.values()):
        raise ValueError('Todos los campos son obligatorios')
    
    if form_data['password'] != form_data['confirmPassword']:
        raise ValueError('Las contraseñas no coinciden')
    
    if CustomUser.objects.filter(cedula=form_data['cedula']).exists():
        raise ValueError('La cédula ya está registrada')
    
    if CustomUser.objects.filter(email=form_data['email']).exists():
        raise ValueError('El email ya está registrado')

def get_or_create_model(model, field, value):
    return model.objects.get_or_create(**{field: value})[0]

def create_user(form_data, rol, zona):
    return CustomUser.objects.create_user(
        cedula=form_data['cedula'],
        nombre=form_data['nombre'],
        apellido=form_data['apellido'],
        telefono=form_data['telefono'],
        email=form_data['email'],
        password=form_data['password'],
        rol=rol,
        zona=zona
    )

def send_response(request, message, is_success, status_code):
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse(
            {'message' if is_success else 'error': message},
            status=status_code
        )
    
    if is_success:
        messages.success(request, message)
    else:
        messages.error(request, message)
    
    return redirect('admin_users')

def send_success_response(request, user):
    message = f'Usuario {user.nombre} {user.apellido} creado exitosamente!'
    return send_response(request, message, True, 200)

def send_error_response(request, error_message):
    return send_response(request, f'Error al crear usuario: {error_message}', False, 400)


logger = logging.getLogger(__name__)



@csrf_exempt
@require_http_methods(["POST"])
def eliminar_usuario(request, usuario_id):
    try:
        if not request.user.is_authenticated:
            return JsonResponse({'success': False, 'error': 'No autenticado'}, status=403)

        # Verificar si el usuario tiene el rol "Administrador"
        if not request.user.rol or request.user.rol.rol.lower() != 'administrador':
            return JsonResponse({'success': False, 'error': 'No tienes permisos para esta acción'}, status=403)

        usuario = get_object_or_404(CustomUser, id=usuario_id)

        if usuario.id == request.user.id:
            return JsonResponse({'success': False, 'error': 'No puedes eliminarte a ti mismo'}, status=400)

        usuario.delete()

        return JsonResponse({
            'success': True,
            'message': f'Usuario {usuario.nombre} eliminado correctamente'
        })

    except Exception as e:
        logger.error(f"Error al eliminar usuario: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@require_http_methods(["GET"])
def editar_usuario(request, usuario_id):
    try:
        usuario = get_object_or_404(CustomUser, id=usuario_id)
        
        datos_usuario = {
            'id': usuario.id,
            'nombre': usuario.nombre,
            'apellido': usuario.apellido,
            'cedula': usuario.cedula,
            'telefono': usuario.telefono,
            'email': usuario.email,
            'rol': usuario.rol.rol if usuario.rol else 'Usuario',
            'zona': usuario.zona.nombre if usuario.zona else '3'
        }
        
        return JsonResponse({'success': True, 'usuario': datos_usuario})
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@require_http_methods(["POST"])
def actualizar_usuario(request, usuario_id):
    try:
        usuario = get_object_or_404(CustomUser, id=usuario_id)
        form_data = {
            'nombre': request.POST.get('nombre', '').strip(),
            'apellido': request.POST.get('apellido', '').strip(),
            'cedula': request.POST.get('identificacion', '').strip(),  # Cambiado a 'identificacion'
            'telefono': request.POST.get('telefono', '').strip(),
            'email': request.POST.get('email', '').strip().lower(),
            'rol_nombre': request.POST.get('rol', 'Usuario').capitalize(),
            'zona_nombre': request.POST.get('zona', '3').capitalize()
        }

        # Validaciones
        if not all([form_data['nombre'], form_data['apellido'], form_data['email']]):
            raise ValueError('Nombre, apellido y email son obligatorios')

        # Validar email único (excluyendo al usuario actual)
        if CustomUser.objects.filter(email=form_data['email']).exclude(id=usuario.id).exists():
            raise ValueError('El email ya está registrado')

        # Validar cédula única (excluyendo al usuario actual)
        if CustomUser.objects.filter(cedula=form_data['cedula']).exclude(id=usuario.id).exists():
            raise ValueError('La cédula ya está registrada')

        # Actualizar campos
        usuario.nombre = form_data['nombre']
        usuario.apellido = form_data['apellido']
        usuario.cedula = form_data['cedula']
        usuario.telefono = form_data['telefono']
        usuario.email = form_data['email']

        # Actualizar rol y zona
        rol = get_or_create_model(Rol, 'rol', form_data['rol_nombre'])
        zona = get_or_create_model(Zona, 'nombre', form_data['zona_nombre'])
        usuario.rol = rol
        usuario.zona = zona

        usuario.save()

        return JsonResponse({
            'success': True,
            'message': 'Usuario actualizado correctamente'
        })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)
    


@csrf_protect
@require_http_methods(["POST"])
def login_view(request):
    tipo_usuario = request.POST.get('tipo_usuario')
    cedula = request.POST.get('cedula')
    password = request.POST.get('password')

    if not all([tipo_usuario, cedula, password]):
        error_msg = "Todos los campos son obligatorios"
        if request.headers.get("x-requested-with") == "XMLHttpRequest":
            return JsonResponse({'success': False, 'error': error_msg})
        messages.error(request, error_msg)
        return redirect('index')

    user = authenticate(request, username=cedula, password=password)

    if user is not None:
        rol_usuario = user.rol.rol.lower() if user.rol else ''
        if tipo_usuario == 'administrador' and rol_usuario != 'administrador':
            error_msg = "No tienes permisos de administrador"
        elif tipo_usuario == 'guardaparamo' and rol_usuario != 'guardaparamo':
            error_msg = "No tienes permisos de guardaparamo"
        else:
            auth_login(request, user)
            
            # 🔽 Redirección según el rol
            if tipo_usuario == 'administrador':
                redirect_url = reverse('admin_dashboard')
            elif tipo_usuario == 'guardaparamo':
                redirect_url = reverse('users_dashboard')
            else:
                redirect_url = reverse('admin_inicio')  # fallback

            if request.headers.get("x-requested-with") == "XMLHttpRequest":
                return JsonResponse({'success': True, 'redirect_url': redirect_url})
            return redirect(redirect_url)

        if request.headers.get("x-requested-with") == "XMLHttpRequest":
            return JsonResponse({'success': False, 'error': error_msg})
        messages.error(request, error_msg)
        return redirect('index')

    error_msg = "Credenciales incorrectas"
    if request.headers.get("x-requested-with") == "XMLHttpRequest":
        return JsonResponse({'success': False, 'error': error_msg})
    messages.error(request, error_msg)
    return redirect('index')

def logout_view(request):
    logout(request)
    messages.success(request, "Has cerrado sesión correctamente.")
    return redirect('index')


@login_required
@require_http_methods(["POST"])
def actualizar_foto_perfil(request):
    try:
        if 'foto_perfil' in request.FILES:
            user = request.user
            
            # Eliminar foto anterior si existe
            if user.foto_perfil:
                default_storage.delete(user.foto_perfil.path)
            
            # Guardar nueva foto
            user.foto_perfil = request.FILES['foto_perfil']
            user.save()
            
            return JsonResponse({
                'success': True,
                'foto_url': user.foto_perfil.url,
                'message': 'Foto de perfil actualizada correctamente'
            })
        
        return JsonResponse({
            'success': False,
            'error': 'No se proporcionó ninguna imagen'
        }, status=400)
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)  
    
@login_required
@require_http_methods(["POST"])
def actualizar_perfil_admin(request):
    try:
        user = request.user
        
        # Validar datos requeridos
        nombre = request.POST.get('nombre')
        apellidos = request.POST.get('apellidos')
        email = request.POST.get('email')
        
        if not all([nombre, apellidos, email]):
            raise ValueError('Nombre, apellidos y email son campos obligatorios')
        
        # Validar email único (excluyendo al usuario actual)
        if CustomUser.objects.filter(email=email).exclude(id=user.id).exists():
            raise ValueError('El email ya está registrado por otro usuario')
        
        # Actualizar datos básicos
        user.nombre = nombre
        user.apellido = apellidos
        user.email = email
        user.telefono = request.POST.get('telefono', user.telefono)
        
        # Manejar la foto de perfil si se envió
        if 'foto_perfil' in request.FILES:
            # Validar que sea una imagen
            foto = request.FILES['foto_perfil']
            if not foto.content_type.startswith('image/'):
                raise ValueError('El archivo debe ser una imagen (JPEG, PNG)')
            
            # Eliminar foto anterior si existe
            if user.foto_perfil:
                default_storage.delete(user.foto_perfil.path)
            
            # Guardar nueva foto
            user.foto_perfil = foto
        
        user.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Perfil actualizado correctamente',
            'foto_url': user.foto_perfil.url if user.foto_perfil else None,
            'user': {
                'nombre': user.nombre,
                'apellido': user.apellido,
                'email': user.email,
                'telefono': user.telefono
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)
    


@login_required
def cambiar_password(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            current_password = data.get('current_password')
            new_password = data.get('new_password')
            confirm_password = data.get('confirm_password')

            user = request.user

            if not user.check_password(current_password):
                return JsonResponse({'success': False, 'error': 'La contraseña actual es incorrecta'}, status=400)

            if new_password != confirm_password:
                return JsonResponse({'success': False, 'error': 'Las contraseñas no coinciden'}, status=400)

            user.set_password(new_password)
            user.save()
            update_session_auth_hash(request, user)  # Mantener la sesión activa después del cambio
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)

    return JsonResponse({'success': False, 'error': 'Método no permitido'}, status=405)

@login_required
def admin_dashboard(request):
    sesiones = Session.objects.filter(expire_date__gte=timezone.now())
    user_ids = []

    for sesion in sesiones:
        data = sesion.get_decoded()
        uid = data.get('_auth_user_id')
        if uid:
            user_ids.append(uid)

    usuarios_conectados = CustomUser.objects.filter(id__in=user_ids).select_related('rol')

    return render(request, 'paginas/admin_dashboard.html', {
        'usuarios': usuarios_conectados,
        'evidencias': []  # evidencias vacías por ahora
    })

# Evidencia
@login_required
def users_evidencias(request):
    if request.method == 'POST':
        es_edicion = 'editar_evidencia' in request.path

        actividad = request.POST.get('actividad')
        ubicacion = request.POST.get('ubicacion')
        observaciones = request.POST.get('observaciones')
        archivo = request.FILES.get('archivo')

        if not es_edicion and not archivo:
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'error': 'Debes subir un archivo'}, status=400)
            messages.error(request, 'Debes subir un archivo')
            return redirect('users_evidencias')

        try:
            if es_edicion:
                evidencia = get_object_or_404(Evidencia, id=request.POST.get('evidencia_id'), usuario=request.user)
                archivo_url = evidencia.archivo_url
                if archivo:
                    result = cloudinary.uploader.upload(archivo)
                    archivo_url = result.get('secure_url')
                
                # Actualizar campos editables
                evidencia.actividad = actividad
                evidencia.ubicacion = ubicacion
                evidencia.observaciones = observaciones
                evidencia.archivo_url = archivo_url
                evidencia.save()

            else:
                result = cloudinary.uploader.upload(archivo)
                archivo_url = result.get('secure_url')
                evidencia = Evidencia.objects.create(
                    usuario=request.user,
                    usuario_nombre=f"{request.user.nombre} {request.user.apellido}",
                    actividad=actividad,
                    ubicacion=ubicacion,
                    observaciones=observaciones,
                    archivo_url=archivo_url
                )

            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'url': archivo_url,
                    'usuario_nombre': evidencia.usuario_nombre,
                    'actividad': evidencia.actividad,
                    'ubicacion': evidencia.ubicacion,
                    'observaciones': evidencia.observaciones,
                    'fecha_subida': evidencia.fecha_subida.strftime("%Y-%m-%d %H:%M")
                })

        except Exception as e:
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'error': str(e)}, status=400)
            messages.error(request, f'Error al subir evidencia: {str(e)}')
            return redirect('users_evidencias')

    # CAMBIO: solo mostrar evidencias del usuario autenticado
    evidencias = Evidencia.objects.filter(usuario=request.user).order_by('-fecha_subida')
    
    return render(request, 'paginas/users_evidencias.html', {
        'evidencias': evidencias
    })

#import json
import logging

logger = logging.getLogger(__name__)

@login_required
@require_http_methods(["POST"])
def eliminar_evidencia(request, evidencia_id):
    try:
        # Obtener la evidencia asegurándose de que pertenezca al usuario actual
        evidencia = get_object_or_404(Evidencia, id=evidencia_id, usuario=request.user)
        
        # Registro para depuración
        logger.debug(f"Eliminando evidencia {evidencia_id} por usuario {request.user}")
        
        # Eliminar la evidencia
        evidencia.delete()
        
        # Devolver respuesta exitosa
        return JsonResponse({
            'success': True,
            'message': 'Evidencia eliminada correctamente'
        })

    except Exception as e:
        # Registro del error
        logger.error(f"Error al eliminar evidencia {evidencia_id}: {str(e)}")
        
        # Devolver respuesta de error
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)

#Editar
import logging

logger = logging.getLogger(__name__)

#Editar
@login_required
@require_http_methods(["POST"])
def editar_evidencia(request, evidencia_id):
    try:
        logger.info(f"Inicio de edición de evidencia ID: {evidencia_id}")
        
        # Verificar si la evidencia existe y pertenece al usuario
        evidencia = get_object_or_404(Evidencia, id=evidencia_id, usuario=request.user)
        
        # Obtener datos del formulario
        actividad = request.POST.get('actividad', evidencia.actividad)
        observaciones = request.POST.get('observaciones', evidencia.observaciones)
        
        # Actualizar la evidencia
        evidencia.actividad = actividad
        evidencia.observaciones = observaciones
        
        # Manejar la imagen solo si se proporciona
        if 'archivo' in request.FILES:
            nuevo_archivo = request.FILES['archivo']
            logger.info("Procesando nuevo archivo...")
            
            # Subir el nuevo archivo a Cloudinary
            try:
                result = cloudinary.uploader.upload(nuevo_archivo)
                evidencia.archivo_url = result.get('secure_url')
                logger.info(f"Nuevo archivo subido: {evidencia.archivo_url}")
            except Exception as e:
                logger.error(f"Error al subir archivo a Cloudinary: {str(e)}")
                return JsonResponse({'success': False, 'error': f'Error al subir archivo: {str(e)}'}, status=400)
        
        # Guardar los cambios
        evidencia.save()
        logger.info(f"Evidencia {evidencia_id} actualizada correctamente")
        
        # Devolver una respuesta exitosa
        return JsonResponse({
            'success': True,
            'message': 'Evidencia actualizada correctamente',
            'data': {
                'id': evidencia.id,
                'actividad': evidencia.actividad,
                'ubicacion': evidencia.ubicacion,
                'observaciones': evidencia.observaciones,
                'archivo_url': evidencia.archivo_url,
                'usuario_nombre': evidencia.usuario_nombre,
                'fecha_subida': evidencia.fecha_subida.strftime('%Y-%m-%d %H:%M')
            }
        })
    
    except Evidencia.DoesNotExist:
        logger.error(f"No se encontró la evidencia con ID {evidencia_id}")
        return JsonResponse({'success': False, 'error': 'No se encontró la evidencia'}, status=404)
    
    except Exception as e:
        logger.error(f"Error al editar evidencia {evidencia_id}: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
    

class CustomPasswordResetView(PasswordResetView):
    template_name = 'paginas/password_reset_form.html'
    email_template_name = 'emails/password_reset_email.html'
    subject_template_name = 'emails/password_reset_subject.txt'
    success_url = reverse_lazy('password_reset_done')

    def send_mail(self, subject_template_name, email_template_name,
                  context, from_email, to_email, html_email_template_name=None):
        subject = render_to_string(subject_template_name, context).strip()
        body = render_to_string(email_template_name, context)

        email_message = EmailMultiAlternatives(subject, '', from_email, [to_email])
        email_message.attach_alternative(body, "text/html")  # 🔽 convierte el contenido en HTML
        email_message.send()


# Mostrar evidencias en admin

@login_required
def admin_evidencias(request):
    evidencias = Evidencia.objects.all().order_by('-fecha_subida')
    return render(request, 'paginas/admin_evidencias.html', {'evidencias': evidencias})

#Descargar evidencias
def descargar_evidencia_pdf(request, id):
    evidencia = Evidencia.objects.get(pk=id)

    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="evidencia_{evidencia.id}.pdf"'

    p = canvas.Canvas(response, pagesize=letter)
    width, height = letter

    y = height - 50  # Starting from top

    # Bloque de texto
    line_height = 20
    p.drawString(50, y, f"Evidencia #{evidencia.id}")
    p.drawString(50, y - line_height, f"Fecha: {evidencia.fecha_subida.strftime('%Y-%m-%d %H:%M')}")
    p.drawString(50, y - 2 * line_height, f"Subida por: {evidencia.usuario_nombre}")
    p.drawString(50, y - 3 * line_height, f"Actividad: {evidencia.actividad}")
    p.drawString(50, y - 4 * line_height, f"Ubicación: {evidencia.ubicacion}")
    p.drawString(50, y - 5 * line_height, f"Observaciones: {evidencia.observaciones}")

    # Deja espacio antes de dibujar la imagen
    imagen_y = y - 6 * line_height - 20  # Posición vertical donde comienza la imagen

    # Insertar imagen (opcional)
    try:
        image_url = evidencia.archivo_url
        image_response = requests.get(image_url)
        image = ImageReader(BytesIO(image_response.content))

        # Dibuja la imagen ajustando ancho a 400px, altura automática
        p.drawImage(image, 50, imagen_y - 300, width=400, height=300, preserveAspectRatio=True, mask='auto')

    except Exception as e:
        p.drawString(50, imagen_y, "⚠ No se pudo cargar la imagen.")

    p.showPage()
    p.save()
    return response


# Descargar evidencia excel