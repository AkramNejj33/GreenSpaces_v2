// authInterceptor.js
import { Alert } from 'react-native';
import AuthService from './authService';

class AuthInterceptor {
  constructor() {
    this.listeners = [];
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  // Ajouter un listener pour les événements d'authentification
  addListener(callback) {
    this.listeners.push(callback);
    
    // Retourner une fonction pour supprimer le listener
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notifier tous les listeners
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Erreur dans le listener d\'auth:', error);
      }
    });
  }

  // Gérer les erreurs d'authentification
  async handleAuthError(error, originalRequest) {
    if (error.status === 401) {
      return this.handle401Error(originalRequest);
    }
    
    if (error.status === 403) {
      this.handleForbiddenError();
    }
    
    throw error;
  }

  // Gérer les erreurs 401 (token expiré)
  async handle401Error(originalRequest) {
    if (this.isRefreshing) {
      // Si on est déjà en train de rafraîchir, ajouter à la queue
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject, request: originalRequest });
      });
    }

    this.isRefreshing = true;

    try {
      console.log('Token expiré, tentative de refresh...');
      const refreshResult = await AuthService.refreshToken();

      if (refreshResult.success) {
        console.log('Token rafraîchi avec succès');
        
        // Traiter toutes les requêtes en attente
        this.processQueue(null, refreshResult.accessToken);
        
        // Retry la requête originale avec le nouveau token
        if (originalRequest) {
          return this.retryRequest(originalRequest, refreshResult.accessToken);
        }
        
        return refreshResult;
      } else {
        console.log('Échec du refresh, déconnexion nécessaire');
        this.processQueue(new Error('Token refresh failed'), null);
        this.handleSessionExpired();
        throw new Error('Session expired');
      }
    } catch (error) {
      console.error('Erreur lors du refresh du token:', error);
      this.processQueue(error, null);
      this.handleSessionExpired();
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  // Traiter la queue des requêtes en attente
  processQueue(error, token) {
    this.failedQueue.forEach(({ resolve, reject, request }) => {
      if (error) {
        reject(error);
      } else {
        resolve(this.retryRequest(request, token));
      }
    });
    
    this.failedQueue = [];
  }

  // Rejouer une requête avec un nouveau token
  async retryRequest(originalRequest, newToken) {
    const updatedRequest = {
      ...originalRequest,
      headers: {
        ...originalRequest.headers,
        'Authorization': `Bearer ${newToken}`,
      },
    };

    const response = await fetch(originalRequest.url, updatedRequest);
    
    if (!response.ok) {
      throw {
        status: response.status,
        message: response.statusText,
        response: response
      };
    }
    
    return response;
  }

  // Gérer les erreurs 403 (permissions insuffisantes)
  handleForbiddenError() {
    this.notifyListeners('forbidden', {
      message: 'Vous n\'avez pas les permissions pour cette action'
    });
    
    Alert.alert(
      'Accès refusé',
      'Vous n\'avez pas les permissions nécessaires pour effectuer cette action.',
      [{ text: 'OK' }]
    );
  }

  // Gérer l'expiration de session
  handleSessionExpired() {
    this.notifyListeners('session_expired', {
      message: 'Votre session a expiré'
    });
    
    Alert.alert(
      'Session expirée',
      'Votre session a expiré. Vous allez être redirigé vers la page de connexion.',
      [
        {
          text: 'OK',
          onPress: () => {
            // La déconnexion sera gérée par le contexte d'authentification
            AuthService.logout();
          }
        }
      ]
    );
  }

  // Wrapper pour fetch avec gestion automatique des erreurs d'auth
  async fetch(url, options = {}) {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const error = {
          status: response.status,
          message: response.statusText,
          response: response
        };
        
        // Si c'est une erreur d'authentification, la gérer
        if (response.status === 401 || response.status === 403) {
          return await this.handleAuthError(error, { url, ...options });
        }
        
        throw error;
      }
      
      return response;
    } catch (error) {
      // Si c'est une erreur réseau ou autre, la re-lancer
      if (!error.status) {
        throw error;
      }
      
      // Sinon, la gérer comme une erreur d'auth potentielle
      return await this.handleAuthError(error, { url, ...options });
    }
  }

  // Méthode pour vérifier le statut du token périodiquement
  startTokenValidation(intervalMs = 60000) { // Vérifier toutes les minutes par défaut
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
    }

    this.validationInterval = setInterval(async () => {
      try {
        const isLoggedIn = await AuthService.isLoggedIn();
        
        if (!isLoggedIn) {
          this.notifyListeners('token_invalid', {
            message: 'Token invalide détecté'
          });
        }
      } catch (error) {
        console.error('Erreur lors de la validation du token:', error);
      }
    }, intervalMs);
  }

  // Arrêter la validation périodique
  stopTokenValidation() {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
      this.validationInterval = null;
    }
  }

  // Nettoyer les ressources
  cleanup() {
    this.stopTokenValidation();
    this.listeners = [];
    this.failedQueue = [];
  }
}

// Exporter une instance singleton
export default new AuthInterceptor();