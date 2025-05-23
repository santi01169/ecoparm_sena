from django.urls import path
from . import views
from django.contrib.auth import views as auth_views
from .views import CustomPasswordResetView
from .views import users_flora_fauna
urlpatterns = [
    path('', views.inicio, name="index"),
    path('nosotros', views.nosotros, name="nosotros"),
    path('portafolio', views.portafolio, name="portafolio"),
    path('login', views.login_view, name="login"),  # Actualizada para usar login_view
    path('logout', views.logout_view, name="logout"),  # Agregada nueva ruta de logout
    path('recuperar_contrasena', views.recuperar_contrasena, name="recuperar_contrasena"),
    path('admin_inicio', views.admin_inicio, name="admin_inicio"),
    path('admin_users', views.admin_users, name='admin_users'),
    path('admin_evidencias', views.admin_evidencias, name='admin_evidencias'),
    path('admin_perfil', views.admin_perfil, name='admin_perfil'),
    path('admin_copias_seguridad', views.admin_copias_seguridad, name='admin_copias_seguridad'),
    path('admin_dashboard', views.admin_dashboard, name='admin_dashboard'),
    path('users_perfil', views.users_perfil, name='users_perfil'),
    path('users_dashboard', views.users_dashboard, name='users_dashboard'),
    path('users_evidencias', views.users_evidencias, name='users_evidencias'),
    path('users_flora_fauna', views.users_flora_fauna, name='users_flora_fauna'),
    path('admin_flora_fauna', views.admin_flora_fauna, name='admin_flora_fauna'),
    path('usuarios/<int:usuario_id>/eliminar/', views.eliminar_usuario, name='eliminar_usuario'),
    path('usuarios/<int:usuario_id>/editar/', views.editar_usuario, name='editar_usuario'),
    path('usuarios/<int:usuario_id>/actualizar/', views.actualizar_usuario, name='actualizar_usuario'),
    path('users_dashboard/', views.users_dashboard, name='users_dashboard'),
    path('api/foto-perfil/actualizar/', views.actualizar_foto_perfil, name='actualizar_foto_perfil'),
    path('admin/perfil/actualizar/', views.actualizar_perfil_admin, name='actualizar_perfil_admin'),
    path('cambiar-password/', views.cambiar_password, name='cambiar_password'),
    path('evidencias/eliminar/<int:evidencia_id>/', views.eliminar_evidencia, name='eliminar_evidencia'),
    path('evidencias/editar/<int:evidencia_id>/', views.editar_evidencia, name='editar_evidencia'),
    path('evidencia/<int:id>/pdf/', views.descargar_evidencia_pdf, name='descargar_evidencia_pdf'),
    path('flora-fauna/', users_flora_fauna, name='users_flora_fauna'),
    path('flora-fauna/eliminar/<int:registro_id>/', views.eliminar_flora_fauna, name='eliminar_flora_fauna'),
    path('flora-fauna/editar/<int:registro_id>/', views.editar_flora_fauna, name='editar_flora_fauna'),
    path('password_reset/', auth_views.PasswordResetView.as_view(
        template_name='paginas/password_reset_form.html',
        email_template_name='emails/password_reset_email.html',
        subject_template_name='emails/password_reset_subject.txt'
    ), name='password_reset'),

    path('password_reset/done/', auth_views.PasswordResetDoneView.as_view(
        template_name='paginas/password_reset_done.html'
    ), name='password_reset_done'),

    path('reset/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(
        template_name='paginas/password_reset_confirm.html'
    ), name='password_reset_confirm'),

    path('reset/done/', auth_views.PasswordResetCompleteView.as_view(
        template_name='paginas/password_reset_complete.html'
    ), name='password_reset_complete'),
    
    path('password_reset/', CustomPasswordResetView.as_view(), name='password_reset'),
]

