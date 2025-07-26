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

  // Afficher un loader pendant la vérification
  if (isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        backgroundColor={colors.primary[500]}
        gap={2}
      >
        <CircularProgress 
          size={50} 
          sx={{ color: colors.greenAccent[500] }}
        />
        <Typography 
          variant="h6" 
          color={colors.grey[100]}
        >
          Vérification de l'authentification...
        </Typography>
      </Box>
    );
  }

  // Si pas authentifié, rediriger vers login
  if (!isAuthenticated) {
    console.log('🔒 Accès refusé, redirection vers login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si authentifié, afficher le composant enfant
  return children;
};

export default ProtectedRoute;