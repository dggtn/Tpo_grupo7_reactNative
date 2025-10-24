import * as React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen'; 
import PerfilScreen from '../screens/PerfilScreen';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

    const Tab = createBottomTabNavigator();

    function Footer() {
      return (
        <Tab.Navigator>
          <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ color }) => <MaterialDesignIcons name="home" color={color} size={30} /> }} />
          <Tab.Screen name="Perfil" component={PerfilScreen} options={{ tabBarIcon: ({ color }) => <MaterialDesignIcons name="account" color={color}  size={30} /> }} />
        </Tab.Navigator>
      );
    }

    export default Footer;