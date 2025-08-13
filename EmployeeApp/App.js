import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './services/AuthContext';

// Importez vos écrans existants
import EmployeeLoginScreen from './screens/EmployeeLoginScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import HomeScreen from './screens/HomeScreen';
import TaskListScreen from './screens/TaskListScreen';
import TaskDetailScreen from './screens/TaskDetailScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false, // Masquer les headers par défaut
        }}
      >
        {/* Écran de connexion */}
        <Stack.Screen
          name="Login"
          component={EmployeeLoginScreen}
          options={{
            title: 'Connexion Employé'
          }}
        />
       
        {/* Écran mot de passe oublié */}
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{
            title: 'Mot de passe oublié',
            headerShown: true,
            headerStyle: {
              backgroundColor: '#10b981',
            },
            headerTintColor: '#ffffff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
       
        {/* Écran de réinitialisation */}
        <Stack.Screen
          name="ResetPassword"
          component={ResetPasswordScreen}
          options={{
            title: 'Nouveau mot de passe',
            headerShown: true,
            headerStyle: {
              backgroundColor: '#10b981',
            },
            headerTintColor: '#ffffff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
       
        {/* Écran principal avec chatbot */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Tableau de bord',
            headerShown: false,
            gestureEnabled: false,
          }}
        />
       
        {/* Écran de liste des tâches */}
        <Stack.Screen
          name="TaskList"
          component={TaskListScreen}
          options={{
            title: 'Mes Tâches',
            headerShown: false,
          }}
        />
       
        {/* Écran de détails de la tâche */}
        <Stack.Screen
          name="TaskDetail"
          component={TaskDetailScreen}
          options={{
            title: 'Détails de la tâche',
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </PaperProvider>
  );
}