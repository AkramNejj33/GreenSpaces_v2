from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, 
    CustomTokenObtainPairView,  # ← Remplace LoginView
    AdminView, 
    LogoutView,
    TaskListCreateView,
    TaskDetailView,
    CustomTokenRefreshView,     # ← Nouveau
    TokenStatusView,
    ForgotPasswordView,
    ResetPasswordView,
    ChangePasswordView,
    UserViewSet
)

# Router pour les ViewSets
router = DefaultRouter()
router.register(r'users', UserViewSet)


urlpatterns = [
    
    # ← GARDER L'ANCIEN: Router pour les utilisateurs
    path('', include(router.urls)),
    
    # ← GARDER L'ANCIEN: Inscription
    path('register', RegisterView.as_view(), name='register'),
    
    # ← MODIFICATION: Login avec Simple JWT (garde la même URL pour compatibilité)
    path('login', CustomTokenObtainPairView.as_view(), name='login'),
    
    # ← NOUVEAU: Refresh token endpoint
    path('token/refresh', CustomTokenRefreshView.as_view(), name='token_refresh'),
    
    path('token/status', TokenStatusView.as_view(), name='token_status'),

    # ← GARDER L'ANCIEN: Autres endpoints
    path('admin', AdminView.as_view(), name='admin'),
    path('logout', LogoutView.as_view(), name='logout'),
    path('forgot-password', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password', ResetPasswordView.as_view(), name='reset_password'),
    path('change-password', ChangePasswordView.as_view(), name='change_password'),
    
    path('tasks/', TaskListCreateView.as_view(), name='task-list-create'),
    path('tasks/<uuid:pk>/', TaskDetailView.as_view(), name='task-detail'),
    
]
