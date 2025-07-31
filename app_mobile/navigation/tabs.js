import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from '../screens/home-screen';
import QrCodeScreen from '../screens/qr-code-screen';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Tab = createBottomTabNavigator();

export const HomeTabs = () => {
  return (
    <Tab.Navigator 
    screenOptions={({ route }) => ({
        headerShown: false,
         tabBarShowLabel: false,
         tabBarStyle: {
          backgroundColor: 'black',
        },
        tabBarActiveTintColor: 'green',
        //tabBarInactiveTintColor: 'gray',
        tabBarIcon : ({focused , color , size}) => {
            let iconName;
            if (route.name === 'HomeTabs') {
                iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Qr Code') {
                iconName = focused ? 'qr-code' : 'qr-code-outline';
            }
            return <Ionicons name={iconName} size={focused ? 35 : size} color={color} />;
        }
    })}
    >
      <Tab.Screen 
      name="HomeTabs" 
      options={{ 
        title: 'Home' }}
      component={HomeScreen} />
      <Tab.Screen name="Qr Code" component={QrCodeScreen} />
    </Tab.Navigator>
  );
}