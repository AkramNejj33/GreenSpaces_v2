import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
  Paper,
  CircularProgress,
  Alert
} from "@mui/material";
import { useTheme } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Login as LoginIcon
} from "@mui/icons-material";
import { tokens } from "../../theme";
import { useAuth } from "../../AuthContext";

const Login = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('=== LOGIN START ===');
    console.log('FormData:', formData);
    
    // Client-side validations
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    if (!formData.password.trim()) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // Prepare data for Django API
      const requestData = {
        email: formData.email.trim(),
        password: formData.password
      };

      console.log('Data sent to API:', requestData);
      console.log('API URL:', 'http://localhost:8000/api/login');

      // API call to Django backend
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });

      console.log('Response status:', response.status);

      let data;
      try {
        data = await response.json();
        console.log('Data received from server:', data);
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        throw new Error('Invalid server response (not JSON)');
      }

      if (response.ok) {
        // Login successful
        console.log('✅ Login successful!');
        
        // Store JWT token
        if (data.jwt) {
          const userData = {
            id: data.user?.id,
            name: data.user?.name,
            email: formData.email,
            token: data.jwt
          };

          if (rememberMe) {
            // localStorage (persistent)
            localStorage.setItem('authToken', data.jwt);
            localStorage.setItem('userEmail', formData.email);
            
            // User data
            if (data.user) {
              localStorage.setItem('userName', data.user.name);
              localStorage.setItem('userId', data.user.id);
            }
          } else {
            // sessionStorage (temporary)
            sessionStorage.setItem('authToken', data.jwt);
            sessionStorage.setItem('userEmail', formData.email);
            
            // User data
            if (data.user) {
              sessionStorage.setItem('userName', data.user.name);
              sessionStorage.setItem('userId', data.user.id);
            }
          }
          
          console.log('Token stored:', data.jwt);
          
          // Mettre à jour le contexte d'authentification
          login(userData);
          
          setSuccess('Login successful! Redirecting to dashboard...');
          
          // Récupérer la page d'origine ou rediriger vers le dashboard
          const from = location.state?.from?.pathname || '/';
          
          // Redirect after 1 second
          setTimeout(() => {
            navigate(from, { replace: true });
          }, 1000);
          
        } else {
          setError('Token missing from server response');
        }
        
      } else {
        // Server error
        console.log('❌ Server error:', data);
        
        let errorMessage = 'Incorrect email or password';
        
        // Handle specific Django errors
        if (data.email) {
          errorMessage = Array.isArray(data.email) ? data.email[0] : data.email;
        } else if (data.password) {
          errorMessage = Array.isArray(data.password) ? data.password[0] : data.password;
        } else if (data.non_field_errors) {
          errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.message) {
          errorMessage = data.message;
        }
        
        setError(errorMessage);
      }
    } catch (error) {
      console.error('=== NETWORK ERROR ===');
      console.error('Error type:', error.name);
      console.error('Error message:', error.message);
      
      // Specific error messages
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('🔌 Unable to connect to server. Check that Django is running on localhost:8000');
      } else if (error.message.includes('CORS')) {
        setError('🚫 CORS error. Configure django-cors-headers in your backend.');
      } else if (error.message.includes('NetworkError')) {
        setError('🌐 Network error. Check your internet connection and server accessibility.');
      } else {
        setError(`❌ Connection error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
      console.log('=== LOGIN END ===');
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // Fonction pour gérer la redirection vers forgot-password
  const handleForgotPassword = () => {
    navigate('/forgot-password');
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
              <Lock sx={{ fontSize: 40, color: "white" }} />
            </Box>
            <Typography
              variant="h3"
              color={colors.grey[100]}
              fontWeight="bold"
              mb="10px"
            >
              Welcome
            </Typography>
            <Typography variant="h5" color={colors.greenAccent[500]}>
              Sign in to your account
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
            {/* Email Field */}
            <TextField
              fullWidth
              variant="outlined"
              type="email"
              label="Email Address"
              name="email"
              value={formData.email}
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
                    <Email sx={{ color: colors.grey[400] }} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Password Field */}
            <TextField
              fullWidth
              variant="outlined"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              name="password"
              value={formData.password}
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
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      sx={{ color: colors.grey[400] }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Options */}
            <Box 
              display="flex" 
              justifyContent="space-between" 
              alignItems="center"
              mb="30px"
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    sx={{
                      color: colors.grey[400],
                      '&.Mui-checked': {
                        color: colors.greenAccent[500],
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ color: colors.grey[300] }}>
                    Remember me
                  </Typography>
                }
              />
              
              <Button
                variant="text"
                onClick={handleForgotPassword}
                sx={{ 
                  color: colors.greenAccent[500],
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: 'transparent',
                    textDecoration: 'underline',
                  }
                }}
              >
                Forgot password?
              </Button>
            </Box>

            {/* Login Button */}
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
                  <LoginIcon />
                )
              }
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            {/* Link to registration */}
            <Box textAlign="center">
              <Typography variant="body2" color={colors.grey[300]}>
                Don't have an account?{" "}
                <Button
                  variant="text"
                  onClick={() => navigate('/register')}
                  sx={{ 
                    color: colors.greenAccent[500],
                    textTransform: "none",
                    fontWeight: "bold"
                  }}
                >
                  Create account
                </Button>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Login;