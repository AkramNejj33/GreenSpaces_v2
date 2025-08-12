from rest_framework import viewsets
from .models import User
from .serializers import UserSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework import status
from .serializers import AdminSerializer
from .models import Admin
import secrets
import string
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import Task
from .serializers import TaskSerializer
from rest_framework.permissions import IsAuthenticated


# ← AJOUT: Imports pour Simple JWT
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny 
from rest_framework.filters import SearchFilter, OrderingFilter


# ← MODIFICATION: Serializer personnalisé pour inclure les données utilisateur
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Ajouter des claims personnalisés au token
        token['name'] = user.name
        token['email'] = user.email
        
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Ajouter les données utilisateur à la réponse
        data['user'] = {
            'id': self.user.id,
            'name': self.user.name,
            'email': self.user.email,
        }
        
        return data


# ← MODIFICATION: Vue de connexion personnalisée
class CustomTokenObtainPairView(TokenObtainPairView):
    authentication_classes = []       
    permission_classes = [AllowAny] 
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        try:
            # Utiliser le serializer personnalisé
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Obtenir les tokens et données utilisateur
            tokens_data = serializer.validated_data
            
            # Créer la réponse
            response = Response()
            
            # ← MAINTIEN DE LA COMPATIBILITÉ: Même format de réponse qu'avant
            response.data = {
                'access': tokens_data['access'],      # ← Nouveau: access token
                'refresh': tokens_data['refresh'],    # ← Nouveau: refresh token
                'jwt': tokens_data['access'],         # ← Compatibilité: même nom qu'avant
                'message': 'Login successful',
                'user': tokens_data['user']
            }
            
            # ← OPTIONNEL: Garder le cookie pour la compatibilité
            response.set_cookie(
                key='jwt', 
                value=tokens_data['access'],
                httponly=True,
                max_age=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()
            )
            
            # ← NOUVEAU: Cookie pour le refresh token (plus sécurisé)
            response.set_cookie(
                key='refresh_token',
                value=tokens_data['refresh'],
                httponly=True,
                max_age=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()
            )
            
            return response
            
        except Exception as e:
            return Response(
                {'error': 'Invalid credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )


# ← MODIFICATION: Vue Admin avec Simple JWT
class AdminView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Avec Simple JWT, l'utilisateur est automatiquement authentifié
        user = request.user
        serializer = AdminSerializer(user)
        return Response(serializer.data)


# ← MODIFICATION: Vue de déconnexion avec blacklisting
class LogoutView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Obtenir le refresh token depuis les cookies ou le body
            refresh_token = request.COOKIES.get('refresh_token') or request.data.get('refresh')
            
            if refresh_token:
                # Blacklister le refresh token
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            # Créer la réponse
            response = Response()
            response.delete_cookie('jwt')
            response.delete_cookie('refresh_token')
            response.data = {
                'message': 'Logout successful'
            }
            return response
            
        except Exception as e:
            response = Response()
            response.delete_cookie('jwt')
            response.delete_cookie('refresh_token')
            response.data = {
                'message': 'Logout successful'
            }
            return response


# ← NOUVEAU: Vue pour rafraîchir le token
class CustomTokenRefreshView(TokenRefreshView):
    authentication_classes = []       
    permission_classes = [AllowAny] 
    def post(self, request, *args, **kwargs):
        # Obtenir le refresh token depuis les cookies si pas dans le body
        if 'refresh' not in request.data and 'refresh_token' in request.COOKIES:
            request.data['refresh'] = request.COOKIES['refresh_token']
        
        response = super().post(request, *args, **kwargs)
        
        # Mettre à jour les cookies avec les nouveaux tokens
        if response.status_code == 200:
            data = response.data
            
            # Mettre à jour le cookie access token
            response.set_cookie(
                key='jwt',
                value=data['access'],
                httponly=True,
                max_age=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()
            )
            
            # Si un nouveau refresh token est fourni, mettre à jour le cookie
            if 'refresh' in data:
                response.set_cookie(
                    key='refresh_token',
                    value=data['refresh'],
                    httponly=True,
                    max_age=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()
                )
        
        return response



class TokenStatusView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Vérifier si l'utilisateur est toujours authentifié"""
        return Response({
            'authenticated': True,
            'user': {
                'id': request.user.id,
                'name': request.user.name,
                'email': request.user.email,
            }
        })










# ← GARDER L'ANCIEN: Vue d'inscription (pas de changement nécessaire)
class RegisterView(APIView):
    authentication_classes = []       
    permission_classes = [AllowAny] 
    def post(self, request):
        serializer = AdminSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ← GARDER L'ANCIEN: Vues de réinitialisation de mot de passe (pas de changement)
class ForgotPasswordView(APIView):
    """
    Vue pour demander la réinitialisation du mot de passe
    """
    authentication_classes = []       
    permission_classes = [AllowAny] 
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'error': 'Email is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            admin = Admin.objects.get(email=email)
        except Admin.DoesNotExist:
            # Pour des raisons de sécurité, on ne révèle pas si l'email existe
            return Response(
                {'message': 'If this email exists, a reset link will be sent.'}, 
                status=status.HTTP_200_OK
            )
        
        # Générer un token de réinitialisation sécurisé
        reset_token = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(50))
        
        # Stocker le token avec une expiration (24h)
        admin.reset_token = reset_token
        admin.reset_token_expires = timezone.now() + timedelta(hours=24)
        admin.save()
        
        # Envoyer l'email (optionnel - nécessite configuration SMTP)
        try:
            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
            
            send_mail(
                subject='Password Reset Request',
                message=f'''
                Hello {admin.name},
                
                You requested a password reset for your admin account.
                
                Click the link below to reset your password:
                {reset_url}
                
                This link will expire in 24 hours.
                
                If you did not request this reset, please ignore this email.
                
                Best regards,
                The Admin Team
                ''',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[admin.email],
                fail_silently=False,
            )
            
            return Response({
                'message': 'Password reset email sent successfully.',
                'reset_token': reset_token,  # À supprimer en production
                'reset_url': reset_url       # À supprimer en production
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Si l'email échoue, on retourne quand même le token pour les tests
            return Response({
                'message': 'Email service unavailable, but reset token generated.',
                'reset_token': reset_token,  # Pour les tests uniquement
                'error': str(e)
            }, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    """
    Vue pour réinitialiser le mot de passe avec le token
    """
    authentication_classes = []       
    permission_classes = [AllowAny] 
    def post(self, request):
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        # Validations
        if not token:
            return Response(
                {'error': 'Reset token is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not new_password:
            return Response(
                {'error': 'New password is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_password != confirm_password:
            return Response(
                {'error': 'Passwords do not match'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password) < 6:
            return Response(
                {'error': 'Password must be at least 6 characters long'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            admin = Admin.objects.get(
                reset_token=token,
                reset_token_expires__gt=timezone.now()
            )
        except Admin.DoesNotExist:
            return Response(
                {'error': 'Invalid or expired reset token'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Réinitialiser le mot de passe
        admin.set_password(new_password)
        admin.reset_token = None  # Supprimer le token
        admin.reset_token_expires = None
        admin.save()
        
        return Response({
            'message': 'Password reset successfully. You can now login with your new password.',
            'admin': {
                'id': admin.id,
                'name': admin.name,
                'email': admin.email
            }
        }, status=status.HTTP_200_OK)


# ← MODIFICATION: Vue de changement de mot de passe avec Simple JWT
class ChangePasswordView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Avec Simple JWT, l'utilisateur est automatiquement authentifié
        admin = request.user
        
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        # Validations
        if not current_password:
            return Response(
                {'error': 'Current password is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not admin.check_password(current_password):
            return Response(
                {'error': 'Current password is incorrect'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not new_password:
            return Response(
                {'error': 'New password is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_password != confirm_password:
            return Response(
                {'error': 'New passwords do not match'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password) < 6:
            return Response(
                {'error': 'Password must be at least 6 characters long'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Changer le mot de passe
        admin.set_password(new_password)
        admin.save()
        
        return Response({
            'message': 'Password changed successfully',
            'admin': {
                'id': admin.id,
                'name': admin.name,
                'email': admin.email
            }
        }, status=status.HTTP_200_OK)


# ← GARDER L'ANCIEN: ViewSet pour les utilisateurs (pas de changement)
class UserViewSet(viewsets.ModelViewSet):  # ou GenericViewSet si tu veux personnaliser
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(admin=self.request.user)  



class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and isinstance(request.user, Admin)
class TaskListCreateView(generics.ListCreateAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['type', 'status', 'assigned_to']
    search_fields = ['title', 'description']
    ordering_fields = ['scheduled_at', 'done_at']

    def perform_create(self, serializer):
        # Assigner automatiquement l'admin connecté comme créateur
        serializer.save(created_by=self.request.user)
    
        

class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]