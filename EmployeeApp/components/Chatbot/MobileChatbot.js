import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../services/AuthContext'; 
import ApiClient from '../../services/apiClient'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const MobileChatbot = () => {
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
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null); // ✅ État pour l'utilisateur actuel
  
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const { user, isAuthenticated, authenticatedRequest } = useAuth();

  // ✅ Charger les données utilisateur depuis AsyncStorage
  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur chatbot:', error);
      // Fallback sur les données du contexte Auth si disponibles
      if (user) {
        setCurrentUser(user);
      }
    }
  };

  // Animation du bouton flottant
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Auto-scroll vers le bas quand nouveaux messages
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Reset compteur non lues quand chat ouvert
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const sendMessage = async () => {
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
      const response = await ApiClient.post('/api/chatbot/chat/', {
        message: inputMessage
      });

      const data = await response.json();

      if (response.ok) {
        const botResponse = {
          id: Date.now() + 1,
          text: data.response,
          sender: 'bot',
          timestamp: new Date(),
          responseTime: data.response_time,
          powered_by: data.powered_by
        };

        setMessages(prev => [...prev, botResponse]);

        if (!isOpen) {
          setUnreadCount(prev => prev + 1);
        }
      } else {
        throw new Error(data.error || 'Erreur de communication avec le chatbot');
      }

    } catch (error) {
      console.error('Erreur API Chatbot:', error);
      
      let errorMessage = "Désolé, je rencontre des difficultés techniques.";
      
      if (error.message.includes('429')) {
        errorMessage = "Trop de messages envoyés. Veuillez patienter une minute.";
      } else if (error.message.includes('401')) {
        errorMessage = "Session expirée. Veuillez vous reconnecter.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      
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

  const clearChat = async () => {
    try {
      await ApiClient.delete('/api/chatbot/chat/memory/');
      
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
      console.error('Erreur effacement chat:', error);
      setMessages([
        {
          id: 1,
          text: "Bonjour ! Je suis votre assistant intelligent spécialisé dans la gestion des espaces verts. Comment puis-je vous aider aujourd'hui ?",
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // ✅ Fonction corrigée pour utiliser les données utilisateur dynamiques
  const getUserRole = () => {
    // Priorité : currentUser (depuis AsyncStorage) puis user (depuis contexte Auth)
    const userData = currentUser || user;
    
    if (!userData) return 'Utilisateur';
    
    if (userData.name && !userData.username) {
      // Cas administrateur
      return `Admin - ${userData.name}`;
    } else if (userData.username) {
      // Cas employé avec spécialité
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
      
      // Essai de récupérer la spécialité depuis différents champs possibles
      const specialty = specialtyMap[userData.specialty] || 
                       userData.specialty_display || 
                       userData.specialty || 
                       'Employé';
      
      return `${userData.username} - ${specialty}`;
    }
    
    return 'Utilisateur';
  };

  // ✅ Fonction pour obtenir le nom d'affichage de l'utilisateur
  const getUserDisplayName = () => {
    const userData = currentUser || user;
    if (!userData) return 'Utilisateur';
    
    return userData.username || userData.name || 'Utilisateur';
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Modal Chat */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsOpen(false)}
      >
        <SafeAreaView style={styles.chatContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#10b981" />
          
          <KeyboardAvoidingView
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
          >
            {/* Header */}
            <View style={styles.chatHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.botAvatar}>
                  <Ionicons name="chatbubbles" size={24} color="#ffffff" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Assistant Espaces Verts</Text>
                  <Text style={styles.headerSubtitle}>Spécialisé IoT & Végétation</Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity 
                  style={styles.headerButton}
                  onPress={clearChat}
                >
                  <Ionicons name="refresh" size={20} color="#ffffff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.headerButton}
                  onPress={() => setIsOpen(false)}
                >
                  <Ionicons name="close" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* ✅ User Info dynamique */}
            <View style={styles.userInfo}>
              <View style={styles.userChip}>
                <Text style={styles.userChipText}>{getUserRole()}</Text>
              </View>
              {/* ✅ Affichage optionnel du statut de connexion */}
              <View style={styles.statusIndicator}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Connecté</Text>
              </View>
            </View>

            {/* Error Alert */}
            {error && (
              <View style={styles.errorAlert}>
                <Ionicons name="warning" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={() => setError('')}>
                  <Ionicons name="close" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}

            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageRow,
                    message.sender === 'user' ? styles.userMessageRow : styles.botMessageRow
                  ]}
                >
                  <View style={[
                    styles.avatar,
                    message.sender === 'user' 
                      ? styles.userAvatar 
                      : (message.isError ? styles.errorAvatar : styles.botAvatar)
                  ]}>
                    <Ionicons 
                      name={message.sender === 'user' ? "person" : "chatbubbles"} 
                      size={16} 
                      color="#ffffff" 
                    />
                  </View>
                  
                  <View style={[
                    styles.messageBubble,
                    message.sender === 'user' 
                      ? styles.userBubble 
                      : (message.isError ? styles.errorBubble : styles.botBubble)
                  ]}>
                    <Text style={[
                      styles.messageText,
                      message.sender === 'user' || message.isError 
                        ? styles.whiteText 
                        : styles.darkText
                    ]}>
                      {message.text}
                    </Text>
                    
                    <View style={styles.messageFooter}>
                      <Text style={[
                        styles.timeText,
                        message.sender === 'user' || message.isError 
                          ? styles.whiteTimeText 
                          : styles.darkTimeText
                      ]}>
                        {formatTime(message.timestamp)}
                      </Text>
                      {message.responseTime && (
                        <Text style={[
                          styles.metaText,
                          message.sender === 'user' || message.isError 
                            ? styles.whiteTimeText 
                            : styles.darkTimeText
                        ]}>
                          {message.responseTime}s
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <View style={[styles.messageRow, styles.botMessageRow]}>
                  <View style={styles.botAvatar}>
                    <Ionicons name="chatbubbles" size={16} color="#ffffff" />
                  </View>
                  <View style={[styles.messageBubble, styles.botBubble]}>
                    <View style={styles.typingContainer}>
                      <ActivityIndicator size="small" color="#10b981" />
                      <Text style={[styles.messageText, styles.darkText]}>
                        Assistant analyse votre demande...
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input Area */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  value={inputMessage}
                  onChangeText={setInputMessage}
                  placeholder="Posez votre question sur les espaces verts..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  maxLength={500}
                  editable={!isLoading}
                  returnKeyType="send"
                  blurOnSubmit={false}
                  onSubmitEditing={sendMessage}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!inputMessage.trim() || isLoading) && styles.sendButtonDisabled
                  ]}
                  onPress={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Ionicons name="send" size={20} color="#ffffff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* ✅ Floating Chat Button - L'ICÔNE DU CHATBOT */}
      <Animated.View style={[
        styles.fab,
        { transform: [{ scale: scaleAnim }] }
      ]}>
        <TouchableOpacity
          style={[
            styles.fabButton,
            isOpen && styles.fabButtonOpen
          ]}
          onPress={toggleChat}
        >
          {unreadCount > 0 && !isOpen && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
          <Ionicons 
            name={isOpen ? "close" : "chatbubbles"} 
            size={28} 
            color="#ffffff" 
          />
        </TouchableOpacity>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  // Chat Container
  chatContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  
  // KeyboardAvoidingView
  keyboardAvoidingView: {
    flex: 1,
  },
  
  // Header
  chatHeader: {
    backgroundColor: '#10b981',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#d1fae5',
    opacity: 0.9,
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },

  // ✅ User Info amélioré
  userInfo: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ecfdf5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userChip: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexShrink: 1,
  },
  userChipText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  // ✅ Nouveau : Indicateur de statut
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '500',
  },

  // Error Alert
  errorAlert: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    flex: 1,
    marginLeft: 8,
  },

  // Messages
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  userMessageRow: {
    flexDirection: 'row-reverse',
  },
  botMessageRow: {
    flexDirection: 'row',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  userAvatar: {
    backgroundColor: '#3b82f6',
  },
  errorAvatar: {
    backgroundColor: '#ef4444',
  },
  messageBubble: {
    maxWidth: width * 0.75,
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#3b82f6',
    borderTopRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  errorBubble: {
    backgroundColor: '#ef4444',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  whiteText: {
    color: '#ffffff',
  },
  darkText: {
    color: '#1f2937',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
    opacity: 0.7,
  },
  whiteTimeText: {
    color: '#ffffff',
  },
  darkTimeText: {
    color: '#6b7280',
  },
  metaText: {
    fontSize: 10,
    opacity: 0.5,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Input
  inputContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    minHeight: 70,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxHeight: 120,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 8,
    minHeight: 40,
  },
  sendButton: {
    backgroundColor: '#10b981',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
  },

  // ✅ FAB - Le bouton flottant du chatbot (VISIBLE)
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 30,
    right: 20,
    zIndex: 9999, // Z-index très élevé pour être sûr qu'il soit visible
  },
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10, // Elevation plus élevée sur Android
  },
  fabButtonOpen: {
    backgroundColor: '#ef4444',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default MobileChatbot;