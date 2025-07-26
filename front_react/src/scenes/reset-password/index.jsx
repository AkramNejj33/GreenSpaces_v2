import { useSearchParams, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Alert,
  Paper,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Visibility,
  VisibilityOff,
  Lock,
  VpnKey,
  Save
} from "@mui/icons-material";
import { tokens } from '../../theme';

const ResetPassword = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Variables d'état manquantes ajoutées
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    token: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false
  });

  // Fonction pour gérer l'affichage/masquage des mots de passe
  const handleTogglePassword = (type) => {
    setShowPasswords(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Récupérer le token depuis l'URL
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setFormData(prev => ({ ...prev, token }));
    } else {
      setError('Token de réinitialisation manquant ou invalide');
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Effacer les messages d'erreur quand l'utilisateur tape
    if (error) setError('');
    if (message) setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validations côté client
    if (!formData.new_password || !formData.confirm_password) {
      setError('Tous les champs sont requis');
      return;
    }
    
    if (formData.new_password !== formData.confirm_password) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (formData.new_password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Mot de passe réinitialisé avec succès ! Redirection vers la page de connexion...');
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Mot de passe réinitialisé. Vous pouvez maintenant vous connecter.' 
            }
          });
        }, 2000);
      } else {
        setError(data.error || 'Erreur lors de la réinitialisation');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{
        backgroundColor: colors.primary[500],
        padding: 2
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          maxWidth: 400,
          width: '100%',
          backgroundColor: colors.primary[400],
        }}
      >
        {/* Header with icon */}
        <Box textAlign="center" mb="30px">
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              backgroundColor: colors.redAccent[500],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px auto"
            }}
          >
            <VpnKey sx={{ fontSize: 40, color: "white" }} />
          </Box>
          <Typography
            variant="h3"
            color={colors.grey[100]}
            fontWeight="bold"
            mb="10px"
          >
            Reset Password
          </Typography>
          <Typography variant="h6" color={colors.grey[300]}>
            Enter your new password below
          </Typography>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2,
              backgroundColor: colors.redAccent[800],
              color: colors.grey[100],
              '& .MuiAlert-icon': {
                color: colors.redAccent[500]
              }
            }}
          >
            {error}
          </Alert>
        )}

        {message && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 2,
              backgroundColor: colors.greenAccent[800],
              color: colors.grey[100],
              '& .MuiAlert-icon': {
                color: colors.greenAccent[500]
              }
            }}
          >
            {message}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            variant="outlined"
            type={showPasswords.new ? 'text' : 'password'}
            label="New Password"
            name="new_password"
            value={formData.new_password}
            onChange={handleChange}
            required
            sx={{ 
              mb: "20px",
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: colors.grey[600],
                },
                "&:hover fieldset": {
                  borderColor: colors.redAccent[500],
                },
                "&.Mui-focused fieldset": {
                  borderColor: colors.redAccent[500],
                },
              },
              "& .MuiInputLabel-root": {
                color: colors.grey[300],
              },
              "& .MuiInputBase-input": {
                color: colors.grey[100],
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: colors.grey[400] }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => handleTogglePassword('new')}
                    sx={{ color: colors.grey[400] }}
                  >
                    {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            variant="outlined"
            type={showPasswords.confirm ? 'text' : 'password'}
            label="Confirm New Password"
            name="confirm_password"
            value={formData.confirm_password}
            onChange={handleChange}
            required
            sx={{ 
              mb: "30px",
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: colors.grey[600],
                },
                "&:hover fieldset": {
                  borderColor: colors.redAccent[500],
                },
                "&.Mui-focused fieldset": {
                  borderColor: colors.redAccent[500],
                },
              },
              "& .MuiInputLabel-root": {
                color: colors.grey[300],
              },
              "& .MuiInputBase-input": {
                color: colors.grey[100],
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: colors.grey[400] }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => handleTogglePassword('confirm')}
                    sx={{ color: colors.grey[400] }}
                  >
                    {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading || !formData.token}
            sx={{
              backgroundColor: colors.greenAccent[700],
              color: colors.grey[100],
              fontSize: "14px",
              fontWeight: "bold",
              padding: "10px 20px",
              "&:hover": {
                backgroundColor: colors.greenAccent[600],
              },
              "&:disabled": {
                backgroundColor: colors.grey[500],
              },
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Réinitialiser le mot de passe'
            )}
          </Button>
        </form>

        <Box textAlign="center" mt={2}>
          <Button
            onClick={() => navigate('/login')}
            sx={{
              color: colors.greenAccent[500],
              textDecoration: 'underline',
              "&:hover": {
                backgroundColor: 'transparent',
                textDecoration: 'underline',
              },
            }}
          >
            Retour à la connexion
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ResetPassword;