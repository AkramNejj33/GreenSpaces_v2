import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  InputAdornment,
  Paper,
  CircularProgress,
  Alert
} from "@mui/material";
import { useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  Email,
  VpnKey,
  ArrowBack
} from "@mui/icons-material";
import { tokens } from "../../theme";

const ForgotPassword = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== FORGOT PASSWORD START ===');
    
    // Client-side validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const requestData = {
        email: email.trim()
      };

      console.log('Sending request to:', 'http://localhost:8000/api/forgot-password');
      console.log('Request data:', requestData);

      const response = await fetch('http://localhost:8000/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        setSuccess('If this email exists in our system, you will receive a password reset link shortly. Please check your email inbox and spam folder.');
        
        // Clear the form
        setEmail('');
        
        // Optional: redirect to login after some time
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Password reset email sent. Please check your email.' 
            }
          });
        }, 5000);
        
      } else {
        // Handle error response
        const errorMessage = data.error || data.message || 'An error occurred. Please try again.';
        setError(errorMessage);
      }
      
    } catch (error) {
      console.error('=== NETWORK ERROR ===');
      console.error('Error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Unable to connect to server. Please check your connection.');
      } else {
        setError('Network error. Please try again later.');
      }
    } finally {
      setIsLoading(false);
      console.log('=== FORGOT PASSWORD END ===');
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
                backgroundColor: colors.blueAccent[500],
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
              Forgot Password?
            </Typography>
            <Typography variant="h6" color={colors.grey[300]} textAlign="center">
              Enter your email address and we'll send you a link to reset your password.
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
              value={email}
              onChange={handleInputChange}
              required
              sx={{
                mb: "30px",
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: colors.grey[600],
                  },
                  "&:hover fieldset": {
                    borderColor: colors.blueAccent[500],
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: colors.blueAccent[500],
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

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{
                backgroundColor: colors.blueAccent[500],
                color: "white",
                fontSize: "16px",
                fontWeight: "bold",
                padding: "12px",
                mb: "20px",
                "&:hover": {
                  backgroundColor: colors.blueAccent[600],
                },
                "&:disabled": {
                  backgroundColor: colors.grey[600],
                },
              }}
              startIcon={
                isLoading ? (
                  <CircularProgress size={20} sx={{ color: "white" }} />
                ) : (
                  <Email />
                )
              }
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
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

export default ForgotPassword;