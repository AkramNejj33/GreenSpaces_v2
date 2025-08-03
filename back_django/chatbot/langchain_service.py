# chatbot/langchain_service.py - Version avec mémoire corrigée inspirée de votre code
from langchain_groq import ChatGroq
from langchain.memory import ConversationBufferWindowMemory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from django.conf import settings
from django.core.cache import cache
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class EspacesVertsChatbot:
    def __init__(self):
        # Initialiser le modèle Groq
        self.llm = ChatGroq(
            groq_api_key=settings.GROQ_API_KEY,
            model_name="llama-3.1-8b-instant",
            temperature=0.7,
            max_tokens=1000
        )
        
        # ✅ Dictionnaire pour stocker les mémoires par utilisateur (comme dans votre code)
        self.user_memories = {}
    
    def get_memory_for_user(self, user_id: str):
        """Récupère ou crée la mémoire pour un utilisateur"""
        if user_id not in self.user_memories:
            # ✅ Créer une nouvelle mémoire comme dans votre code
            self.user_memories[user_id] = ConversationBufferWindowMemory(
                k=5,  # Garder les 5 derniers échanges
                memory_key="chat_history",
                return_messages=True
            )
            logger.info(f"Nouvelle mémoire créée pour utilisateur {user_id}")
        
        return self.user_memories[user_id]
    
    def _create_prompt_template(self, user_context: str):
        """Créer le template de prompt avec contexte utilisateur"""
        
        # Déterminer le type d'utilisateur
        if "ADMINISTRATEUR" in user_context:
            user_intro = "Tu parles à un ADMINISTRATEUR des espaces verts."
        elif "EMPLOYÉ TERRAIN" in user_context:
            specialty_line = [line for line in user_context.split('\n') if 'SPÉCIALITÉ:' in line]
            if specialty_line:
                specialty = specialty_line[0].replace('SPÉCIALITÉ:', '').strip()
                user_intro = f"Tu parles à un EMPLOYÉ : {specialty}."
            else:
                user_intro = "Tu parles à un EMPLOYÉ terrain."
        else:
            user_intro = "Tu parles à un utilisateur des espaces verts."
        
        # ✅ PROMPT ENGINEERING COMPLET
        system_message = f"""{user_intro}

Tu es un assistant expert en gestion des espaces verts urbains, spécialisé dans :
- Technologies IoT et capteurs (humidité, météo, qualité sol)
- Télédétection par drones (NDVI, indices de végétation)
- Maintenance et interventions (arrosage, taille, désherbage, fertilisation)
- Gestion saisonnière et optimisation durable
- Réglementations environnementales

RÈGLES CRITIQUES - À RESPECTER ABSOLUMENT:
- Tu es un ASSISTANT VIRTUEL, pas un humain qui travaille sur le terrain
- Ne JAMAIS inventer de données NDVI, météo, ou capteurs
- Ne JAMAIS mentionner des secteurs spécifiques (A, B, C) sauf si l'utilisateur les mentionne
- Ne JAMAIS prétendre avoir accès à des données en temps réel
- Ne JAMAIS dire "j'ai analysé", "j'ai passé la matinée", "j'ai repéré"
- Toujours demander les données avant de donner des conseils spécifiques
- Être honnête sur tes limitations
- Tu connais déjà le profil de l'utilisateur, ne lui demande PAS son rôle ou sa spécialité
- Utilise l'historique de conversation pour répondre de façon cohérente
- Si on te demande "ma dernière question", référence-toi à l'historique précédent

ÉQUIPE DISPONIBLE (SPÉCIALITÉS EMPLOYÉS):
- Jardinier : Entretien général, plantations, taille légère
- Paysagiste : Conception, aménagement, esthétique
- Horticulteur : Soins spécialisés, santé des plantes, diagnostics
- Électronicien : Maintenance équipements électriques
- Technicien IoT : Capteurs, connectivité, analyse données
- Installateur capteurs : Pose, calibrage, maintenance capteurs
- Agent maintenance : Entretien général, réparations
- Spécialiste irrigation : Systèmes d'arrosage, hydraulique
- Gestionnaire énergie : Optimisation énergétique, éclairage

INSTRUCTIONS SELON TYPE D'UTILISATEUR:

SI ADMINISTRATEUR (TYPE UTILISATEUR: ADMINISTRATEUR):
- Propose des méthodologies de gestion
- Explique comment utiliser les données quand elles seront disponibles
- Recommande des protocoles de surveillance
- Aide à planifier les interventions BASÉES SUR DES DONNÉES RÉELLES
- Propose l'assignation d'employés selon leurs spécialités
- Donne des conseils de supervision et de coordination

SI EMPLOYÉ (TYPE UTILISATEUR: EMPLOYÉ TERRAIN):
- Explique les procédures techniques de sa spécialité
- Aide à interpréter les données qu'ils observent sur le terrain
- Donne des instructions pour la collecte de données
- Clarifie les protocoles de leur spécialité
- Propose des améliorations dans son domaine d'expertise

EXEMPLES CORRECTS:

Pour ADMIN qui dit "Bonjour":
→ "Bonjour ! Je suis là pour vous aider avec la gestion de vos espaces verts. Voulez-vous discuter de planification, d'assignation d'équipes, ou d'optimisation des interventions ?"

Pour EMPLOYÉ JARDINIER qui dit "Bonjour":
→ "Bonjour ! Je peux vous aider avec les techniques d'entretien, les procédures de plantation, ou l'interprétation des données terrain. Que puis-je faire pour vous ?"

Question: "Que faire si NDVI est faible ?"
→ "Si vous observez un NDVI faible, voici la procédure : 1) Vérifiez l'humidité du sol avec vos capteurs, 2) Inspection visuelle par un horticulteur, 3) Arrosage si nécessaire. Quelles sont les valeurs NDVI spécifiques que vous observez ?"

Question: "C'est quoi ma dernière question ?"
→ Référence-toi à l'historique de conversation pour répondre précisément.

IMPORTANT: Adapte tes réponses selon le profil utilisateur, sois factuel, ne jamais inventer de données, et utilise l'historique pour maintenir la cohérence conversationnelle."""
        
        # ✅ Utiliser ChatPromptTemplate avec MessagesPlaceholder
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", system_message),
            MessagesPlaceholder("chat_history"),  # ✅ Gestion automatique historique
            ("human", "{input}")
        ])
        
        return prompt_template
    
    def get_response(self, user_message: str, user_context: str, user_id: str) -> dict:
        """Génère une réponse avec mémoire conversationnelle"""
        try:
            # ✅ Récupérer la mémoire de l'utilisateur
            memory = self.get_memory_for_user(user_id)
            
            # ✅ Charger l'historique comme dans votre code
            chat_history = memory.load_memory_variables({}).get("chat_history", [])
            
            # ✅ Créer le prompt personnalisé
            prompt_template = self._create_prompt_template(user_context)
            
            # ✅ Créer la chaîne comme dans votre code
            chain = prompt_template | self.llm | StrOutputParser()
            
            # ✅ Invoker la chaîne avec l'historique
            response = chain.invoke({
                "input": user_message,
                "chat_history": chat_history
            })
            
            # ✅ Sauvegarder dans la mémoire comme dans votre code
            memory.save_context(
                {"input": user_message},
                {"output": response}
            )
            
            logger.info(f"Réponse générée pour {user_id}. Historique: {len(chat_history)} messages")
            
            return {
                "response": response,
                "success": True,
                "memory_length": len(chat_history) + 1  # +1 pour le nouveau message
            }
                
        except Exception as e:
            logger.error(f"Erreur génération réponse: {e}")
            return {
                "response": self._get_fallback_response(),
                "success": False,
                "error": str(e)
            }
    
    def _get_fallback_response(self):
        """Réponse de secours en cas d'erreur"""
        return """Je rencontre des difficultés techniques temporaires.

En attendant, voici des actions recommandées selon les situations courantes :

🌿 **Alertes végétation** : Contactez un horticulteur pour diagnostic
💧 **Problèmes d'arrosage** : Spécialiste irrigation ou technicien IoT  
🔧 **Pannes équipement** : Agent de maintenance
📊 **Analyse données NDVI** : Technicien IoT pour interprétation
🌳 **Taille/élagage** : Jardinier ou paysagiste selon ampleur

Je serai de nouveau opérationnel sous peu."""
    
    def clear_user_memory(self, user_id: str):
        """Efface la mémoire conversationnelle d'un utilisateur"""
        if user_id in self.user_memories:
            del self.user_memories[user_id]
            logger.info(f"Mémoire effacée pour utilisateur {user_id}")
    
    def get_memory_summary(self, user_id: str) -> str:
        """Récupère un résumé de la conversation pour l'utilisateur"""
        if user_id in self.user_memories:
            memory = self.user_memories[user_id]
            chat_history = memory.load_memory_variables({}).get("chat_history", [])
            if len(chat_history) > 0:
                return f"Conversation en cours : {len(chat_history)} échanges"
        return "Nouvelle conversation"

# Instance globale du chatbot
chatbot_service = EspacesVertsChatbot()