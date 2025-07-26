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
  LinearProgress,
  Alert
} from "@mui/material";
import { useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  PersonAdd,
  Check
} from "@mui/icons-material";
import { tokens } from "../../theme";

const Register = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
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

  // Function to test server connection (CORRECTED)
  const testServerConnection = async () => {
    try {
      // Test the register endpoint that actually exists
      const response = await fetch('http://localhost:8000/api/register', {
        method: 'OPTIONS', // Safe method for testing
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Server connection test:', response.status);
      return response.ok || response.status === 405; // 405 = Method Not Allowed (normal for OPTIONS)
    } catch (error) {
      console.error('Server not accessible:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('=== START FORM SUBMISSION ===');
    console.log('FormData:', formData);
    
    // Client-side validations
    if (!acceptTerms) {
      setError('Please accept the terms of use');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must contain at least 6 characters');
      return;
    }

    if (!formData.firstName.trim()) {
      setError('First name is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    setIsLoading(true);
    setError('');

    console.log('✅ Sending data to Django...');
    
    try {
      // Prepare data for Django API
      const requestData = {
        name: formData.firstName.trim(),
        email: formData.email.trim(),
        password: formData.password
      };

      console.log('Data sent to API:', requestData);
      console.log('API URL:', 'http://localhost:8000/api/register');

      // API call to your Django backend (URL CORRECTED)
      const response = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
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
        // Registration successful
        console.log('✅ Registration successful!');
        setSuccess('Account created successfully! Redirecting to login page...');
        
        // Redirect to login page after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        
      } else {
        // Server error
        console.log('❌ Server error:', data);
        
        let errorMessage = 'Error creating account.';
        
        // Handling specific Django errors
        if (data.email) {
          errorMessage = Array.isArray(data.email) ? data.email[0] : data.email;
        } else if (data.password) {
          errorMessage = Array.isArray(data.password) ? data.password[0] : data.password;
        } else if (data.name) {
          errorMessage = Array.isArray(data.name) ? data.name[0] : data.name;
        } else if (data.non_field_errors) {
          errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.error) {
          errorMessage = data.error;
        }
        
        setError(errorMessage);
      }
    } catch (error) {
      console.error('=== NETWORK ERROR ===');
      console.error('Error type:', error.name);
      console.error('Error message:', error.message);
      
      // More specific error messages
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('🔌 Unable to connect to server. Check that Django is running on localhost:8000');
      } else if (error.message.includes('CORS')) {
        setError('🚫 CORS error. Configure django-cors-headers in your backend.');
      } else if (error.message.includes('NetworkError')) {
        setError('🌐 Network error. Check your internet connection and that the server is accessible.');
      } else {
        setError(`❌ Connection error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
      console.log('=== END FORM SUBMISSION ===');
    }
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (password.length === 0) return { strength: 0, color: colors.grey[600], text: '' };
    if (password.length < 6) return { strength: 25, color: colors.redAccent[500], text: 'Weak' };
    if (password.length < 8) return { strength: 50, color: colors.blueAccent[500], text: 'Medium' };
    if (password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { strength: 100, color: colors.greenAccent[500], text: 'Strong' };
    }
    return { strength: 75, color: colors.blueAccent[500], text: 'Medium' };
  };

  const passwordStrength = getPasswordStrength();
  const passwordsMatch = formData.password && formData.confirmPassword && 
                        formData.password === formData.confirmPassword;

  // Server connection test button (CORRECTED)
  const testConnection = async () => {
    setError('');
    setSuccess('');
    
    const isAccessible = await testServerConnection();
    if (isAccessible) {
      setSuccess('✅ Server accessible! You can create your account.');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError('❌ Server not accessible. Check that Django is running on localhost:8000');
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
              <PersonAdd sx={{ fontSize: 40, color: "white" }} />
            </Box>
            <Typography
              variant="h3"
              color={colors.grey[100]}
              fontWeight="bold"
              mb="10px"
            >
              Create an account
            </Typography>
            <Typography variant="h5" color={colors.greenAccent[500]}>
              Join our platform
            </Typography>
          </Box>

          {/* Connection test button */}
          <Box textAlign="center" mb="20px">
            <Button
              onClick={testConnection}
              variant="outlined"
              size="small"
              sx={{
                color: colors.blueAccent[500],
                borderColor: colors.blueAccent[500],
                textTransform: "none",
                "&:hover": {
                  borderColor: colors.blueAccent[400],
                  backgroundColor: colors.blueAccent[500] + '10',
                }
              }}
            >
              🔍 Test server connection
            </Button>
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
            {/* First name */}
            <TextField
              fullWidth
              variant="outlined"
              type="text"
              label="First name"
              name="firstName"
              value={formData.firstName}
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
                    <Person sx={{ color: colors.grey[400] }} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Email */}
            <TextField
              fullWidth
              variant="outlined"
              type="email"
              label="Email address"
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

            {/* Password */}
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
                mb: "10px",
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
                      onClick={() => setShowPassword(!showPassword)}
                      sx={{ color: colors.grey[400] }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Password strength indicator */}
            {formData.password && (
              <Box sx={{ mb: "20px" }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <LinearProgress
                    variant="determinate"
                    value={passwordStrength.strength}
                    sx={{
                      flex: 1,
                      height: 8,
                      borderRadius: 5,
                      backgroundColor: colors.grey[600],
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: passwordStrength.color,
                        borderRadius: 5,
                      },
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{ 
                      color: passwordStrength.color,
                      fontWeight: "bold",
                      minWidth: "60px"
                    }}
                  >
                    {passwordStrength.text}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Confirm password */}
            <TextField
              fullWidth
              variant="outlined"
              type={showConfirmPassword ? 'text' : 'password'}
              label="Confirm password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              sx={{
                mb: "10px",
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
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      sx={{ color: colors.grey[400] }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Password validation */}
            {formData.confirmPassword && (
              <Box display="flex" alignItems="center" sx={{ mb: "20px" }}>
                {passwordsMatch ? (
                  <>
                    <Check sx={{ color: colors.greenAccent[500], mr: 1 }} />
                    <Typography variant="body2" color={colors.greenAccent[500]}>
                      Passwords match
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body2" color={colors.redAccent[500]}>
                    Passwords do not match
                  </Typography>
                )}
              </Box>
            )}

            {/* Terms acceptance */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
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
                  I accept the{" "}
                  <Button
                    variant="text"
                    sx={{ 
                      color: colors.greenAccent[500],
                      textTransform: "none",
                      textDecoration: "underline",
                      p: 0,
                      minWidth: "auto"
                    }}
                  >
                    terms of use
                  </Button>
                  {" "}and the{" "}
                  <Button
                    variant="text"
                    sx={{ 
                      color: colors.greenAccent[500],
                      textTransform: "none",
                      textDecoration: "underline",
                      p: 0,
                      minWidth: "auto"
                    }}
                  >
                    privacy policy
                  </Button>
                </Typography>
              }
              sx={{ mb: "30px" }}
            />

            {/* Create button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading || !acceptTerms || !formData.firstName.trim() || !formData.email.trim() || !formData.password || !passwordsMatch}
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
                  color: colors.grey[300],
                },
              }}
              startIcon={
                isLoading ? (
                  <CircularProgress size={20} sx={{ color: "white" }} />
                ) : (
                  <PersonAdd />
                )
              }
            >
              {isLoading ? "Creating account..." : "Create my account"}
            </Button>

            {/* Link to login */}
            <Box textAlign="center">
              <Typography variant="body2" color={colors.grey[300]}>
                Already have an account?{" "}
                <Button
                  variant="text"
                  onClick={() => navigate('/login')}
                  sx={{ 
                    color: colors.greenAccent[500],
                    textTransform: "none",
                    fontWeight: "bold"
                  }}
                >
                  Sign in
                </Button>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Register;