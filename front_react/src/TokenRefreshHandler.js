import { useEffect } from 'react';
import { useAuth } from './AuthContext';

const TokenRefreshHandler = ({ children }) => {
  const { tokenService, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Vérifier et refresh le token toutes les 25 minutes (5 min avant expiration)
    const interval = setInterval(async () => {
      console.log('🔄 Vérification périodique du token...');
      
      const newToken = await tokenService.refreshAccessToken();
      
      if (!newToken) {
        console.log('❌ Impossible de refresh le token, déconnexion');
        logout();
      }
    }, 25 * 60 * 1000); // 25 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, tokenService, logout]);

  return children;
};

export default TokenRefreshHandler;