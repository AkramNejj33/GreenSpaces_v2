import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Text, Appbar, Menu, Divider, Chip } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';

const TaskListScreen = ({ navigation, route }) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [userId, setUserId] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    const fetchUserId = async () => {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        setUserId(JSON.parse(userData).id);
      }
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchTasks();
    }
  }, [userId, filterStatus]);

  // Refresh when coming back from TaskDetail
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (userId) {
        fetchTasks();
      }
    });
    return unsubscribe;
  }, [navigation, userId]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`http://192.168.1.10:8000/api/tasks/?assigned_to=${userId}`);
      let data = response.data;
      
      if (filterStatus) {
        data = data.filter(task => task.status === filterStatus);
      }
      
      setTasks(data);
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger les tâches',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
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

  const isOverdue = (scheduledAt, status) => {
    if (status === 'terminée') return false;
    const now = new Date();
    const deadline = new Date(scheduledAt);
    return deadline < now;
  };

  const renderTask = ({ item }) => {
    const statusConfig = getStatusConfig(item.status);
    const overdue = isOverdue(item.scheduled_at, item.status);

    return (
      <TouchableOpacity
        style={[styles.taskCard, overdue && styles.overdueCard]}
        onPress={() => navigation.navigate('TaskDetail', { task: item })}
        activeOpacity={0.7}
      >
        <View style={styles.taskHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.taskTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Icon 
              name="chevron-right" 
              size={24} 
              color="#9ca3af" 
            />
          </View>
        </View>

        <View style={styles.taskMeta}>
          <View style={styles.metaRow}>
            <Icon name="schedule" size={16} color="#6b7280" />
            <Text style={styles.metaText}>
              Créé le {formatDate(item.created_at || new Date())}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Icon 
              name={overdue ? "warning" : "event"} 
              size={16} 
              color={overdue ? "#ef4444" : "#6b7280"} 
            />
            <Text style={[styles.metaText, overdue && styles.overdueText]}>
              Échéance: {formatDateTime(item.scheduled_at)}
            </Text>
          </View>
        </View>

        <View style={styles.statusRow}>
          <View style={styles.statusChip}>
            <Icon 
              name={statusConfig.icon} 
              size={14} 
              color={statusConfig.color} 
              style={styles.statusIcon}
            />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
          
          {overdue && (
            <View style={styles.overdueChip}>
              <Icon name="warning" size={12} color="#ef4444" />
              <Text style={styles.overdueChipText}>En retard</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const statusOptions = [
    { label: 'Toutes les tâches', value: '' },
    { label: 'À faire', value: 'à_faire' },
    { label: 'En cours', value: 'en_cours' },
    { label: 'Terminées', value: 'terminée' },
  ];

  const getFilterLabel = () => {
    const option = statusOptions.find(opt => opt.value === filterStatus);
    return option ? option.label : 'Toutes les tâches';
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content 
          title="Mes Tâches" 
          subtitle={`${tasks.length} tâche${tasks.length > 1 ? 's' : ''}`}
        />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action 
              icon="filter-list" 
              onPress={() => setMenuVisible(true)} 
            />
          }
          contentStyle={styles.menuContent}
        >
          <Text style={styles.menuTitle}>Filtrer par statut</Text>
          <Divider style={styles.menuDivider} />
          {statusOptions.map((option) => (
            <Menu.Item
              key={option.value}
              onPress={() => {
                setFilterStatus(option.value);
                setMenuVisible(false);
              }}
              title={option.label}
              titleStyle={[
                styles.menuItemTitle,
                filterStatus === option.value && styles.selectedMenuItem
              ]}
              leadingIcon={filterStatus === option.value ? "check" : undefined}
            />
          ))}
        </Menu>
      </Appbar.Header>

      {filterStatus !== '' && (
        <View style={styles.filterIndicator}>
          <Chip 
            icon="filter-list"
            onClose={() => setFilterStatus('')}
            style={styles.filterChip}
            textStyle={styles.filterChipText}
          >
            {getFilterLabel()}
          </Chip>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Chargement des tâches...</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTask}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="assignment" size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>Aucune tâche trouvée</Text>
              <Text style={styles.emptySubtitle}>
                {filterStatus ? 'Aucune tâche ne correspond à ce filtre' : 'Vous n\'avez pas encore de tâches assignées'}
              </Text>
            </View>
          }
        />
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
  filterIndicator: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
  },
  filterChipText: {
    color: '#1d4ed8',
    fontSize: 12,
  },
  listContent: {
    paddingVertical: 8,
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#e5e7eb',
  },
  overdueCard: {
    borderLeftColor: '#ef4444',
    backgroundColor: '#fefefe',
  },
  taskHeader: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    lineHeight: 22,
  },
  taskMeta: {
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 6,
    flex: 1,
  },
  overdueText: {
    color: '#ef4444',
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  overdueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  overdueChipText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '500',
    marginLeft: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  menuContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 8,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  menuDivider: {
    marginVertical: 4,
  },
  menuItemTitle: {
    fontSize: 14,
  },
  selectedMenuItem: {
    color: '#1d4ed8',
    fontWeight: '500',
  },
});

export default TaskListScreen;