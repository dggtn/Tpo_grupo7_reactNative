import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import ErrorScreen from '../gymApp/screens/auth/ErrorScreen';
import DetalleCursoScreen from '../gymApp/screens/DetalleCursoScreen';
import { 
  selectIsAuthenticated,
  selectToken 
} from '../store/slices/authSlice';
import { 
  selectShowErrorScreen 
} from '../store/slices/errorSlice';
import {
  checkBiometricAvailability,
  resetBiometricOnLogout,
  selectBiometric,
} from '../store/slices/biometricSlice';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const token = useSelector(selectToken);
  const showErrorScreen = useSelector(selectShowErrorScreen);
  const biometricState = useSelector(selectBiometric);
  const [isReady, setIsReady] = React.useState(false);

  // LOG del estado completo al montar
  useEffect(() => {
    console.log('[RootNavigator] 🚀 MONTADO - Estado completo:', {
      isAuthenticated,
      hasToken: !!token,
      showErrorScreen,
      biometric: {
        enabled: biometricState.enabled,
        userEmail: biometricState.userEmail,
        setupTime: biometricState.setupTime,
        sessionOnly: biometricState.sessionOnly,
        isAvailable: biometricState.isAvailable,
      }
    });
  }, []);

  //LOG cuando cambia autenticación
  useEffect(() => {
    console.log('[RootNavigator] 🔄 Estado de autenticación cambió:', {
      isAuthenticated,
      hasToken: !!token,
      showErrorScreen
    });
  }, [isAuthenticated, token, showErrorScreen]);

  //LOG cuando cambia estado biométrico
  useEffect(() => {
    console.log('[RootNavigator] 🔐 Estado biométrico cambió:', {
      enabled: biometricState.enabled,
      userEmail: biometricState.userEmail,
      setupTime: biometricState.setupTime,
      isAvailable: biometricState.isAvailable,
    });
  }, [biometricState.enabled, biometricState.userEmail, biometricState.isAvailable]);

  // Inicialización simplificada
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('[RootNavigator] 🚀 Inicializando aplicación...');
        console.log('[RootNavigator] Estado biométrico al iniciar:', {
          enabled: biometricState.enabled,
          userEmail: biometricState.userEmail,
          setupTime: biometricState.setupTime,
        });
        
        // SOLO verificar disponibilidad (Redux Persist ya cargó el estado)
        const result = await dispatch(checkBiometricAvailability(false)).unwrap();
        console.log('[RootNavigator] ✅ Disponibilidad verificada:', result);
        
      } catch (error) {
        console.error('[RootNavigator] ❌ Error en inicialización:', error);
      } finally {
        setIsReady(true);
        console.log('[RootNavigator] ✅ Aplicación lista');
      }
    };

    initializeApp();
  }, []);

  // Limpiar estado biométrico cuando se cierra sesión
  useEffect(() => {
    if (!isAuthenticated && !token) {
      console.log('[RootNavigator] 🗑️ Sesión cerrada, limpiando biometría');
      console.log('[RootNavigator] Estado biométrico antes de limpiar:', {
        enabled: biometricState.enabled,
        userEmail: biometricState.userEmail,
      });
      dispatch(resetBiometricOnLogout());
    }
  }, [isAuthenticated, token, dispatch]);

  if (!isReady) {
    console.log('[RootNavigator] ⏳ Esperando inicialización...');
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#B1A1A1' 
      }}>
        <ActivityIndicator size="large" color="#74C1E6" />
      </View>
    );
  }

  console.log('[RootNavigator] 📱 Renderizando navegación:', {
    showErrorScreen,
    isAuthenticated,
    hasToken: !!token
  });

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        {showErrorScreen ? (
          <Stack.Screen name="Error" component={ErrorScreen} />
        ) : isAuthenticated && token ? (
          <>
            <Stack.Screen 
              name="App" 
              component={AppStack}
              options={{
                animationTypeForReplace: 'pop',
              }}
            />
            <Stack.Screen 
              name="DetalleCurso" 
              component={DetalleCursoScreen}
              options={{
                headerShown: true,
                title: 'Detalle del Curso',
                headerStyle: {
                  backgroundColor: '#74C1E6',
                },
                headerTintColor: '#fff',
              }}
            />
          </>
        ) : (
          <Stack.Screen 
            name="Auth" 
            component={AuthStack}
            options={{
              animationEnabled: true,
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}