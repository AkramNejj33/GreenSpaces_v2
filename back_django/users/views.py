from rest_framework import viewsets
from .models import User
from .serializers import UserSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework import status
from .serializers import AdminSerializer
from .models import Admin
import jwt, datetime
import secrets
import string
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

class RegisterView(APIView):
    def post(self, request):
        serializer = AdminSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class LoginView(APIView):
    def post(self, request):
        email = request.data['email']
        password = request.data['password']
        
        admin = Admin.objects.filter(email=email).first()
        
        if admin is None:
            raise AuthenticationFailed('Admin not found!')
        
        if not admin.check_password(password):
            raise AuthenticationFailed('Incorrect password!')
        
        payload = {
            'id': admin.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=60),
            'iat': datetime.datetime.utcnow()
        }
        
        token = jwt.encode(payload, 'secret', algorithm='HS256')
        
        response = Response()
        response.set_cookie(key='jwt', value=token, httponly=True)
        
        # Retourner les informations utilisateur avec le token
        response.data = {
            'jwt': token,  # ← Changé de 'jwt' à 'token' pour le frontend
            'message': 'Login successful',
            'user': {
                'id': admin.id,
                'name': admin.name,  # ← Ajoutez le nom
                'email': admin.email,
                # Ajoutez d'autres champs si nécessaire
                # 'role': user.role,
                # 'avatar': user.avatar,
            }
        }
        
        return response





class AdminView(APIView):

    def get(self, request):
        token = request.COOKIES.get('jwt')

        if not token:
            raise AuthenticationFailed('Unauthenticated!')

        try:
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Unauthenticated!')

        user = Admin.objects.filter(id=payload['id']).first()
        serializer = AdminSerializer(user)
        return Response(serializer.data)


class LogoutView(APIView):
    def post(self, request):
        response = Response()
        response.delete_cookie('jwt')
        response.data = {
            'message': 'success'
        }
        return response









class ForgotPasswordView(APIView):
    """
    Vue pour demander la réinitialisation du mot de passe
    """
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


class ChangePasswordView(APIView):
    """
    Vue pour changer le mot de passe d'un admin connecté
    """
    def post(self, request):
        token = request.COOKIES.get('jwt')
        
        if not token:
            raise AuthenticationFailed('Unauthenticated!')
        
        try:
            payload = jwt.decode(token, 'secret', algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired!')
        
        admin = Admin.objects.filter(id=payload['id']).first()
        if not admin:
            raise AuthenticationFailed('Admin not found!')
        
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


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

















class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
