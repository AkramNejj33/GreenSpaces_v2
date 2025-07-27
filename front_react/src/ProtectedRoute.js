import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { tokens } from './theme';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // ✅ SOLUTION: Attendre que la vérification soit terminée
  if (isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        backgroundColor={colors.primary[500]}
      >
        <CircularProgress 
          size={60}
          sx={{ 
            color: colors.greenAccent[500],
            mb: 2 
          }} 
        />
        <Typography 
          variant="h6" 
          color={colors.grey[100]}
          textAlign="center"
        >
          Vérification de l'authentification...
        </Typography>
      </Box>
    );
  }

  // ✅ Ne rediriger vers login que si la vérification est terminée ET l'utilisateur n'est pas authentifié
  if (!isAuthenticated) {
    console.log('🚫 Utilisateur non authentifié, redirection vers login');
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // ✅ Utilisateur authentifié, afficher le contenu protégé
  console.log('✅ Utilisateur authentifié, accès autorisé');
  return children;
};

export default ProtectedRoute;