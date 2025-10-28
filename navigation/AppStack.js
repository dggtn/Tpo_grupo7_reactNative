import React, { useState, useEffect, useRef } from 'react';
import { AppState, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import HomeScreen from '../gymApp/screens/HomeScreen';
import PerfilScreen from '../gymApp/screens/PerfilScreen';
import BiometricSetupManager from '../gymApp/components/BiometricSetupManager';
import { 
  selectBiometricEnabled,
  authenticateWithBiometric,
  updateLastUsed,
  selectBiometricAvailable,
} from '../store/slices/biometricSlice';
import { selectJustLoggedIn } from '../store/slices/authSlice';
import { logout } from '../store/slices/authSlice';
import { getBiometricTypeName } from '../utils/biometricUtils';
import { showErrorToast } from '../utils/toastUtils';

const Tab = createBottomTabNavigator();

export default function AppStack() {
  const dispatch = useDispatch();
  const biometricEnabled = useSelector(selectBiometricEnabled);
  const biometricAvailable = useSelector(selectBiometricAvailable);
  const justLoggedIn = useSelector(selectJustLoggedIn);
  
  // Estados para el bloqueo biométrico integrado
  const [isLocked, setIsLocked] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricTypeName, setBiometricTypeName] = useState('Huella Digital');
  const [authAttempted, setAuthAttempted] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const appState = useRef(AppState.currentState);

  // LOGS DETALLADOS en mount
  useEffect(() => {
    console.log('[AppStack] 🚀 MONTADO - Estado inicial:', {
      biometricEnabled,
      biometricAvailable,
      justLoggedIn,
      appStateValue: appState.current
    });
  }, []);

  // LOGS cuando cambia biometricEnabled
  useEffect(() => {
    console.log('[AppStack] 🔄 biometricEnabled cambió a:', biometricEnabled);
  }, [biometricEnabled]);

  // Cargar tipo de biometría
  useEffect(() => {
    loadBiometricType();
  }, []);

  const loadBiometricType = async () => {
    const typeName = await getBiometricTypeName();
    setBiometricTypeName(typeName);
    console.log('[AppStack] 📱 Tipo biométrico:', typeName);
  };

  // Check inicial al montar si debe bloquear
  useEffect(() => {
    const performInitialCheck = async () => {
      console.log('[AppStack] 🔍 Check inicial de bloqueo...');
      console.log('[AppStack] Estado para check:', {
        biometricEnabled,
        biometricAvailable,
        justLoggedIn,
        initialCheckDone
      });

      // Si biometría está habilitada Y no acaba de loguearse
      // Y no se ha hecho el check inicial → BLOQUEAR
      if (biometricEnabled && biometricAvailable && !justLoggedIn && !initialCheckDone) {
        console.log('[AppStack] 🔒 BLOQUEANDO por check inicial');
        setIsLocked(true);
        setInitialCheckDone(true);
      } else {
        console.log('[AppStack] ℹ️ No se bloquea:', {
          enabled: biometricEnabled,
          available: biometricAvailable,
          justLogged: justLoggedIn,
          checkDone: initialCheckDone
        });
        setInitialCheckDone(true);
      }
    };

    // Solo ejecutar el check una vez que tengamos los valores del estado
    if (biometricAvailable !== undefined && !initialCheckDone) {
      performInitialCheck();
    }
  }, [biometricEnabled, biometricAvailable, justLoggedIn, initialCheckDone]);

  // Detectar cuando la app vuelve de background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [biometricEnabled, justLoggedIn, biometricAvailable]);

  const handleAppStateChange = (nextAppState) => {
    console.log('[AppStack] 🔄 AppState:', appState.current, '->', nextAppState);
    console.log('[AppStack] Estado biométrico:', {
      enabled: biometricEnabled,
      available: biometricAvailable,
      justLoggedIn
    });

    // Si la app vuelve a foreground (activa)
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      console.log('[AppStack] 📱 App volvió a primer plano');

      // Mostrar bloqueo SOLO si:
      // 1. Biometría está habilitada
      // 2. Biometría está disponible
      // 3. NO acaba de loguearse (para no interferir con el setup modal)
      if (biometricEnabled && biometricAvailable && !justLoggedIn) {
        console.log('[AppStack] 🔒 Bloqueando pantalla por reactivación');
        setIsLocked(true);
        setAuthAttempted(false);
      } else {
        console.log('[AppStack] ℹ️ No se bloquea por reactivación:', {
          enabled: biometricEnabled,
          available: biometricAvailable,
          justLogged: justLoggedIn
        });
      }
    }

    appState.current = nextAppState;
  };

  // Auto-autenticar cuando se bloquea
  useEffect(() => {
    if (isLocked && !authAttempted) {
      console.log('[AppStack] 🔐 Auto-iniciando autenticación...');
      handleAuthenticate();
    }
  }, [isLocked, authAttempted]);

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    setAuthAttempted(true);

    try {
      console.log('[AppStack] 🔐 Solicitando autenticación biométrica...');

      await dispatch(
        authenticateWithBiometric('Verificar identidad')
      ).unwrap();

      console.log('[AppStack] ✅ Autenticación exitosa');

      // Actualizar último uso
      await dispatch(updateLastUsed());

      // Desbloquear
      setIsLocked(false);
      setAuthAttempted(false);
    } catch (error) {
      console.error('[AppStack] ❌ Error de autenticación:', error);

      if (error.toString().includes('cancelada') || error.toString().includes('cancel')) {
        console.log('[AppStack] Usuario canceló autenticación');
        showErrorToast('Cancelado', 'Debes autenticarte para continuar');
      } else {
        showErrorToast('Error', 'No se pudo autenticar');
      }

      setIsAuthenticating(false);
      setAuthAttempted(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('[AppStack] 🚪 Cerrando sesión por fallo de autenticación');
      await dispatch(logout()).unwrap();
    } catch (error) {
      console.error('[AppStack] Error en logout:', error);
    }
  };

  // LOGS cuando cambia isLocked
  useEffect(() => {
    console.log('[AppStack] 🔒 Estado de bloqueo cambió a:', isLocked);
  }, [isLocked]);

  // Renderizar pantalla de bloqueo si está bloqueado
  if (isLocked) {
    console.log('[AppStack] 🔒 RENDERIZANDO PANTALLA DE BLOQUEO');
    return (
      <View style={styles.lockContainer}>
        <View style={styles.lockContent}>
          {/* Icono */}
          <View style={styles.iconContainer}>
            <Ionicons
              name={
                biometricTypeName === 'PIN del Dispositivo'
                  ? 'keypad'
                  : 'finger-print'
              }
              size={80}
              color="#74C1E6"
            />
          </View>

          {/* Título */}
          <Text style={styles.lockTitle}>Verificación Requerida</Text>
          <Text style={styles.lockSubtitle}>
            Usa tu {biometricTypeName} para continuar
          </Text>

          {/* Botón de autenticación */}
          <TouchableOpacity
            style={[styles.authButton, isAuthenticating && styles.buttonDisabled]}
            onPress={handleAuthenticate}
            disabled={isAuthenticating}
          >
            {isAuthenticating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={24} color="#fff" />
                <Text style={styles.authButtonText}>Autenticar</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Botón de cerrar sesión */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
          </TouchableOpacity>

          {/* Info */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={18} color="#666" />
            <Text style={styles.infoText}>
              La autenticación biométrica está activa para esta sesión
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Renderizar tabs normalmente
  console.log('[AppStack] 📱 RENDERIZANDO TABS NORMALMENTE');
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
      
      {/* Modal de configuración biométrica (solo después de login) */}
      <BiometricSetupManager />
    </>
  );
}

const styles = StyleSheet.create({
  lockContainer: {
    flex: 1,
    backgroundColor: '#faf7f7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockContent: {
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(116, 193, 230, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  lockTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#121212',
    marginBottom: 8,
    textAlign: 'center',
  },
  lockSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  authButton: {
    flexDirection: 'row',
    backgroundColor: '#74C1E6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    marginBottom: 16,
    shadowColor: '#74C1E6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  logoutButtonText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});