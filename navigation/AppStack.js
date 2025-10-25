import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../gymApp/screens/HomeScreen';
import PerfilScreen from '../gymApp/screens/PerfilScreen';
import BiometricSetupManager from '../gymApp/components/BiometricSetupManager';

const Tab = createBottomTabNavigator();

export default function AppStack() {
  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Perfil') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#74C1E6',
          tabBarInactiveTintColor: 'gray',
          headerStyle: {
            backgroundColor: '#74C1E6',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Gym App' }}
        />
        <Tab.Screen 
          name="Perfil" 
          component={PerfilScreen}
          options={{ title: 'Mi Perfil' }}
        />
      </Tab.Navigator>
      
      {/* Modal global que se muestra DESPUÉS de autenticación */}
      <BiometricSetupManager />
    </>
  );
}