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
  Save,
  ArrowBack
} from "@mui/icons-material";
import { tokens } from '../../theme';

const ResetPassword = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Variables d'état
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
      setError('Reset token is missing or invalid');
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
      setError('All fields are required');
      return;
    }
    
    if (formData.new_password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.new_password.length < 6) {
      setError('Password must be at least 6 characters long');
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
        setMessage('Password reset successfully! Redirecting to login page...');
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Password reset successful. You can now log in with your new password.' 
            }
          });
        }, 2000);
      } else {
        setError(data.error || 'Error occurred during password reset');
      }
    } catch (error) {
      console.error('Error:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Unable to connect to server. Please check your connection.');
      } else {
        setError('Network error. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box m="20px">
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="60vh"
        mt="40px"
      >
        <Paper
          elevation={3}
          sx={{
            padding: "40px",
            maxWidth: "500px",
            width: "100%",
            backgroundColor: colors.primary[400],
            borderRadius: "12px"
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
            <Typography variant="h6" color={colors.grey[300]} textAlign="center">
              Enter your new password below
            </Typography>
          </Box>

          {/* Error and success messages */}
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

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit}>
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

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || !formData.token}
              sx={{
                backgroundColor: colors.redAccent[500],
                color: "white",
                fontSize: "16px",
                fontWeight: "bold",
                padding: "12px",
                mb: "20px",
                "&:hover": {
                  backgroundColor: colors.redAccent[600],
                },
                "&:disabled": {
                  backgroundColor: colors.grey[600],
                },
              }}
              startIcon={
                loading ? (
                  <CircularProgress size={20} sx={{ color: "white" }} />
                ) : (
                  <Save />
                )
              }
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </Button>

            {/* Back to login */}
            <Box textAlign="center">
              <Button
                variant="text"
                onClick={() => navigate('/login')}
                sx={{ 
                  color: colors.greenAccent[500],
                  textTransform: "none",
                  fontWeight: "bold"
                }}
                startIcon={<ArrowBack />}
              >
                Back to Login
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default ResetPassword;