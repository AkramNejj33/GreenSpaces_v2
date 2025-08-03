// apiClient.js - Version mise à jour avec support chatbot
import AuthService from './authService';

const API_BASE_URL = 'http://192.168.1.43:8000'; // ✅ Mise à jour avec votre IP

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Méthode générique pour faire des requêtes avec gestion JWT
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      // Pour les requêtes authentifiées, utiliser AuthService
      if (options.authenticated !== false) {
        return await AuthService.authenticatedRequest(endpoint, options);
      }
      
      // Pour les requêtes non authentifiées
      return await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
    } catch (error) {
      console.error('Erreur API:', error);
      throw error;
    }
  }

  // Méthodes HTTP helper
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  async post(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : null,
      ...options,
    });
  }

  async put(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : null,
      ...options,
    });
  }

  async patch(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : null,
      ...options,
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }

  // ✅ NOUVELLES MÉTHODES CHATBOT
  async sendChatMessage(message) {
    try {
      const response = await this.post('/api/chatbot/chat/', { message });
      return await response.json();
    } catch (error) {
      throw new Error('Erreur lors de l\'envoi du message au chatbot');
    }
  }

  async clearChatMemory() {
    try {
      const response = await this.delete('/api/chatbot/chat/memory/');
      return await response.json();
    } catch (error) {
      throw new Error('Erreur lors de l\'effacement de l\'historique');
    }
  }

  async getChatMemoryInfo() {
    try {
      const response = await this.get('/api/chatbot/chat/memory/');
      return await response.json();
    } catch (error) {
      throw new Error('Erreur lors de la récupération de l\'historique');
    }
  }

  async getChatbotHealth() {
    try {
      const response = await this.get('/api/chatbot/health/');
      return await response.json();
    } catch (error) {
      throw new Error('Erreur lors de la vérification du chatbot');
    }
  }

  // Méthodes spécifiques pour les employés
  async getEmployeeProfile() {
    try {
      const response = await this.get('/api/employee/profile/');
      return await response.json();
    } catch (error) {
      throw new Error('Erreur lors de la récupération du profil');
    }
  }

  async checkTokenStatus() {
    try {
      const response = await this.get('/api/employee/token/status/');
      return await response.json();
    } catch (error) {
      throw new Error('Erreur lors de la vérification du token');
    }
  }

  // Exemple d'autres méthodes API que vous pourriez avoir
  async getEmployeeTasks() {
    try {
      const response = await this.get('/api/employee/tasks/');
      return await response.json();
    } catch (error) {
      throw new Error('Erreur lors de la récupération des tâches');
    }
  }

  async createTask(taskData) {
    try {
      const response = await this.post('/api/employee/tasks/', taskData);
      return await response.json();
    } catch (error) {
      throw new Error('Erreur lors de la création de la tâche');
    }
  }

  async updateTask(taskId, taskData) {
    try {
      const response = await this.put(`/api/employee/tasks/${taskId}/`, taskData);
      return await response.json();
    } catch (error) {
      throw new Error('Erreur lors de la mise à jour de la tâche');
    }
  }

  // Méthodes pour les requêtes non authentifiées
  async checkAdmin(adminName) {
    try {
      const response = await this.post('/api/employee/check-admin/', 
        { admin_name: adminName }, 
        { authenticated: false }
      );
      return await response.json();
    } catch (error) {
      throw new Error('Erreur lors de la vérification de l\'admin');
    }
  }

  // ✅ Méthodes pour mot de passe oublié (non authentifiées)
  async forgotPassword(email) {
    try {
      const response = await this.post('/api/employee/forgot-password/', 
        { email }, 
        { authenticated: false }
      );
      return await response.json();
    } catch (error) {
      throw new Error('Erreur lors de l\'envoi de l\'email de réinitialisation');
    }
  }

  async resetPassword(token, newPassword, confirmPassword) {
    try {
      const response = await this.post('/api/employee/reset-password/', 
        { 
          token, 
          new_password: newPassword, 
          confirm_password: confirmPassword 
        }, 
        { authenticated: false }
      );
      return await response.json();
    } catch (error) {
      throw new Error('Erreur lors de la réinitialisation du mot de passe');
    }
  }

  // Gestion des uploads de fichiers
  async uploadFile(endpoint, file, additionalData = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Ajouter des données supplémentaires
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });

      const response = await this.request(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          // Ne pas définir Content-Type pour FormData
          // Le navigateur le fera automatiquement avec boundary
        },
      });

      return await response.json();
    } catch (error) {
      throw new Error('Erreur lors de l\'upload du fichier');
    }
  }

  // Gestion des erreurs avec retry
  async requestWithRetry(endpoint, options = {}, maxRetries = 3) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await this.request(endpoint, options);
        
        if (response.ok) {
          return response;
        }
        
        // Si c'est une erreur 401 et que ce n'est pas le dernier essai
        if (response.status === 401 && i < maxRetries - 1) {
          console.log(`Tentative ${i + 1}: Token expiré, retry en cours...`);
          // AuthService gèrera automatiquement le refresh
          continue;
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error;
        
        if (i < maxRetries - 1) {
          console.log(`Tentative ${i + 1} échouée, retry dans 1s...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    throw lastError;
  }

  // ✅ Méthode spéciale pour le chatbot avec retry automatique
  async sendChatMessageWithRetry(message, maxRetries = 2) {
    return this.requestWithRetry('/api/chatbot/chat/', {
      method: 'POST',
      body: JSON.stringify({ message })
    }, maxRetries);
  }

  // ✅ Utilitaire pour gérer les erreurs spécifiques du chatbot
  handleChatbotError(error) {
    if (error.message.includes('429')) {
      return 'Trop de messages envoyés. Veuillez patienter une minute.';
    }
    if (error.message.includes('401')) {
      return 'Session expirée. Veuillez vous reconnecter.';
    }
    if (error.message.includes('503')) {
      return 'Service chatbot temporairement indisponible.';
    }
    return error.message || 'Erreur de communication avec le chatbot';
  }
}

// Exporter une instance singleton
export default new ApiClient();