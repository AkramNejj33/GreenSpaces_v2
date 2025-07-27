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
import api, { tokenService } from '../../axiosConfig'; 

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
    
    // Validations...
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
      // ✅ SOLUTION SIMPLE: Utiliser Axios directement
      const response = await api.post('/login', {
        email: formData.email.trim(),
        password: formData.password
      });

      console.log('✅ Login successful!');
      
      if (response.data.access && response.data.refresh) {
        const userData = {
          access: response.data.access,
          refresh: response.data.refresh,
          user: {
            id: response.data.user?.id,
            name: response.data.user?.name,
            email: response.data.user?.email,
          }
        };

        // ✅ Le token sera automatiquement configuré dans Axios !
        login(userData, rememberMe);
        
        setSuccess('Login successful! Redirecting to dashboard...');
        
        const from = location.state?.from?.pathname || '/';
        
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 1000);
        
      } else {
        setError('Tokens missing from server response');
      }
    } catch (error) {
      console.error('=== LOGIN ERROR ===');
      
      if (error.response) {
        // Erreur du serveur
        const data = error.response.data;
        let errorMessage = 'Incorrect email or password';
        
        if (data.email) {
          errorMessage = Array.isArray(data.email) ? data.email[0] : data.email;
        } else if (data.password) {
          errorMessage = Array.isArray(data.password) ? data.password[0] : data.password;
        } else if (data.non_field_errors) {
          errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
        } else if (data.detail) {
          errorMessage = data.detail;
        }
        
        setError(errorMessage);
      } else if (error.request) {
        // Erreur réseau
        setError('🔌 Unable to connect to server. Check that Django is running on localhost:8000');
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