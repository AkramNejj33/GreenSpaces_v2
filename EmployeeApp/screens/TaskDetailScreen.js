import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import {
  Text,
  Appbar,
  Card,
  Chip,
  Button,
  Menu,
  ActivityIndicator,
} from 'react-native-paper';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';

const TaskDetailScreen = ({ navigation, route }) => {
  const { task } = route.params;
  const [currentTask, setCurrentTask] = useState(task);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'à_faire':
        return {
          label: 'À faire',
          color: '#ff9800',
          backgroundColor: '#fff3e0',
          icon: 'pending'
        };
      case 'en_cours':
        return {
          label: 'En cours',
          color: '#2196f3',
          backgroundColor: '#e3f2fd',
          icon: 'play-circle-filled'
        };
      case 'terminée':
        return {
          label: 'Terminée',
          color: '#4caf50',
          backgroundColor: '#e8f5e8',
          icon: 'check-circle'
        };
      default:
        return {
          label: 'Inconnu',
          color: '#757575',
          backgroundColor: '#f5f5f5',
          icon: 'help'
        };
    }
  };

  const getTypeConfig = (type) => {
    switch (type) {
      case 'arrosage':
        return { label: 'Arrosage', icon: 'water-drop', color: '#3b82f6' };
      case 'désherbage':
        return { label: 'Désherbage', icon: 'grass', color: '#10b981' };
      case 'taillage':
        return { label: 'Taillage', icon: 'content-cut', color: '#f59e0b' };
      default:
        return { label: 'Autre', icon: 'work', color: '#6b7280' };
    }
  };

  const statusOptions = [
    { label: 'À faire', value: 'à_faire' },
    { label: 'En cours', value: 'en_cours' },
    { label: 'Terminée', value: 'terminée' },
  ];

  const updateTaskStatus = async (newStatus) => {
    try {
      setIsUpdating(true);
      const updateData = {
        status: newStatus,
        ...(newStatus === 'terminée' && { done_at: new Date().toISOString() })
      };

      const response = await axios.patch(
        `http://192.168.1.10:8000/api/tasks/${currentTask.id}/`,
        updateData
      );

      setCurrentTask({ ...currentTask, ...response.data });
      
      Toast.show({
        type: 'success',
        text1: 'Statut mis à jour',
        text2: `La tâche est maintenant "${getStatusConfig(newStatus).label}"`,
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de mettre à jour le statut',
      });
    } finally {
      setIsUpdating(false);
      setStatusMenuVisible(false);
    }
  };

  const openLocation = () => {
    if (currentTask.green_space?.latitude && currentTask.green_space?.longitude) {
      const { latitude, longitude } = currentTask.green_space;
      const url = `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(currentTask.green_space.name || 'Localisation de la tâche')})`;
      
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(url);
          } else {
            // Fallback vers Google Maps web
            const webUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
            return Linking.openURL(webUrl);
          }
        })
        .catch((err) => {
          console.error('Erreur lors de l\'ouverture de la carte:', err);
          Toast.show({
            type: 'error',
            text1: 'Erreur',
            text2: 'Impossible d\'ouvrir la localisation',
          });
        });
    } else {
      Alert.alert(
        'Localisation non disponible',
        'Les coordonnées de cette tâche ne sont pas disponibles.'
      );
    }
  };

  const isOverdue = (scheduledAt, status) => {
    if (status === 'terminée') return false;
    const now = new Date();
    const deadline = new Date(scheduledAt);
    return deadline < now;
  };

  const statusConfig = getStatusConfig(currentTask.status);
  const typeConfig = getTypeConfig(currentTask.type);
  const overdue = isOverdue(currentTask.scheduled_at, currentTask.status);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Détails de la tâche" />
      </Appbar.Header>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.titleSection}>
              <Text style={styles.taskTitle}>{currentTask.title}</Text>
              {overdue && (
                <View style={styles.overdueIndicator}>
                  <Icon name="warning" size={16} color="#ef4444" />
                  <Text style={styles.overdueText}>En retard</Text>
                </View>
              )}
            </View>

            <View style={styles.chipRow}>
              <Chip
                icon={typeConfig.icon}
                style={[styles.typeChip, { backgroundColor: `${typeConfig.color}15` }]}
                textStyle={[styles.chipText, { color: typeConfig.color }]}
              >
                {typeConfig.label}
              </Chip>

              <Menu
                visible={statusMenuVisible}
                onDismiss={() => setStatusMenuVisible(false)}
                anchor={
                  <TouchableOpacity
                    style={[styles.statusChip, { backgroundColor: statusConfig.backgroundColor }]}
                    onPress={() => setStatusMenuVisible(true)}
                    disabled={isUpdating}
                  >
                    <Icon 
                      name={statusConfig.icon} 
                      size={16} 
                      color={statusConfig.color} 
                    />
                    <Text style={[styles.chipText, { color: statusConfig.color, marginLeft: 4 }]}>
                      {statusConfig.label}
                    </Text>
                    <Icon 
                      name="arrow-drop-down" 
                      size={16} 
                      color={statusConfig.color} 
                    />
                  </TouchableOpacity>
                }
              >
                {statusOptions
                  .filter(option => option.value !== currentTask.status)
                  .map((option) => (
                    <Menu.Item
                      key={option.value}
                      onPress={() => updateTaskStatus(option.value)}
                      title={option.label}
                      leadingIcon={getStatusConfig(option.value).icon}
                    />
                  ))}
              </Menu>
            </View>
          </Card.Content>
        </Card>

        {/* Description */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Icon name="description" size={20} color="#374151" />
              <Text style={styles.sectionTitle}>Description</Text>
            </View>
            <Text style={styles.description}>{currentTask.description}</Text>
          </Card.Content>
        </Card>

        {/* Informations temporelles */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Icon name="schedule" size={20} color="#374151" />
              <Text style={styles.sectionTitle}>Planification</Text>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Date limite</Text>
                <Text style={[styles.infoValue, overdue && styles.overdueValue]}>
                  {formatDateTime(currentTask.scheduled_at)}
                </Text>
              </View>
            </View>

            {currentTask.done_at && (
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Terminé le</Text>
                  <Text style={styles.infoValue}>
                    {formatDateTime(currentTask.done_at)}
                  </Text>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Assignation */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Icon name="person" size={20} color="#374151" />
              <Text style={styles.sectionTitle}>Assignation</Text>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Assigné à</Text>
                <Text style={styles.infoValue}>
                  {currentTask.assigned_to ? 
                    `${currentTask.assigned_to.username} ` : 
                    'Non assigné'
                  }
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Créé par</Text>
                <Text style={styles.infoValue}>
                  {currentTask.created_by ? 
                   `Administrateur ${currentTask.created_by.name} ` : 
                    'Non assigné'
                  }
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Localisation */}
        {currentTask.green_space && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Icon name="location-on" size={20} color="#374151" />
                <Text style={styles.sectionTitle}>Localisation</Text>
              </View>
              
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>
                  {currentTask.green_space.name || 'Espace vert'}
                </Text>
                {currentTask.green_space.latitude && currentTask.green_space.longitude && (
                  <Text style={styles.coordinates}>
                    {currentTask.green_space.latitude.toFixed(6)}, {currentTask.green_space.longitude.toFixed(6)}
                  </Text>
                )}
              </View>

              <Button
                mode="outlined"
                onPress={openLocation}
                icon="map"
                style={styles.locationButton}
                contentStyle={styles.locationButtonContent}
                disabled={!currentTask.green_space?.latitude || !currentTask.green_space?.longitude}
              >
                Ouvrir dans Google Maps
              </Button>
            </Card.Content>
          </Card>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {isUpdating && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.loadingText}>Mise à jour en cours...</Text>
          </View>
        </View>
      )}

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  headerCard: {
    margin: 16,
    elevation: 4,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
  },
  titleSection: {
    marginBottom: 16,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    lineHeight: 32,
    marginBottom: 8,
  },
  overdueIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  overdueText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
    marginLeft: 4,
  },
  chipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeChip: {
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  overdueValue: {
    color: '#ef4444',
  },
  locationInfo: {
    marginBottom: 16,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  coordinates: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  locationButton: {
    borderColor: '#10b981',
  },
  locationButtonContent: {
    paddingVertical: 6,
  },
  bottomSpacing: {
    height: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#374151',
  },
});

export default TaskDetailScreen;