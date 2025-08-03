# chatbot/authentication.py - Version corrigée pour web ET mobile
from rest_framework_simplejwt.authentication import JWTAuthentication
from users.models import User, Admin
import uuid
import logging

logger = logging.getLogger(__name__)

class AdminAuthWrapper:
    """Wrapper pour ajouter les propriétés d'authentification manquantes au modèle Admin"""
    def __init__(self, admin):
        self._admin = admin
        # ✅ Définir les propriétés d'authentification comme attributs d'instance
        self._is_authenticated = True
        self._is_active = True
        self._is_anonymous = False
    
    def __getattr__(self, name):
        # Déléguer tous les autres attributs vers l'admin original
        return getattr(self._admin, name)
    
    @property
    def is_authenticated(self):
        return self._is_authenticated
    
    @property
    def is_active(self):
        return self._is_active
    
    @property
    def is_anonymous(self):
        return self._is_anonymous
    
    def __str__(self):
        return str(self._admin)
    
    def __repr__(self):
        return repr(self._admin)

class UniversalJWTAuthentication(JWTAuthentication):
    """
    Authentification JWT qui gère:
    - Admins web (ID entiers) 
    - Employés mobile (UUID)
    - Ajoute is_authenticated aux modèles
    """
    
    def get_user(self, validated_token):
        try:
            user_id = validated_token.get('user_id')
            user_type = validated_token.get('user_type')
            
            logger.info(f"JWT Auth - user_id: {user_id}, user_type: {user_type}")
            
            # ✅ GESTION DES ADMINS WEB (ID entiers)
            if user_type is None or user_type == 'admin':
                try:
                    # ID entier pour les admins web
                    admin_id = int(user_id) if isinstance(user_id, str) else user_id
                    admin = Admin.objects.get(id=admin_id)
                    
                    # ✅ SOLUTION: Utiliser un wrapper au lieu d'assigner directement
                    wrapped_admin = AdminAuthWrapper(admin)
                    
                    logger.info(f"Admin web authentifié: {admin.name}")
                    return wrapped_admin
                    
                except (ValueError, Admin.DoesNotExist) as e:
                    logger.error(f"Admin non trouvé: {user_id} - {e}")
                    return None
            
            # ✅ GESTION DES EMPLOYÉS MOBILE (UUID)
            elif user_type == 'employee':
                try:
                    # UUID pour les employés mobile
                    if isinstance(user_id, str):
                        user_uuid = uuid.UUID(user_id)
                    else:
                        user_uuid = user_id
                    
                    user = User.objects.select_related('admin').get(id=user_uuid)
                    
                    # ✅ Pour les employés, assigner directement (fonctionne car hérite d'AbstractUser)
                    user.is_authenticated = True
                    user.is_active = True
                    user.is_anonymous = False
                    
                    logger.info(f"Employé mobile authentifié: {user.username} (Admin: {user.admin.name})")
                    return user
                    
                except (ValueError, TypeError, User.DoesNotExist) as e:
                    logger.error(f"Employé non trouvé: {user_id} - {e}")
                    return None
            
            else:
                logger.warning(f"Type d'utilisateur non supporté: {user_type}")
                return None
                
        except Exception as e:
            logger.error(f"Erreur authentification JWT générale: {e}")
            return None
    
    def authenticate(self, request):
        """Override avec debug amélioré"""
        try:
            result = super().authenticate(request)
            if result:
                user, token = result
                user_name = getattr(user, 'username', getattr(user, 'name', 'Unknown'))
                user_type = 'Admin' if hasattr(user, 'name') and not hasattr(user, 'username') else 'Employee'
                logger.info(f"Authentification réussie - {user_type}: {user_name}")
            return result
        except Exception as e:
            logger.error(f"Erreur dans authenticate: {e}")
            return None