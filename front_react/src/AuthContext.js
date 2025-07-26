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

  // Fonction pour vérifier si l'utilisateur est authentifié
  const checkAuthStatus = () => {
    console.log('🔍 Vérification du statut d\'authentification...');
    
    // Chercher le token dans localStorage ou sessionStorage
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
    const userName = localStorage.getItem('userName') || sessionStorage.getItem('userName');
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    
    if (token && userEmail) {
      console.log('✅ Token trouvé, utilisateur authentifié');
      setIsAuthenticated(true);
      setUser({
        id: userId,
        name: userName,
        email: userEmail,
        token: token
      });
    } else {
      console.log('❌ Aucun token trouvé, utilisateur non authentifié');
      setIsAuthenticated(false);
      setUser(null);
    }
    
    setIsLoading(false);
  };

  // Fonction de connexion
  const login = (userData) => {
    console.log('✅ Connexion réussie, mise à jour du contexte');
    setIsAuthenticated(true);
    setUser(userData);
  };

  // Fonction de déconnexion
  const logout = () => {
    console.log('🚪 Déconnexion, nettoyage du contexte');
    setIsAuthenticated(false);
    setUser(null);
    
    // Nettoyer le stockage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('userId');
    
    sessionStorage.clear();
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
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};