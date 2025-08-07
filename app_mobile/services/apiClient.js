// apiClient.js
import AuthService from './authService';

const API_BASE_URL = 'http://your-backend-url.com'; // Remplacez par votre URL

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
}

// Exporter une instance singleton
export default new ApiClient();