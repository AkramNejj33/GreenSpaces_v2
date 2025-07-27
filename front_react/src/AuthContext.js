import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { tokenService } from './axiosConfig'; // ← Import de votre config Axios

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

  // ✅ Fonction pour vérifier si l'utilisateur est authentifié
  const checkAuthStatus = async () => {
    console.log('🔍 Vérification du statut d\'authentification...');
    
    const accessToken = tokenService.getAccessToken();
    const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
    
    if (accessToken && userEmail) {
      try {
        // ✅ Plus besoin de gérer les headers, Axios le fait automatiquement !
        const response = await api.get('/token/status');
        
        console.log('✅ Token valide, utilisateur authentifié');
        
        setIsAuthenticated(true);
        setUser({
          id: response.data.user.id,
          name: response.data.user.name,
          email: response.data.user.email,
        });
      } catch (error) {
        console.log('❌ Token invalide');
        tokenService.clearTokens();
        setIsAuthenticated(false);
        setUser(null);
      }
    } else {
      console.log('❌ Aucun token trouvé');
      setIsAuthenticated(false);
      setUser(null);
    }
    
    setIsLoading(false);
  };

  // ✅ Fonction de connexion
  const login = (userData, rememberMe = false) => {
    console.log('✅ Connexion réussie');
    
    // ✅ Configurer les tokens (Axios sera automatiquement configuré)
    tokenService.setTokens(userData.access, userData.refresh, rememberMe);
    
    // Stocker les infos utilisateur
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('userEmail', userData.user.email);
    storage.setItem('userName', userData.user.name);
    storage.setItem('userId', userData.user.id);
    
    setIsAuthenticated(true);
    setUser(userData.user);
  };

  // ✅ Fonction de déconnexion
  const logout = async () => {
    console.log('🚪 Déconnexion');
    
    try {
      // ✅ Plus besoin de gérer les headers manuellement !
      await api.post('/logout', {
        refresh: tokenService.getRefreshToken()
      });
    } catch (error) {
      console.log('Erreur lors de la déconnexion:', error);
    }
    
    // Nettoyer les tokens (supprimera automatiquement les headers Axios)
    tokenService.clearTokens();
    
    setIsAuthenticated(false);
    setUser(null);
  };

  // Vérifier l'authentification au montage
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
    // ✅ Exposer l'instance Axios configurée
    api
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};