// AuthContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AuthService from './authService';

// Actions
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  SET_LOADING: 'SET_LOADING',
  TOKEN_REFRESHED: 'TOKEN_REFRESHED'
};

// State initial
const initialState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: true,
  error: null
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        loading: false,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        loading: false,
        error: action.payload.error
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        loading: false,
        error: null
      };
    
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false
      };
    
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload.loading
      };

    case AUTH_ACTIONS.TOKEN_REFRESHED:
      return {
        ...state,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken || state.refreshToken
      };
    
    default:
      return state;
  }
};

// Context
const AuthContext = createContext();

// Provider
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Vérifier l'état de connexion au démarrage
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: { loading: true } });

      const isLoggedIn = await AuthService.isLoggedIn();
      
      if (isLoggedIn) {
        const userData = await AuthService.getUserData();
        const accessToken = await AuthService.getAccessToken();
        const refreshToken = await AuthService.getRefreshToken();
        
        if (userData && accessToken && refreshToken) {
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              user: userData,
              accessToken: accessToken,
              refreshToken: refreshToken
            }
          });
        } else {
          await AuthService.logout();
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    } catch (error) {
      console.error('Erreur vérification statut auth:', error);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  const login = async (email, password, adminName) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      const result = await AuthService.loginEmployee(email, password, adminName);

      if (result.success) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: result.data.user,
            accessToken: result.data.access,
            refreshToken: result.data.refresh
          }
        });
        return { success: true };
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: { error: result.error }
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Erreur login:', error);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: 'Une erreur inattendue s\'est produite' }
      });
      return { success: false, error: 'Une erreur inattendue s\'est produite' };
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      return { success: true };
    } catch (error) {
      console.error('Erreur logout:', error);
      // Même en cas d'erreur, on déconnecte localement
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      return { success: true };
    }
  };

  const refreshUserData = async () => {
    try {
      const result = await AuthService.getEmployeeProfile();
      
      if (result.success) {
        dispatch({
          type: AUTH_ACTIONS.SET_USER,
          payload: { user: result.data }
        });
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Erreur refresh user data:', error);
      return { success: false, error: 'Erreur lors de la mise à jour des données' };
    }
  };

  // Nouvelle fonction pour rafraîchir le token
  const refreshToken = async () => {
    try {
      const result = await AuthService.refreshToken();
      
      if (result.success) {
        dispatch({
          type: AUTH_ACTIONS.TOKEN_REFRESHED,
          payload: {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken
          }
        });
        return { success: true };
      } else {
        // Si le refresh échoue, déconnecter l'utilisateur
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Erreur refresh token:', error);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      return { success: false, error: 'Erreur lors du rafraîchissement du token' };
    }
  };

  // Fonction utilitaire pour faire des requêtes authentifiées
  const authenticatedRequest = async (url, options = {}) => {
    try {
      return await AuthService.authenticatedRequest(url, options);
    } catch (error) {
      if (error.message === 'Session expirée') {
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
      throw error;
    }
  };

  const value = {
    // State
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    loading: state.loading,
    error: state.error,
    
    // Actions
    login,
    logout,
    refreshUserData,
    refreshToken,
    checkAuthStatus,
    authenticatedRequest
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  
  return context;
};

export default AuthContext;