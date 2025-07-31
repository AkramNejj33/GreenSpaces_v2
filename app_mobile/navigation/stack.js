import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/home-screen';
import EventDetailScreen from '../screens/event-detail-screen'; 
import { NavOptions } from './options';
import { useNavigation } from 'expo-router';
import ProfileDetailScreen from '../screens/profiles/profile-detail-screen';
import ProfileScreen from '../screens/profiles/profiles-screen';
import { HomeTabs } from './tabs';
const Stack = createStackNavigator();

export const HomeStack = () => {
   const navigation = useNavigation();
  return (
    <Stack.Navigator
      screenOptions={() => NavOptions(navigation)}
    >
      <Stack.Screen name="Home" component={HomeTabs} />
      <Stack.Screen name="Event" component={EventDetailScreen} />
    </Stack.Navigator>
  );
}

export const ProfileStack = () => {
   const navigation = useNavigation();
  return (
    <Stack.Navigator
      screenOptions={() => NavOptions(navigation)}
    >
      <Stack.Screen name="Profiles" component={ProfileScreen} />
      <Stack.Screen name="Profile" component={ProfileDetailScreen} />
    </Stack.Navigator>
  );
}