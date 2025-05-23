from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import FileExtensionValidator
from django.utils.timezone import now
from django.conf import settings
# ------------------------------
# Rol de usuario
# ------------------------------
class Rol(models.Model):
    rol = models.CharField(max_length=80)

    def __str__(self):
        return self.rol

# ------------------------------
# Zona supervisada
# ------------------------------
class Zona(models.Model):
    nombre = models.CharField(max_length=80)
    responsable = models.CharField(max_length=80)
    ubicacion = models.CharField(max_length=150)

    def __str__(self):
        return self.nombre

# ------------------------------
# Manager personalizado para el usuario
# ------------------------------
class CustomUserManager(BaseUserManager):
    def create_user(self, cedula, nombre, apellido, telefono, email, password=None, **extra_fields):
        if not cedula:
            raise ValueError("El usuario debe tener una cédula")
        email = self.normalize_email(email)
        user = self.model(
            cedula=cedula,
            nombre=nombre,
            apellido=apellido,
            telefono=telefono,
            email=email,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, cedula, nombre, apellido, telefono, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(cedula, nombre, apellido, telefono, email, password, **extra_fields)
    
    def get_full_name(self):
        """
        Devuelve el nombre completo del usuario.
        """
        return f"{self.nombre} {self.apellido}"
    
    def get_short_name(self):
        """
        Devuelve el nombre corto del usuario (solo el nombre).
        """
        return self.nombre

# ------------------------------
# Modelo de usuario personalizado
# ------------------------------
# En models.py, modifica la clase CustomUser
class CustomUser(AbstractBaseUser, PermissionsMixin):
    nombre = models.CharField(max_length=80)
    apellido = models.CharField(max_length=80)
    cedula = models.CharField(max_length=12, unique=True)
    telefono = models.CharField(max_length=13)
    email = models.EmailField(max_length=100, unique=True)
    rol = models.ForeignKey(Rol, on_delete=models.SET_NULL, null=True)
    zona = models.ForeignKey(Zona, on_delete=models.SET_NULL, null=True)
    foto_perfil = models.ImageField(
        upload_to='perfiles/',
        null=True,
        blank=True,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png'])]
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    date_joined = models.DateTimeField(default=now)

    objects = CustomUserManager()

    USERNAME_FIELD = 'cedula'
    REQUIRED_FIELDS = ['nombre', 'apellido', 'telefono', 'email']

    def __str__(self):
        return f"{self.nombre} {self.apellido}"
    
    reset_token = models.CharField(max_length=64, null=True, blank=True)
    reset_token_expiration = models.DateTimeField(null=True, blank=True)

# ------------------------------
# Ubicación asociada a evidencias o emergencias
# ------------------------------
class Ubicacion(models.Model):
    ubicacion = models.CharField(max_length=150)

    def __str__(self):
        return self.ubicacion

# ------------------------------
# Evidencias recopiladas por el usuario
# ------------------------------
from django.db import models
from django.conf import settings

class Evidencia(models.Model):
    fecha_subida = models.DateTimeField(auto_now_add=True)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, blank=True, null=True)
    usuario_nombre = models.CharField(max_length=160, blank=True)  # Nombre completo del usuario
    actividad = models.CharField(max_length=255, blank=True)
    ubicacion = models.CharField(max_length=255)
    observaciones = models.TextField(blank=True)
    archivo_url = models.URLField()

    def save(self, *args, **kwargs):
        # Guardar automáticamente el nombre del usuario si está autenticado
        if self.usuario and not self.usuario_nombre:
            self.usuario_nombre = f"{self.usuario.nombre} {self.usuario.apellido}"
        super(Evidencia, self).save(*args, **kwargs)

    def __str__(self):
        return f"Evidencia {self.id} - {self.usuario_nombre}"
    
# ------------------------------
# Fauna o flora reportada
# ------------------------------
class FaunaFlora(models.Model):
    TIPO_CHOICES = (
        ('Flora', 'Flora'),
        ('Fauna', 'Fauna'),
    )

    fecha = models.DateTimeField(auto_now_add=True)
    usuario = models.ForeignKey('CustomUser', on_delete=models.CASCADE)
    zona = models.ForeignKey('Zona', on_delete=models.CASCADE, null=True, blank=True)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    nombre_especie = models.CharField(max_length=80)
    descripcion = models.TextField(max_length=300)
    
    # SOLO GUARDAR LA URL DE LA IMAGEN
    imagen_url = models.URLField(max_length=500, blank=True, null=True)
    imagen_public_id = models.CharField(max_length=255, blank=True, null=True)  # Para poder eliminar después
    
    estado = models.CharField(max_length=250, default="Reportado")

    def __str__(self):
        return f"{self.tipo}: {self.nombre_especie}"

    class Meta:
        verbose_name = "Fauna y Flora"
        verbose_name_plural = "Fauna y Flora"

# ------------------------------
# Imágenes asociadas a una evidencia
# ------------------------------
class ImagenEvidencia(models.Model):
    nombre = models.CharField(max_length=40)
    descripcion = models.CharField(max_length=250)
    link_imagen = models.CharField(max_length=250)
    fecha = models.DateTimeField(auto_now_add=True)
    evidencia = models.ForeignKey(Evidencia, on_delete=models.CASCADE, related_name='imagenes')

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = "Imagen de Evidencia"
        verbose_name_plural = "Imágenes de Evidencias"

# ------------------------------
# Emergencias reportadas por usuarios
# ------------------------------
class Emergencia(models.Model):
    tipo = models.CharField(max_length=200)
    ubicacion = models.CharField(max_length=150)
    gravedad = models.CharField(max_length=250)
    fecha = models.DateTimeField()
    usuario = models.ForeignKey(CustomUser, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.tipo} - {self.gravedad}"
