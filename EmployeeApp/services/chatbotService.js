// services/chatbotService.js - Extension de votre ApiClient pour le chatbot
import ApiClient from './apiClient';

class ChatbotService {
  // ✅ Envoyer un message au chatbot
  async sendMessage(message) {
    try {
      const response = await ApiClient.post('/api/chatbot/chat/', {
        message: message
      });

      if (response.ok) {
        return {
          success: true,
          data: await response.json()
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || 'Erreur de communication avec le chatbot'
        };
      }
    } catch (error) {
      console.error('Erreur envoi message chatbot:', error);
      return {
        success: false,
        error: error.message || 'Erreur de connexion'
      };
    }
  }

  // ✅ Effacer la mémoire de conversation
  async clearMemory() {
    try {
      const response = await ApiClient.delete('/api/chatbot/chat/memory/');
      
      if (response.ok) {
        return {
          success: true,
          message: 'Historique de conversation effacé'
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || 'Erreur lors de l\'effacement'
        };
      }
    } catch (error) {
      console.error('Erreur effacement mémoire chatbot:', error);
      return {
        success: false,
        error: error.message || 'Erreur de connexion'
      };
    }
  }

  // ✅ Récupérer les informations sur la mémoire de conversation
  async getMemoryInfo() {
    try {
      const response = await ApiClient.get('/api/chatbot/chat/memory/');
      
      if (response.ok) {
        return {
          success: true,
          data: await response.json()
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || 'Erreur récupération info mémoire'
        };
      }
    } catch (error) {
      console.error('Erreur info mémoire chatbot:', error);
      return {
        success: false,
        error: error.message || 'Erreur de connexion'
      };
    }
  }

  // ✅ Vérifier l'état de santé du chatbot
  async checkHealth() {
    try {
      const response = await ApiClient.get('/api/chatbot/health/');
      
      if (response.ok) {
        return {
          success: true,
          data: await response.json()
        };
      } else {
        return {
          success: false,
          error: 'Service chatbot indisponible'
        };
      }
    } catch (error) {
      console.error('Erreur santé chatbot:', error);
      return {
        success: false,
        error: error.message || 'Erreur de connexion'
      };
    }
  }

  // ✅ Méthode avec retry automatique pour les messages critiques
  async sendMessageWithRetry(message, maxRetries = 3) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await this.sendMessage(message);
        
        if (result.success) {
          return result;
        }
        
        lastError = result.error;
        
        // Ne pas retry si c'est une erreur de rate limiting
        if (result.error && result.error.includes('429')) {
          break;
        }
        
        if (i < maxRetries - 1) {
          console.log(`Tentative ${i + 1} échouée, retry dans 1s...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        lastError = error.message;
        
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    return {
      success: false,
      error: lastError || 'Erreur après plusieurs tentatives'
    };
  }

  // ✅ Formater les messages pour l'affichage
  formatMessage(text, sender, additionalData = {}) {
    return {
      id: Date.now() + Math.random(),
      text: text,
      sender: sender, // 'user' ou 'bot'
      timestamp: new Date(),
      ...additionalData
    };
  }

  // ✅ Valider un message avant envoi
  validateMessage(message) {
    if (!message || typeof message !== 'string') {
      return {
        valid: false,
        error: 'Le message doit être une chaîne de caractères'
      };
    }

    const trimmed = message.trim();
    
    if (trimmed.length === 0) {
      return {
        valid: false,
        error: 'Le message ne peut pas être vide'
      };
    }

    if (trimmed.length > 1000) {
      return {
        valid: false,
        error: 'Le message est trop long (max 1000 caractères)'
      };
    }

    return {
      valid: true,
      message: trimmed
    };
  }

  // ✅ Gérer les erreurs spécifiques du chatbot
  handleChatbotError(error) {
    if (typeof error === 'string') {
      if (error.includes('429')) {
        return 'Trop de messages envoyés. Veuillez patienter une minute.';
      }
      if (error.includes('401')) {
        return 'Session expirée. Veuillez vous reconnecter.';
      }
      if (error.includes('503')) {
        return 'Service temporairement indisponible. Veuillez réessayer plus tard.';
      }
      return error;
    }

    return 'Une erreur inattendue s\'est produite.';
  }

  // ✅ Statistiques d'utilisation (optionnel)
  getUsageStats() {
    // Vous pouvez stocker des stats localement si nécessaire
    return {
      messagesEnvoyes: 0,
      tempsTotal: 0,
      derniereUtilisation: null
    };
  }
}

// Exporter une instance singleton
export default new ChatbotService();