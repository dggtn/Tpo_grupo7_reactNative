import React, { useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import HomeScreen from '../gymApp/screens/HomeScreen';
import PerfilScreen from '../gymApp/screens/PerfilScreen';
import BiometricSetupManager from '../gymApp/components/BiometricSetupManager';
import BiometricGate from '../gymApp/components/BiometricGate';
import { selectBiometricEnabled } from '../store/slices/biometricSlice';
import { selectJustLoggedIn } from '../store/slices/authSlice';

const Tab = createBottomTabNavigator();

export default function AppStack() {
  const biometricEnabled = useSelector(selectBiometricEnabled);
  const justLoggedIn = useSelector(selectJustLoggedIn);
  
  // ✅ Estado para controlar la pantalla de bloqueo biométrico
  const [showBiometricGate, setShowBiometricGate] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const appState = useRef(AppState.currentState);

  // ✅ Detectar cuando la app vuelve de background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [biometricEnabled, justLoggedIn]);

  const handleAppStateChange = (nextAppState) => {
    console.log('[AppStack] 🔄 AppState cambió:', appState.current, '->', nextAppState);

    // Si la app vuelve a foreground (activa)
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      console.log('[AppStack] 📱 App volvió a primer plano');

      // ✅ CRÍTICO: Mostrar gate SOLO si:
      // 1. Biometría está habilitada
      // 2. NO acaba de loguearse (para no interferir con el modal de setup)
      if (biometricEnabled && !justLoggedIn) {
        console.log('[AppStack] 🔒 Mostrando pantalla de bloqueo biométrico');
        setIsAuthenticated(false);
        setShowBiometricGate(true);
      }
    }

    appState.current = nextAppState;
  };

  const handleBiometricAuthenticated = () => {
    console.log('[AppStack] ✅ Usuario autenticado, ocultando gate');
    setIsAuthenticated(true);
    setShowBiometricGate(false);
  };

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
          // ✅ Deshabilitar interacción si no está autenticado
          tabBarStyle: showBiometricGate ? { display: 'none' } : undefined,
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
      
      {/* ✅ Modal de configuración biométrica (se muestra después de login) */}
      <BiometricSetupManager />

      {/* ✅ Pantalla de bloqueo biométrico (se muestra al volver de background) */}
      {showBiometricGate && (
        <BiometricGate onAuthenticated={handleBiometricAuthenticated} />
      )}
    </>
  );
}