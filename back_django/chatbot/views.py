# chatbot/views.py - Version LangChain Simple
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.core.cache import cache
from datetime import datetime
import time
import logging
from .langchain_service import chatbot_service

logger = logging.getLogger(__name__)

class LangChainChatbotView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def __init__(self):
        super().__init__()
        # Rate limiting (12 messages par minute - LangChain est plus efficace)
        self.rate_limit = 12
        self.rate_window = 60
    
    def _check_rate_limit(self, user_id):
        """Vérifie le rate limiting pour un utilisateur"""
        cache_key = f"chatbot_rate_limit_{user_id}"
        current_requests = cache.get(cache_key, 0)
        
        if current_requests >= self.rate_limit:
            return False
        
        cache.set(cache_key, current_requests + 1, self.rate_window)
        return True
    
    def _get_user_context(self, user):
        """Récupère le contexte spécifique à l'utilisateur"""
        context_parts = []
        
        # Déterminer le type d'utilisateur selon le modèle
        if user.__class__.__name__ == 'Admin':
            # C'est un Admin
            context_parts.append(f"TYPE UTILISATEUR: ADMINISTRATEUR")
            context_parts.append(f"NOM: {user.name}")
            context_parts.append(f"EMAIL: {user.email}")
            context_parts.append(f"PERMISSIONS: Gestion complète, assignation tâches, supervision équipe")
            context_parts.append(f"RÔLE: Peut donner des ordres et assigner des tâches aux employés selon leurs spécialités")
            
        else:
            # C'est un User (Employé)
            context_parts.append(f"TYPE UTILISATEUR: EMPLOYÉ TERRAIN")
            context_parts.append(f"NOM: {user.username}")
            context_parts.append(f"EMAIL: {user.email}")
            
            # Ajouter la spécialité de l'employé
            if hasattr(user, 'specialty') and user.specialty:
                specialty_map = {
                    'jardinier': 'Jardinier - Expert entretien quotidien, plantations, taille légère',
                    'paysagiste': 'Paysagiste - Expert conception, aménagement, esthétique',
                    'horticulteur': 'Horticulteur - Expert santé végétale, diagnostics, traitements',
                    'electronicien': 'Électronicien - Expert équipements électriques, éclairage',
                    'technicien_iot': 'Technicien IoT - Expert capteurs, connectivité, analyse données',
                    'installateur_capteurs': 'Installateur capteurs - Expert pose, calibrage, maintenance capteurs',
                    'maintenance': 'Agent maintenance - Expert réparations générales, mobilier urbain',
                    'irrigation': 'Spécialiste irrigation - Expert systèmes d\'arrosage, hydraulique',
                    'gestion_energie': 'Gestionnaire énergie - Expert optimisation énergétique, éclairage',
                    'autre': 'Spécialiste autre domaine'
                }
                specialty_info = specialty_map.get(user.specialty, user.specialty)
                context_parts.append(f"SPÉCIALITÉ: {specialty_info}")
                context_parts.append(f"RÔLE: Exécute les tâches selon sa spécialité, peut demander clarifications")
        
        return "\n".join(context_parts)
    
    def post(self, request):
        """Endpoint principal du chatbot LangChain"""
        try:
            user = request.user
            user_message = request.data.get('message', '').strip()
            
            if not user_message:
                return Response(
                    {'error': 'Message requis'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Vérifier le rate limiting
            if not self._check_rate_limit(user.id):
                return Response(
                    {
                        'error': 'Trop de messages envoyés. Veuillez patienter une minute.',
                        'retry_after': 60
                    }, 
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            
            # Logs pour monitoring
            logger.info(f"LangChain chatbot - User {user.id} ({user.name}): {user_message[:100]}...")
            
            # Construire le contexte utilisateur
            user_context = self._get_user_context(user)
            
            # Générer la réponse avec LangChain
            start_time = time.time()
            result = chatbot_service.get_response(
                user_message=user_message,
                user_context=user_context,
                user_id=str(user.id)
            )
            response_time = time.time() - start_time
            
            # Logs de performance
            logger.info(f"LangChain response time: {response_time:.2f}s - Success: {result['success']}")
            
            response_data = {
                'response': result["response"],
                'timestamp': datetime.now().isoformat(),
                'response_time': round(response_time, 2),
                'powered_by': 'LangChain + Groq',
                'memory_length': result.get('memory_length', 0)
            }
            
            if result["success"]:
                return Response(response_data)
            else:
                response_data['error'] = result.get("error")
                return Response(response_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            logger.error(f"LangChain chatbot critical error: {str(e)}")
            return Response({
                'error': 'Erreur interne du chatbot',
                'message': 'Notre assistant rencontre des difficultés. Veuillez réessayer.',
                'timestamp': datetime.now().isoformat()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ChatbotMemoryView(APIView):
    """Endpoint pour gérer la mémoire conversationnelle"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Récupère des infos sur la mémoire de conversation"""
        try:
            user_id = str(request.user.id)
            memory_info = chatbot_service.get_memory_summary(user_id)
            
            return Response({
                'memory_summary': memory_info,
                'user_id': user_id,
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Memory info error: {str(e)}")
            return Response(
                {'error': 'Erreur lors de la récupération de l\'historique'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request):
        """Efface la mémoire de conversation"""
        try:
            user_id = str(request.user.id)
            chatbot_service.clear_user_memory(user_id)
            
            return Response({
                'message': 'Historique de conversation effacé avec succès',
                'user_id': user_id,
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Clear memory error: {str(e)}")
            return Response(
                {'error': 'Erreur lors de l\'effacement de l\'historique'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChatbotHealthView(APIView):
    """Endpoint pour vérifier l'état du chatbot"""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Check de santé du chatbot"""
        try:
            # Test simple du service
            test_result = chatbot_service.get_response(
                user_message="test",
                user_context="Test utilisateur",
                user_id="health_check"
            )
            
            # Nettoyer le test
            chatbot_service.clear_user_memory("health_check")
            
            return Response({
                'status': 'healthy' if test_result['success'] else 'degraded',
                'service': 'LangChain + Groq',
                'timestamp': datetime.now().isoformat(),
                'test_response_time': 'OK' if test_result['success'] else 'Error'
            })
            
        except Exception as e:
            logger.error(f"Health check error: {str(e)}")
            return Response({
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)