from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import serializers
from django.contrib.auth.hashers import check_password, make_password
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import secrets
import string

from users.models import User, Admin


# ═══════════════════════════════════════════════════════════════════════
# AUTHENTIFICATION MOBILE - EMPLOYÉS
# ═══════════════════════════════════════════════════════════════════════

class EmployeeTokenObtainPairSerializer(serializers.Serializer):
    """Serializer personnalisé pour l'authentification des employés via mobile"""
    email = serializers.EmailField()
    password = serializers.CharField()
    admin_name = serializers.CharField()
    
    def validate(self, attrs):
        # Récupérer email, password et admin_name depuis les données
        email = attrs.get('email')
        password = attrs.get('password')
        admin_name = attrs.get('admin_name')
        
        if not email or not password or not admin_name:
            raise ValidationError('Email, password et admin_name sont requis')
        
        try:
            # 1. Chercher l'admin par nom
            admin = Admin.objects.get(name=admin_name)
            
            # 2. Chercher l'utilisateur qui appartient à cet admin
            user = User.objects.get(
                email=email,
                admin=admin  # Vérification de la relation foreign key
            )
            
            # 3. Vérifier le mot de passe
            if not check_password(password, user.password):
                raise AuthenticationFailed('Invalid credentials')
            
            # 4. Générer les tokens JWT manuellement pour les employés
            refresh = RefreshToken()
            
            # Ajouter des claims personnalisés au token pour les employés
            refresh['user_id'] = str(user.id)
            refresh['username'] = user.username
            refresh['email'] = user.email
            refresh['specialty'] = user.specialty
            refresh['admin_id'] = admin.id
            refresh['admin_name'] = admin.name
            refresh['user_type'] = 'employee'  # Distinguer des admins
            
            # Définir le sujet du token comme l'ID de l'utilisateur
            refresh['sub'] = str(user.id)
            
            return {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': str(user.id),
                    'username': user.username,
                    'email': user.email,
                    'specialty': user.specialty,
                    'specialty_display': user.get_specialty_display(),
                    'created_at': str(user.created_at),
                    'admin': {
                        'id': admin.id,
                        'name': admin.name,
                        'email': admin.email
                    }
                }
            }
            
        except Admin.DoesNotExist:
            raise AuthenticationFailed('Admin not found')
            
        except User.DoesNotExist:
            raise AuthenticationFailed('User not found or does not belong to this admin')


class EmployeeJWTAuthentication(JWTAuthentication):
    """
    Authentification JWT personnalisée pour les employés
    qui ne passe pas par le modèle User Django par défaut
    """
    def get_user(self, validated_token):
        """
        Récupère l'employé depuis le token au lieu d'utiliser le modèle User Django
        """
        try:
            user_id = validated_token.get('user_id')
            user_type = validated_token.get('user_type')
            
            # Vérifier que c'est bien un token d'employé
            if user_type != 'employee':
                return None
                
            # Convertir l'UUID si nécessaire
            try:
                import uuid
                if isinstance(user_id, str):
                    user_id = uuid.UUID(user_id)
            except (ValueError, TypeError):
                return None
                
            # Récupérer l'employé
            user = User.objects.select_related('admin').get(id=user_id)
            
            # Créer un wrapper qui simule un utilisateur Django
            class EmployeeUserWrapper:
                def __init__(self, employee):
                    self.employee = employee
                    self.id = employee.id
                    self.username = employee.username
                    self.email = employee.email
                
                @property
                def is_authenticated(self):
                    return True
                
                @property
                def is_active(self):
                    return True
                
                @property
                def is_anonymous(self):
                    return False
                
                def __getattr__(self, name):
                    # Déléguer tous les autres attributs à l'employé
                    return getattr(self.employee, name)
            
            return EmployeeUserWrapper(user)
            
        except (User.DoesNotExist, KeyError):
            return None


# ═══════════════════════════════════════════════════════════════════════
# VUES MOBILE - AUTHENTIFICATION
# ═══════════════════════════════════════════════════════════════════════

class EmployeeLoginView(APIView):
    """
    Vue pour la connexion des employés via l'application mobile avec JWT
    Nécessite: email, password, admin_name
    """
    authentication_classes = []       
    permission_classes = [AllowAny] 

    def post(self, request):
        try:
            # Utiliser le serializer JWT personnalisé pour employés
            serializer = EmployeeTokenObtainPairSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Obtenir les tokens et données utilisateur
            tokens_data = serializer.validated_data
            
            # Créer la réponse
            response = Response()
            
            response.data = {
                'access': tokens_data['access'],
                'refresh': tokens_data['refresh'],
                'jwt': tokens_data['access'],  # Compatibilité
                'message': 'Employee login successful',
                'user': tokens_data['user']
            }
            
            return response
            
        except ValidationError as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except AuthenticationFailed as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            return Response(
                {'error': f'An error occurred during login: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EmployeeProfileView(APIView):
    """
    Vue pour récupérer le profil de l'employé connecté avec JWT
    """
    authentication_classes = [EmployeeJWTAuthentication]
    permission_classes = []  # Pas de IsAuthenticated car notre User n'hérite pas d'AbstractUser

    def get(self, request):
        try:
            # Vérification manuelle de l'authentification
            if not hasattr(request, 'user') or not request.user:
                return Response(
                    {'error': 'Authentication required'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # L'utilisateur est maintenant automatiquement récupéré par notre authentification personnalisée
            user = request.user
            
            return Response({
                'user': {
                    'id': str(user.id),
                    'username': user.username,
                    'email': user.email,
                    'specialty': user.specialty,
                    'specialty_display': user.get_specialty_display(),
                    'created_at': str(user.created_at),
                    'admin': {
                        'id': user.admin.id,
                        'name': user.admin.name,
                        'email': user.admin.email
                    }
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'An error occurred: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EmployeeLogoutView(APIView):
    """
    Vue pour la déconnexion des employés avec blacklisting JWT
    """
    authentication_classes = [EmployeeJWTAuthentication]
    permission_classes = []

    def post(self, request):
        try:
            # Obtenir le refresh token depuis le body
            refresh_token = request.data.get('refresh')
            
            if refresh_token:
                # Blacklister le refresh token
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({
                'message': 'Employee logout successful'
            })
            
        except Exception as e:
            return Response({
                'message': 'Employee logout successful'
            })


class EmployeeTokenRefreshView(TokenRefreshView):
    """Vue pour rafraîchir le token des employés"""
    authentication_classes = []       
    permission_classes = [AllowAny] 


class EmployeeTokenStatusView(APIView):
    """
    Vue pour vérifier si l'employé est toujours authentifié
    """
    authentication_classes = [EmployeeJWTAuthentication]
    permission_classes = []
    
    def get(self, request):
        try:
            # Vérification manuelle de l'authentification
            if not hasattr(request, 'user') or not request.user:
                return Response(
                    {'authenticated': False, 'error': 'Authentication required'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # L'utilisateur est automatiquement récupéré par notre authentification personnalisée
            user = request.user
            
            return Response({
                'authenticated': True,
                'user': {
                    'id': str(user.id),
                    'username': user.username,
                    'email': user.email,
                    'specialty': user.specialty,
                    'specialty_display': user.get_specialty_display(),
                    'admin': {
                        'id': user.admin.id,
                        'name': user.admin.name,
                        'email': user.admin.email
                    }
                }
            })
        except Exception as e:
            return Response(
                {'authenticated': False, 'error': 'Invalid token'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )


# ═══════════════════════════════════════════════════════════════════════
# VUES MOBILE - UTILITAIRES
# ═══════════════════════════════════════════════════════════════════════

class CheckAdminView(APIView):
    """
    Vue pour vérifier si un admin existe par son nom
    """
    authentication_classes = []       
    permission_classes = [AllowAny] 

    def post(self, request):
        admin_name = request.data.get('admin_name')
        
        if not admin_name:
            return Response(
                {'error': 'Admin name is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            admin = Admin.objects.get(name=admin_name)
            return Response({
                'exists': True,
                'admin': {
                    'name': admin.name,
                    'email': admin.email
                }
            }, status=status.HTTP_200_OK)
            
        except Admin.DoesNotExist:
            return Response({
                'exists': False,
                'message': 'Admin not found'
            }, status=status.HTTP_404_NOT_FOUND)


# ═══════════════════════════════════════════════════════════════════════
# VUES MOBILE - RÉINITIALISATION MOT DE PASSE
# ═══════════════════════════════════════════════════════════════════════

class EmployeeForgotPasswordView(APIView):
    """
    Vue pour demander la réinitialisation du mot de passe des employés
    Adaptée pour l'application mobile
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
            # Chercher l'employé par email
            user = User.objects.get(email=email)
                
        except User.DoesNotExist:
            # Pour des raisons de sécurité, on ne révèle pas si l'email existe
            return Response(
                {'message': 'If this email exists in our system, you will receive a password reset link shortly.'}, 
                status=status.HTTP_200_OK
            )
        
        # Générer un token de réinitialisation sécurisé
        reset_token = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(50))
        
        # Stocker le token avec une expiration (24h)
        if not hasattr(self, '_reset_tokens'):
            self.__class__._reset_tokens = {}
        self.__class__._reset_tokens[reset_token] = {
            'user_id': user.id,
            'expires_at': timezone.now() + timedelta(hours=24)
        }
        
        # ✅ MODIFICATION: Email adapté pour l'application mobile
        try:
            # Template d'email pour application mobile
            email_subject = f'Password Reset - {user.admin.name} Team (Mobile App)'
            email_body = f'''
Dear {user.username},

You have requested to reset your password for your employee account through the mobile application.

To reset your password, please use the following reset token in the mobile app:

════════════════════════════════════════
RESET TOKEN: {reset_token}
════════════════════════════════════════

INSTRUCTIONS FOR MOBILE APP:
1. Open the employee mobile application
2. Tap on "Forgot Password?" from the login screen
3. Enter your email address: {user.email}
4. When prompted, enter the reset token above
5. Create your new password

This reset token will expire in 24 hours for security reasons.

SECURITY NOTICE:
- This token is unique to your account
- Do not share this token with anyone
- If you did not request this password reset, please ignore this email

If you have any questions or problems, please contact your administrator:
Administrator: {user.admin.name}
Email: {user.admin.email}

Best regards,
{user.admin.name} Team

────────────────────────────────────────
This is an automated message for the employee mobile application.
Please do not reply to this email.
            '''
            
            send_mail(
                subject=email_subject,
                message=email_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            return Response({
                'message': 'If this email exists in our system, you will receive a password reset token shortly.',
                'success': True,
                # ✅ POUR LE DÉVELOPPEMENT: Afficher le token (SUPPRIMER EN PRODUCTION)
                'debug_info': {
                    'reset_token': reset_token,
                    'email_sent_to': user.email,
                    'expires_at': (timezone.now() + timedelta(hours=24)).isoformat()
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Log l'erreur pour debug
            print(f"Erreur envoi email: {e}")
            
            return Response({
                'message': 'If this email exists in our system, you will receive a password reset token shortly.',
                'success': True,
                'error': str(e),
                # ✅ POUR LE DÉVELOPPEMENT: Token même si email échoue
                'debug_info': {
                    'reset_token': reset_token,
                    'email_config_issue': True
                }
            }, status=status.HTTP_200_OK)


class EmployeeResetPasswordView(APIView):
    """
    Vue pour réinitialiser le mot de passe des employés avec le token
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
        
        # Chercher dans le dictionnaire temporaire
        if hasattr(EmployeeForgotPasswordView, '_reset_tokens'):
            token_data = EmployeeForgotPasswordView._reset_tokens.get(token)
            if token_data and timezone.now() < token_data['expires_at']:
                try:
                    user = User.objects.get(id=token_data['user_id'])
                except User.DoesNotExist:
                    return Response(
                        {'error': 'Invalid or expired reset token'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                return Response(
                    {'error': 'Invalid or expired reset token'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            return Response(
                {'error': 'Invalid or expired reset token'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Réinitialiser le mot de passe
        user.password = make_password(new_password)
        
        # Supprimer du dictionnaire temporaire
        if hasattr(EmployeeForgotPasswordView, '_reset_tokens'):
            EmployeeForgotPasswordView._reset_tokens.pop(token, None)
        
        user.save()
        
        return Response({
            'message': 'Password reset successfully. You can now login with your new password.',
            'user': {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'admin': {
                    'id': user.admin.id,
                    'name': user.admin.name,
                    'email': user.admin.email
                }
            }
        }, status=status.HTTP_200_OK)