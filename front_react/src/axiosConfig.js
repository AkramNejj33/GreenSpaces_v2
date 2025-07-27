// axiosConfig.js
import axios from 'axios';

// ✅ Configuration de base d'Axios
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ✅ Service pour gérer les tokens
export const tokenService = {
  getAccessToken: () => {
    return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  },
  
  getRefreshToken: () => {
    return localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
  },
  
  setTokens: (accessToken, refreshToken, rememberMe = false) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    
    if (accessToken) {
      storage.setItem('access_token', accessToken);
      // ✅ SOLUTION SIMPLE: Configurer Axios globalement
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    }
    if (refreshToken) {
      storage.setItem('refresh_token', refreshToken);
    }
  },
  
  clearTokens: () => {
    ['access_token', 'refresh_token', 'userEmail', 'userName', 'userId'].forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // ✅ Supprimer le header Authorization
    delete api.defaults.headers.common['Authorization'];
  },
  
  initializeToken: () => {
    const token = tokenService.getAccessToken();
    if (token) {
      // ✅ Configurer le token au démarrage de l'app
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
};

// ✅ Intercepteur pour les réponses - Gestion automatique du refresh
api.interceptors.response.use(
  (response) => {
    // Retourner la réponse si tout va bien
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Si erreur 401 et qu'on n'a pas encore essayé de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = tokenService.getRefreshToken();
      
      if (refreshToken) {
        try {
          console.log('🔄 Token expiré, tentative de refresh...');
          
          // Appel pour refresh le token
          const response = await axios.post('http://localhost:8000/api/token/refresh', {
            refresh: refreshToken
          });
          
          const { access, refresh } = response.data;
          
          // Mettre à jour les tokens
          tokenService.setTokens(access, refresh);
          
          console.log('✅ Token refreshed avec succès');
          
          // Réessayer la requête originale avec le nouveau token
          originalRequest.headers['Authorization'] = `Bearer ${access}`;
          return api(originalRequest);
          
        } catch (refreshError) {
          console.log('❌ Impossible de refresh le token, déconnexion...');
          
          // Nettoyer les tokens et rediriger vers login
          tokenService.clearTokens();
          window.location.href = '/login';
          
          return Promise.reject(refreshError);
        }
      } else {
        // Pas de refresh token, rediriger vers login
        console.log('❌ Pas de refresh token, redirection vers login');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// ✅ Initialiser le token au chargement du module
tokenService.initializeToken();

export default api;