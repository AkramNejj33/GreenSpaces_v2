// CORRECTION - ChangePassword (scenes/change-password/index.jsx)
import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  Paper,
  CircularProgress,
  Alert
} from "@mui/material";
import { useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  Visibility,
  VisibilityOff,
  Lock,
  Security,
  Save,
  ArrowBack
} from "@mui/icons-material";
import { tokens } from "../../theme";
import { useAuth } from "../../AuthContext";

const ChangePassword = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  
  // ✅ CORRECTION: Utiliser 'api' au lieu de 'apiCall' et 'tokenService'
  const { user, logout, api } = useAuth();
  
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleTogglePassword = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== CHANGE PASSWORD START ===');
    
    // Client-side validations
    if (!formData.current_password) {
      setError('Current password is required');
      return;
    }

    if (!formData.new_password) {
      setError('New password is required');
      return;
    }

    if (!formData.confirm_password) {
      setError('Please confirm your new password');
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      setError('New passwords do not match');
      return;
    }

    if (formData.new_password.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (formData.current_password === formData.new_password) {
      setError('New password must be different from current password');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('Sending request to:', '/change-password');

      // ✅ CORRECTION: Utiliser l'instance 'api' d'Axios au lieu de fetch
      const response = await api.post('/change-password', formData);

      console.log('Response:', response.data);

      // ✅ Avec Axios, pas besoin de vérifier response.ok
      setSuccess('Password changed successfully! You will be logged out for security reasons.');
      
      // Clear the form
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      // Log out the user and redirect to login after 3 seconds
      setTimeout(() => {
        logout();
        navigate('/login', { 
          state: { 
            message: 'Password changed successfully. Please log in with your new password.' 
          }
        });
      }, 3000);
      
    } catch (error) {
      console.error('=== CHANGE PASSWORD ERROR ===');
      console.error('Error:', error);
      
      // ✅ Gestion d'erreur Axios
      if (error.response) {
        // Erreur de réponse du serveur
        const data = error.response.data;
        let errorMessage = 'Failed to change password';
        
        if (data.error) {
          errorMessage = data.error;
        } else if (data.current_password) {
          errorMessage = Array.isArray(data.current_password) ? data.current_password[0] : data.current_password;
        } else if (data.new_password) {
          errorMessage = Array.isArray(data.new_password) ? data.new_password[0] : data.new_password;
        } else if (data.detail) {
          errorMessage = data.detail;
        }
        
        setError(errorMessage);
      } else if (error.request) {
        // Erreur de réseau
        setError('Unable to connect to server. Please check your connection.');
      } else {
        // Autre erreur
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
      console.log('=== CHANGE PASSWORD END ===');
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
                backgroundColor: colors.greenAccent[500],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px auto"
              }}
            >
              <Security sx={{ fontSize: 40, color: "white" }} />
            </Box>
            <Typography
              variant="h3"
              color={colors.grey[100]}
              fontWeight="bold"
              mb="10px"
            >
              Change Password
            </Typography>
            <Typography variant="h6" color={colors.grey[300]} textAlign="center">
              Update your password for {user?.email}
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
          
          {success && (
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
              {success}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit}>
            {/* Current Password Field */}
            <TextField
              fullWidth
              variant="outlined"
              type={showPasswords.current ? 'text' : 'password'}
              label="Current Password"
              name="current_password"
              value={formData.current_password}
              onChange={handleInputChange}
              required
              sx={{
                mb: "20px",
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: colors.grey[600],
                  },
                  "&:hover fieldset": {
                    borderColor: colors.greenAccent[500],
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: colors.greenAccent[500],
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
                      onClick={() => handleTogglePassword('current')}
                      sx={{ color: colors.grey[400] }}
                    >
                      {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* New Password Field */}
            <TextField
              fullWidth
              variant="outlined"
              type={showPasswords.new ? 'text' : 'password'}
              label="New Password"
              name="new_password"
              value={formData.new_password}
              onChange={handleInputChange}
              required
              sx={{
                mb: "20px",
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: colors.grey[600],
                  },
                  "&:hover fieldset": {
                    borderColor: colors.greenAccent[500],
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: colors.greenAccent[500],
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

            {/* Confirm New Password Field */}
            <TextField
              fullWidth
              variant="outlined"
              type={showPasswords.confirm ? 'text' : 'password'}
              label="Confirm New Password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleInputChange}
              required
              sx={{
                mb: "30px",
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: colors.grey[600],
                  },
                  "&:hover fieldset": {
                    borderColor: colors.greenAccent[500],
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: colors.greenAccent[500],
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

            {/* Change Password Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{
                backgroundColor: colors.greenAccent[500],
                color: "white",
                fontSize: "16px",
                fontWeight: "bold",
                padding: "12px",
                mb: "20px",
                "&:hover": {
                  backgroundColor: colors.greenAccent[600],
                },
                "&:disabled": {
                  backgroundColor: colors.grey[600],
                },
              }}
              startIcon={
                isLoading ? (
                  <CircularProgress size={20} sx={{ color: "white" }} />
                ) : (
                  <Save />
                )
              }
            >
              {isLoading ? "Changing Password..." : "Change Password"}
            </Button>

            {/* Back to dashboard */}
            <Box textAlign="center">
              <Button
                variant="text"
                onClick={() => navigate('/')}
                sx={{ 
                  color: colors.greenAccent[500],
                  textTransform: "none",
                  fontWeight: "bold"
                }}
                startIcon={<ArrowBack />}
              >
                Back to Dashboard
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default ChangePassword;