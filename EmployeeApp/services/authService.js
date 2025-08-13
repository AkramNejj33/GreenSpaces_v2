// services/authService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.1.10:8000'; // Votre IP locale

class AuthService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  // Clés de stockage
  STORAGE_KEYS = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    USER_DATA: 'userData',
  };

  // ================== MÉTHODES DE STOCKAGE ==================

  async setTokens(accessToken, refreshToken) {
    try {
      await AsyncStorage.multiSet([
        [this.STORAGE_KEYS.ACCESS_TOKEN, accessToken],
        [this.STORAGE_KEYS.REFRESH_TOKEN, refreshToken],
      ]);
    } catch (error) {
      console.error('Erreur sauvegarde tokens:', error);
      throw error;
    }
  }

  async getAccessToken() {
    try {
      return await AsyncStorage.getItem(this.STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Erreur récupération access token:', error);
      return null;
    }
  }

  async getRefreshToken() {
    try {
      return await AsyncStorage.getItem(this.STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Erreur récupération refresh token:', error);
      return null;
    }
  }

  async setUserData(userData) {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.USER_DATA, 
        JSON.stringify(userData)
      );
    } catch (error) {
      console.error('Erreur sauvegarde user data:', error);
      throw error;
    }
  }

  async getUserData() {
    try {
      const userData = await AsyncStorage.getItem(this.STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erreur récupération user data:', error);
      return null;
    }
  }

  async clearStoredData() {
    try {
      await AsyncStorage.multiRemove([
        this.STORAGE_KEYS.ACCESS_TOKEN,
        this.STORAGE_KEYS.REFRESH_TOKEN,
        this.STORAGE_KEYS.USER_DATA,
      ]);
    } catch (error) {
      console.error('Erreur suppression données:', error);
    }
  }

  // ================== MÉTHODES D'AUTHENTIFICATION ==================

  async loginEmployee(email, password, adminName) {
    try {
      console.log('Tentative de connexion pour:', email);

      const response = await fetch(`${this.baseURL}/api/employee/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
          admin_name: adminName,
        }),
      });

      const data = await response.json();
      console.log('Réponse login:', data);

      if (response.ok) {
        // Sauvegarder les tokens et données utilisateur
        await this.setTokens(data.access, data.refresh);
        await this.setUserData(data.user);

        return {
          success: true,
          data: data,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Erreur de connexion',
        };
      }
    } catch (error) {
      console.error('Erreur login:', error);
      return {
        success: false,
        error: 'Erreur de connexion au serveur',
      };
    }
  }

  async logout() {
    try {
      const refreshToken = await this.getRefreshToken();

      // Tenter de blacklister le token côté serveur
      if (refreshToken) {
        try {
          await fetch(`${this.baseURL}/api/employee/logout/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await this.getAccessToken()}`,
            },
            body: JSON.stringify({
              refresh: refreshToken,
            }),
          });
        } catch (error) {
          console.log('Erreur logout serveur (ignorée):', error);
        }
      }

      // Nettoyer le stockage local
      await this.clearStoredData();

      return { success: true };
    } catch (error) {
      console.error('Erreur logout:', error);
      // Même en cas d'erreur, nettoyer localement
      await this.clearStoredData();
      return { success: true };
    }
  }

  // ================== GESTION DES TOKENS ==================

  async refreshToken() {
    try {
      const refreshToken = await this.getRefreshToken();

      if (!refreshToken) {
        throw new Error('Pas de refresh token disponible');
      }

      console.log('Rafraîchissement du token...');

      const response = await fetch(`${this.baseURL}/api/employee/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh: refreshToken,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Sauvegarder le nouveau access token
        await AsyncStorage.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, data.access);
        
        // Si un nouveau refresh token est fourni, le sauvegarder aussi
        if (data.refresh) {
          await AsyncStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, data.refresh);
        }

        console.log('Token rafraîchi avec succès');
        return {
          success: true,
          accessToken: data.access,
          refreshToken: data.refresh || refreshToken,
        };
      } else {
        console.log('Échec du rafraîchissement:', data);
        return {
          success: false,
          error: data.error || 'Impossible de rafraîchir le token',
        };
      }
    } catch (error) {
      console.error('Erreur refresh token:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async isTokenValid() {
    try {
      const accessToken = await this.getAccessToken();
      
      if (!accessToken) {
        return false;
      }

      const response = await fetch(`${this.baseURL}/api/employee/token/status/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Erreur vérification token:', error);
      return false;
    }
  }

  async isLoggedIn() {
    try {
      const accessToken = await this.getAccessToken();
      const refreshToken = await this.getRefreshToken();
      const userData = await this.getUserData();

      // Vérifier que tous les éléments nécessaires sont présents
      if (!accessToken || !refreshToken || !userData) {
        return false;
      }

      // Vérifier la validité du token
      const isValid = await this.isTokenValid();
      
      if (isValid) {
        return true;
      }

      // Si le token n'est pas valide, essayer de le rafraîchir
      const refreshResult = await this.refreshToken();
      return refreshResult.success;
    } catch (error) {
      console.error('Erreur vérification connexion:', error);
      return false;
    }
  }

  // ================== REQUÊTES AUTHENTIFIÉES ==================

  async authenticatedRequest(endpoint, options = {}) {
    const accessToken = await this.getAccessToken();
    
    if (!accessToken) {
      throw new Error('Pas de token d\'accès disponible');
    }

    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        ...options.headers,
      },
      ...options,
    };

    try {
      let response = await fetch(url, config);

      // Si erreur 401, essayer de rafraîchir le token
      if (response.status === 401) {
        console.log('Token expiré, tentative de refresh...');
        
        const refreshResult = await this.refreshToken();
        
        if (refreshResult.success) {
          // Rejouer la requête avec le nouveau token
          config.headers['Authorization'] = `Bearer ${refreshResult.accessToken}`;
          response = await fetch(url, config);
        } else {
          // Si le refresh échoue, déconnecter l'utilisateur
          await this.logout();
          throw new Error('Session expirée');
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      console.error('Erreur requête authentifiée:', error);
      throw error;
    }
  }

  // ================== MÉTHODES SPÉCIFIQUES ==================

  async getEmployeeProfile() {
    try {
      const response = await this.authenticatedRequest('/api/employee/profile/');
      const data = await response.json();
      
      return {
        success: true,
        data: data.user,
      };
    } catch (error) {
      console.error('Erreur récupération profil:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async checkTokenStatus() {
    try {
      const response = await this.authenticatedRequest('/api/employee/token/status/');
      const data = await response.json();
      
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('Erreur vérification statut token:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async checkAdminExists(adminName) {
    try {
      const response = await fetch(`${this.baseURL}/api/employee/check-admin/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_name: adminName,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          exists: data.exists,
          admin: data.admin,
        };
      } else {
        return {
          success: false,
          exists: false,
          error: data.message,
        };
      }
    } catch (error) {
      console.error('Erreur vérification admin:', error);
      return {
        success: false,
        exists: false,
        error: 'Erreur de connexion',
      };
    }
  }

  // ================== MÉTHODES UTILITAIRES ==================

  async updateUserData(newUserData) {
    try {
      const currentUserData = await this.getUserData();
      const updatedUserData = { ...currentUserData, ...newUserData };
      await this.setUserData(updatedUserData);
      
      return {
        success: true,
        data: updatedUserData,
      };
    } catch (error) {
      console.error('Erreur mise à jour user data:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Méthode pour gérer les requêtes avec retry automatique
  async requestWithRetry(endpoint, options = {}, maxRetries = 3) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await this.authenticatedRequest(endpoint, options);
        return response;
      } catch (error) {
        lastError = error;
        
        if (i < maxRetries - 1 && error.message !== 'Session expirée') {
          console.log(`Tentative ${i + 1} échouée, retry dans 1s...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          break;
        }
      }
    }
    
    throw lastError;
  }

  // Debug - Afficher l'état de l'authentification
  async debugAuthState() {
    const accessToken = await this.getAccessToken();
    const refreshToken = await this.getRefreshToken();
    const userData = await this.getUserData();
    const isLoggedIn = await this.isLoggedIn();
    
    console.log('=== AUTH DEBUG ===');
    console.log('Access Token:', accessToken ? '✓' : '✗');
    console.log('Refresh Token:', refreshToken ? '✓' : '✗');
    console.log('User Data:', userData ? '✓' : '✗');
    console.log('Is Logged In:', isLoggedIn ? '✓' : '✗');
    console.log('==================');
  }
}

// Exporter une instance singleton
export default new AuthService();