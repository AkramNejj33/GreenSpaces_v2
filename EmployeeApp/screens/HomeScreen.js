// screens/HomeScreen.js - Version corrigée avec gestion SafeAreaView
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MobileChatbot from '../components/Chatbot/MobileChatbot';

const HomeScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    pendingAlerts: 0,
    activeSensors: 0,
  });

  useEffect(() => {
    loadUserData();
    loadStats();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const userData = await AsyncStorage.getItem('userData');
      const accessToken = await AsyncStorage.getItem('accessToken');
      
      if (userData && accessToken) {
        setUser(JSON.parse(userData));
      } else {
        setTimeout(() => {
          navigation.replace('Login');
        }, 0);
        return;
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
      setTimeout(() => {
        navigation.replace('Login');
      }, 0);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setStats({
        tasksCompleted: Math.floor(Math.random() * 20),
        pendingAlerts: Math.floor(Math.random() * 5),
        activeSensors: Math.floor(Math.random() * 15) + 10,
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    await loadStats();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userData']);
              setTimeout(() => {
                navigation.replace('Login');
              }, 100);
            } catch (error) {
              console.error('Erreur logout:', error);
              setTimeout(() => {
                navigation.replace('Login');
              }, 100);
            }
          },
        },
      ]
    );
  };

  const getUserRole = () => {
    if (!user) return { role: 'Utilisateur', specialty: '' };
    
    if (user.name && !user.username) {
      return { role: 'Administrateur', specialty: user.name };
    } else if (user.username) {
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
      const specialty = specialtyMap[user.specialty] || user.specialty_display || user.specialty || 'Employé';
      return { role: 'Employé', specialty: specialty };
    }
    return { role: 'Utilisateur', specialty: '' };
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        {/* ✅ StatusBar pour contrôler l'apparence */}
        <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
        <View style={styles.loadingContent}>
          <Ionicons name="leaf" size={48} color="#10b981" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return null;
  }

  const { role, specialty } = getUserRole();

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ StatusBar configuré pour éviter les conflits */}
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ✅ Header avec padding top sécurisé */}
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Text style={styles.greeting}>{getGreeting()} !</Text>
            <Text style={styles.userName}>
              {user?.username || user?.name || 'Utilisateur'}
            </Text>
            <View style={styles.roleChip}>
              <Text style={styles.roleText}>{role}</Text>
              {specialty && specialty !== role && (
                <Text style={styles.specialtyText}>{specialty}</Text>
              )}
            </View>
          </View>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#10b981' }]}>
                <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
              </View>
              <Text style={styles.statNumber}>{stats.tasksCompleted}</Text>
              <Text style={styles.statLabel}>Tâches complétées</Text>
            </View>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#f59e0b' }]}>
                <Ionicons name="warning" size={24} color="#ffffff" />
              </View>
              <Text style={styles.statNumber}>{stats.pendingAlerts}</Text>
              <Text style={styles.statLabel}>Alertes en attente</Text>
            </View>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: '#3b82f6' }]}>
                <Ionicons name="radio" size={24} color="#ffffff" />
              </View>
              <Text style={styles.statNumber}>{stats.activeSensors}</Text>
              <Text style={styles.statLabel}>Capteurs actifs</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="leaf" size={32} color="#10b981" />
              <Text style={styles.actionTitle}>État végétation</Text>
              <Text style={styles.actionSubtitle}>Voir les indices NDVI</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="water" size={32} color="#3b82f6" />
              <Text style={styles.actionTitle}>Irrigation</Text>
              <Text style={styles.actionSubtitle}>Contrôler l'arrosage</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="hardware-chip" size={32} color="#8b5cf6" />
              <Text style={styles.actionTitle}>Capteurs IoT</Text>
              <Text style={styles.actionSubtitle}>Données en temps réel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="document-text" size={32} color="#f59e0b" />
              <Text style={styles.actionTitle}>Rapports</Text>
              <Text style={styles.actionSubtitle}>Consulter les analyses</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Assistant Chatbot Info */}
        <View style={styles.chatbotInfoContainer}>
          <View style={styles.chatbotInfo}>
            <View style={styles.chatbotIconContainer}>
              <Ionicons name="chatbubbles" size={24} color="#10b981" />
            </View>
            <View style={styles.chatbotTextContainer}>
              <Text style={styles.chatbotTitle}>🤖 Assistant IA disponible</Text>
              <Text style={styles.chatbotSubtitle}>
                Posez vos questions sur la gestion des espaces verts en appuyant sur le bouton flottant
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#10b981" />
          </View>
        </View>

        {/* Bottom Spacing pour le FAB du chatbot */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Composant Chatbot */}
      <MobileChatbot />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Espace pour le FAB du chatbot
  },

  // ✅ Header corrigé - plus de paddingTop automatique
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20, // Padding réduit car SafeAreaView gère déjà
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  roleChip: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  specialtyText: {
    color: '#059669',
    fontSize: 11,
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },

  // Quick Actions
  quickActionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 8,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },

  // Chatbot Info
  chatbotInfoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  chatbotInfo: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatbotIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatbotTextContainer: {
    flex: 1,
  },
  chatbotTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 2,
  },
  chatbotSubtitle: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 16,
  },

  // Bottom spacing
  bottomSpacing: {
    height: 20,
  },
});

export default HomeScreen;