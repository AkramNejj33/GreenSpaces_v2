import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const EmployeeLoginScreen = ({ navigation, route }) => {
  const { prefilledEmail } = route.params || {};
  
  const [formData, setFormData] = useState({
    email: prefilledEmail || '',
    password: '',
    adminName: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // ✅ IP mise à jour
  const API_BASE_URL = 'http://192.168.1.43:8000';

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Effacer l'erreur du champ quand l'utilisateur tape
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format email invalide';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Mot de passe requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mot de passe trop court (min 6 caractères)';
    }

    if (!formData.adminName.trim()) {
      newErrors.adminName = 'Nom de l\'admin requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


    const handleLogin = async () => {
    if (!validateForm()) {
        return;
    }

    setLoading(true);

    try {
        console.log('Tentative de connexion...', {
        email: formData.email,
        adminName: formData.adminName
        });

        const response = await fetch(`${API_BASE_URL}/api/employee/login/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            admin_name: formData.adminName
        }),
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (response.ok) {
        // ✅ CORRECTION: Sauvegarder les bons tokens
        await AsyncStorage.setItem('accessToken', data.access);
        await AsyncStorage.setItem('refreshToken', data.refresh);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));

        Alert.alert(
            'Connexion réussie',
            `Bienvenue ${data.user.username}!`,
            [
            {
                text: 'OK',
                onPress: () => {
                // ✅ CHANGEMENT ICI: Naviguer vers Home au lieu de votre ancien écran
                navigation.replace('Home');
                }
            }
            ]
        );
        } else {
        Alert.alert('Erreur de connexion', data.error || 'Identifiants invalides');
        }
    } catch (error) {
        console.error('Erreur de connexion:', error);
        Alert.alert(
        'Erreur de connexion',
        'Impossible de se connecter au serveur. Vérifiez:\n• Votre connexion internet\n• L\'URL du serveur\n• Que le serveur Django est démarré'
        );
    } finally {
        setLoading(false);
    }
    };

  const checkAdminExists = async (adminName) => {
    if (!adminName.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/employee/check-admin/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_name: adminName
        }),
      });

      const data = await response.json();
      
      if (!response.ok && response.status === 404) {
        setErrors(prev => ({
          ...prev,
          adminName: 'Admin introuvable'
        }));
      } else if (response.ok) {
        // Admin trouvé, effacer l'erreur
        setErrors(prev => ({
          ...prev,
          adminName: ''
        }));
      }
    } catch (error) {
      console.error('Erreur vérification admin:', error);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.loginCard}>
          {/* Icône de sécurité */}
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={32} color="#ffffff" />
          </View>

          {/* Titre */}
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          {/* Champ Nom de l'Admin */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Admin Name *</Text>
            <View style={[styles.inputWrapper, errors.adminName && styles.inputWrapperError]}>
              <Ionicons name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your admin name"
                placeholderTextColor="#9ca3af"
                value={formData.adminName}
                onChangeText={(value) => handleInputChange('adminName', value)}
                onBlur={() => checkAdminExists(formData.adminName)}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>
            {errors.adminName && (
              <Text style={styles.errorText}>{errors.adminName}</Text>
            )}
          </View>

          {/* Champ Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address *</Text>
            <View style={[styles.inputWrapper, errors.email && styles.inputWrapperError]}>
              <Ionicons name="mail-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#9ca3af"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* Champ Mot de passe */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password *</Text>
            <View style={[styles.inputWrapper, errors.password && styles.inputWrapperError]}>
              <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#9ca3af"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#9ca3af" 
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            <View style={styles.rememberContainer}>
              <TouchableOpacity style={styles.checkbox}>
                <View style={styles.checkboxInner} />
              </TouchableOpacity>
              <Text style={styles.rememberText}>Remember me</Text>
            </View>
            
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* Bouton de connexion */}
          <TouchableOpacity
            style={[styles.signInButton, loading && styles.signInButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={20} color="#ffffff" style={styles.buttonIcon} />
                <Text style={styles.signInButtonText}>SIGN IN</Text>
              </>
            )}
          </TouchableOpacity>


          {/* Note d'information */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              You must be a registered employee by your administrator to be able to log in.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loginCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#10b981',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  inputWrapperError: {
    borderColor: '#ef4444',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 12,
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 3,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: 'transparent',
    borderRadius: 2,
  },
  rememberText: {
    fontSize: 14,
    color: '#6b7280',
  },
  forgotText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  signInButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#10b981',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signInButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonIcon: {
    marginRight: 8,
  },
  signInButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  createAccountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  noAccountText: {
    fontSize: 14,
    color: '#6b7280',
  },
  createAccountText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  infoContainer: {
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  infoText: {
    fontSize: 13,
    color: '#1e40af',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default EmployeeLoginScreen;