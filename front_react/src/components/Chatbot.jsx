// components/Chatbot/Chatbot.jsx - Version avec backend LangChain
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  TextField,
  Avatar,
  Slide,
  Badge,
  Tooltip,
  Divider,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { tokens } from '../theme';
import { useAuth } from '../AuthContext';

const Chatbot = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const messagesEndRef = useRef(null);
  const { user, api } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Bonjour ! Je suis votre assistant intelligent spécialisé dans la gestion des espaces verts. Comment puis-je vous aider aujourd'hui ?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Auto-scroll to bottom when new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setIsLoading(true);
    setError('');

    try {
      // Appel à l'API backend LangChain
      const response = await api.post('/chatbot/chat/', {
        message: inputMessage
      });

      const botResponse = {
        id: Date.now() + 1,
        text: response.data.response,
        sender: 'bot',
        timestamp: new Date(),
        responseTime: response.data.response_time,
        powered_by: response.data.powered_by
      };

      setMessages(prev => [...prev, botResponse]);

      // Increment unread count if chat is closed
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }

    } catch (error) {
      console.error('Chatbot API error:', error);
      
      let errorMessage = "Désolé, je rencontre des difficultés techniques.";
      
      if (error.response?.status === 429) {
        errorMessage = "Trop de messages envoyés. Veuillez patienter une minute.";
      } else if (error.response?.status === 401) {
        errorMessage = "Session expirée. Veuillez vous reconnecter.";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      setError(errorMessage);
      
      // Message d'erreur dans le chat
      const errorBotResponse = {
        id: Date.now() + 1,
        text: errorMessage,
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorBotResponse]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = async () => {
    try {
      // Appeler l'API pour effacer la mémoire
      await api.delete('/chatbot/chat/memory/');
      
      setMessages([
        {
          id: 1,
          text: "Bonjour ! Je suis votre assistant intelligent spécialisé dans la gestion des espaces verts. Comment puis-je vous aider aujourd'hui ?",
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
      setError('');
    } catch (error) {
      console.error('Error clearing chat:', error);
      setError('Erreur lors de l\'effacement de la conversation');
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getUserRole = () => {
    // Détecter le type d'utilisateur selon le modèle
    if (user?.name && !user?.username) {
      // Admin (a 'name' mais pas 'username')
      return `Admin - ${user.name}`;
    } else if (user?.username) {
      // Employé (a 'username')
      const specialtyMap = {
        'jardinier': 'Jardinier',
        'paysagiste': 'Paysagiste',
        'horticulteur': 'Horticulteur',
        'electronicien': 'Électronicien',
        'technicien_iot': 'Technicien IoT',
        'installateur_capteurs': 'Installateur capteurs',
        'maintenance': 'Agent maintenance',
        'irrigation': 'Spécialiste irrigation',
        'gestion_energie': 'Gestionnaire énergie',
        'autre': 'Autre spécialité'
      };
      const specialty = specialtyMap[user.specialty] || user.specialty || 'Employé';
      return `${user.username} - ${specialty}`;
    }
    return 'Utilisateur';
  };

  return (
    <>
      {/* Chat Window */}
      <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            width: '400px',
            height: '600px',
            borderRadius: '16px',
            overflow: 'hidden',
            zIndex: 1300,
            backgroundColor: theme.palette.mode === 'dark' ? colors.primary[400] : colors.grey[50],
            border: `1px solid ${colors.greenAccent[500]}`,
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Chat Header */}
          <Box
            sx={{
              backgroundColor: colors.greenAccent[500],
              color: 'white',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar sx={{ backgroundColor: 'white', color: colors.greenAccent[500] }}>
                <BotIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Assistant Espaces Verts
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Spécialisé IoT & Végétation
                </Typography>
              </Box>
            </Box>
            <Box>
              <Tooltip title="Nouvelle conversation">
                <IconButton 
                  size="small" 
                  onClick={clearChat}
                  sx={{ color: 'white', mr: 1 }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Fermer">
                <IconButton 
                  size="small" 
                  onClick={toggleChat}
                  sx={{ color: 'white' }}
                >
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* User Info */}
          <Box sx={{ p: 1, backgroundColor: colors.greenAccent[100] }}>
            <Chip 
              label={getUserRole()}
              size="small"
              sx={{ 
                backgroundColor: colors.greenAccent[500],
                color: 'white',
                fontSize: '0.75rem'
              }}
            />
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ m: 1 }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          {/* Messages Area */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              backgroundColor: theme.palette.mode === 'dark' ? colors.primary[400] : colors.grey[50],
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: theme.palette.mode === 'dark' ? colors.primary[500] : colors.grey[200],
              },
              '&::-webkit-scrollbar-thumb': {
                background: colors.greenAccent[500],
                borderRadius: '3px',
              },
            }}
          >
            {messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                  flexDirection: message.sender === 'user' ? 'row-reverse' : 'row'
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: message.sender === 'user' 
                      ? colors.blueAccent[500] 
                      : (message.isError ? colors.redAccent[500] : colors.greenAccent[500])
                  }}
                >
                  {message.sender === 'user' ? <PersonIcon /> : <BotIcon />}
                </Avatar>
                <Box
                  sx={{
                    maxWidth: '80%',
                    backgroundColor: message.sender === 'user' 
                      ? colors.blueAccent[500] 
                      : (message.isError 
                          ? colors.redAccent[500]
                          : (theme.palette.mode === 'dark' ? colors.grey[700] : colors.grey[300])
                        ),
                    color: message.sender === 'user' || message.isError
                      ? 'white' 
                      : (theme.palette.mode === 'dark' ? 'white' : colors.grey[900]),
                    p: 1.5,
                    borderRadius: message.sender === 'user' 
                      ? '16px 16px 4px 16px' 
                      : '16px 16px 16px 4px',
                    wordWrap: 'break-word'
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.text}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        opacity: 0.7, 
                        fontSize: '0.7rem'
                      }}
                    >
                      {formatTime(message.timestamp)}
                    </Typography>
                    {message.responseTime && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          opacity: 0.5, 
                          fontSize: '0.6rem'
                        }}
                      >
                        {message.responseTime}s
                      </Typography>
                    )}
                    {message.powered_by && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          opacity: 0.5, 
                          fontSize: '0.6rem'
                        }}
                      >
                        {message.powered_by}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    backgroundColor: colors.greenAccent[500]
                  }}
                >
                  <BotIcon />
                </Avatar>
                <Box
                  sx={{
                    backgroundColor: theme.palette.mode === 'dark' ? colors.grey[700] : colors.grey[300],
                    color: theme.palette.mode === 'dark' ? 'white' : colors.grey[900],
                    p: 1.5,
                    borderRadius: '16px 16px 16px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <CircularProgress 
                    size={16} 
                    sx={{ 
                      color: theme.palette.mode === 'dark' ? 'white' : colors.grey[700] 
                    }} 
                  />
                  <Typography variant="body2">
                    Assistant analyse votre demande...
                  </Typography>
                </Box>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>

          <Divider sx={{ 
            borderColor: theme.palette.mode === 'dark' ? colors.grey[600] : colors.grey[300] 
          }} />

          {/* Input Area */}
          <Box
            sx={{
              p: 2,
              display: 'flex',
              gap: 1,
              alignItems: 'flex-end',
              backgroundColor: theme.palette.mode === 'dark' ? colors.primary[400] : colors.grey[50]
            }}
          >
            <TextField
              fullWidth
              multiline
              maxRows={3}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Posez votre question sur les espaces verts..."
              variant="outlined"
              size="small"
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: theme.palette.mode === 'dark' ? colors.primary[500] : colors.grey[100],
                  '& fieldset': {
                    borderColor: theme.palette.mode === 'dark' ? colors.grey[600] : colors.grey[400]
                  },
                  '&:hover fieldset': {
                    borderColor: colors.greenAccent[500]
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: colors.greenAccent[500]
                  }
                },
                '& .MuiInputBase-input': {
                  color: theme.palette.mode === 'dark' ? colors.grey[100] : colors.grey[900]
                },
                '& .MuiInputBase-input::placeholder': {
                  color: theme.palette.mode === 'dark' ? colors.grey[300] : colors.grey[600],
                  opacity: 1
                }
              }}
            />
            <IconButton
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              sx={{
                backgroundColor: colors.greenAccent[500],
                color: 'white',
                '&:hover': {
                  backgroundColor: colors.greenAccent[600]
                },
                '&:disabled': {
                  backgroundColor: colors.grey[600]
                }
              }}
            >
              {isLoading ? (
                <CircularProgress size={20} sx={{ color: 'white' }} />
              ) : (
                <SendIcon />
              )}
            </IconButton>
          </Box>
        </Paper>
      </Slide>

      {/* Floating Chat Button */}
      <Tooltip title={isOpen ? "Fermer le chat" : "Assistant Espaces Verts"} placement="left">
        <Box
          sx={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1400
          }}
        >
          <Badge badgeContent={unreadCount} color="error">
            <IconButton
              onClick={toggleChat}
              sx={{
                width: 60,
                height: 60,
                backgroundColor: isOpen ? colors.redAccent[500] : colors.greenAccent[500],
                color: 'white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                '&:hover': {
                  backgroundColor: isOpen ? colors.redAccent[600] : colors.greenAccent[600],
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              {isOpen ? <CloseIcon sx={{ fontSize: 28 }} /> : <BotIcon sx={{ fontSize: 28 }} />}
            </IconButton>
          </Badge>
        </Box>
      </Tooltip>
    </>
  );
};

export default Chatbot;