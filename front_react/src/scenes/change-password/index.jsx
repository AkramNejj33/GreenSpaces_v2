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
  
  // ← CORRECTION: Appeler useAuth au niveau du composant
  const { user, logout, apiCall, tokenService } = useAuth();
  
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
      console.log('Sending request to:', 'http://localhost:8000/api/change-password');

      // ← CORRECTION: Utiliser apiCall qui est maintenant disponible dans la portée du composant
      const response = await apiCall('http://localhost:8000/api/change-password', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
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
        
      } else {
        // Handle error response
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
      }
      
    } catch (error) {
      console.error('=== NETWORK ERROR ===');
      console.error('Error:', error);
      
      if (error.message.includes('Session expired')) {
        setError('Your session has expired. You will be redirected to login.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Unable to connect to server. Please check your connection.');
      } else {
        setError('Network error. Please try again later.');
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