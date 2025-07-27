import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  // ← NOUVEAU: Service pour gérer les tokens JWT
  const tokenService = {
    getAccessToken: () => {
      return localStorage.getItem('access_token') || 
             sessionStorage.getItem('access_token');
    },
    
    getRefreshToken: () => {
      return localStorage.getItem('refresh_token') || 
             sessionStorage.getItem('refresh_token');
    },
    
    setTokens: (accessToken, refreshToken, rememberMe = false) => {
      const storage = rememberMe ? localStorage : sessionStorage;
      
      if (accessToken) {
        storage.setItem('access_token', accessToken);
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
    },
    
    // ← NOUVEAU: Fonction pour rafraîchir automatiquement le token
    refreshAccessToken: async () => {
      const refreshToken = tokenService.getRefreshToken();
      
      if (!refreshToken) {
        console.log('❌ Pas de refresh token disponible');
        return null;
      }
      
      try {
        console.log('🔄 Tentative de refresh du token...');
        
        const response = await fetch('http://localhost:8000/api/token/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            refresh: refreshToken
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Token refreshed successfully');
          
          // Mettre à jour les tokens
          tokenService.setTokens(data.access, data.refresh);
          
          return data.access;
        } else {
          console.log('❌ Refresh token expiré ou invalide');
          return null;
        }
      } catch (error) {
        console.error('❌ Erreur lors du refresh:', error);
        return null;
      }
    }
  };

  // ← NOUVEAU: Intercepteur pour les requêtes API avec refresh automatique
  const apiCall = async (url, options = {}) => {
    let accessToken = tokenService.getAccessToken();
    
    // Première tentative avec le token actuel
    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    // Si 401, essayer de refresh le token
    if (response.status === 401) {
      console.log('🔄 Token expiré, tentative de refresh...');
      
      const newAccessToken = await tokenService.refreshAccessToken();
      
      if (newAccessToken) {
        // Refaire la requête avec le nouveau token
        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newAccessToken}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
      } else {
        // Refresh échoué, déconnecter l'utilisateur
        console.log('❌ Impossible de refresh, déconnexion...');
        logout();
        throw new Error('Session expired, please login again');
      }
    }
    
    return response;
  };

  // ← MODIFICATION: Fonction pour vérifier si l'utilisateur est authentifié
  const checkAuthStatus = async () => {
    console.log('🔍 Vérification du statut d\'authentification...');
    
    const accessToken = tokenService.getAccessToken();
    const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
    const userName = localStorage.getItem('userName') || sessionStorage.getItem('userName');
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    
    if (accessToken && userEmail) {
      try {
        // ← NOUVEAU: Vérifier le token auprès du serveur
        const response = await apiCall('http://localhost:8000/api/token/status');
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Token valide, utilisateur authentifié');
          
          setIsAuthenticated(true);
          setUser({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            token: tokenService.getAccessToken()
          });
        } else {
          console.log('❌ Token invalide');
          tokenService.clearTokens();
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.log('❌ Erreur de vérification:', error.message);
        if (error.message.includes('Session expired')) {
          // L'erreur vient de apiCall, la déconnexion a déjà été effectuée
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    } else {
      console.log('❌ Aucun token trouvé, utilisateur non authentifié');
      setIsAuthenticated(false);
      setUser(null);
    }
    
    setIsLoading(false);
  };

  // ← MODIFICATION: Fonction de connexion
  const login = (userData, rememberMe = false) => {
    console.log('✅ Connexion réussie, mise à jour du contexte');
    
    // Stocker les tokens
    tokenService.setTokens(userData.access, userData.refresh, rememberMe);
    
    // Stocker les infos utilisateur
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('userEmail', userData.user.email);
    storage.setItem('userName', userData.user.name);
    storage.setItem('userId', userData.user.id);
    
    setIsAuthenticated(true);
    setUser(userData.user);
  };

  // ← MODIFICATION: Fonction de déconnexion
  const logout = async () => {
    console.log('🚪 Déconnexion, nettoyage du contexte');
    
    try {
      // Appeler l'endpoint de logout sur le serveur pour blacklister les tokens
      await fetch('http://localhost:8000/api/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenService.getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          refresh: tokenService.getRefreshToken()
        }),
      });
    } catch (error) {
      console.log('Erreur lors de la déconnexion:', error);
    }
    
    // Nettoyer le stockage local
    tokenService.clearTokens();
    
    setIsAuthenticated(false);
    setUser(null);
  };

  // Vérifier l'authentification au montage du composant
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    checkAuthStatus,
    apiCall, // ← NOUVEAU: Exposer la fonction apiCall pour les composants
    tokenService // ← NOUVEAU: Exposer le service de tokens
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
