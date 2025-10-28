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
} from '../store/slices/biometricSlice';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const token = useSelector(selectToken);
  const showErrorScreen = useSelector(selectShowErrorScreen);
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    console.log('[RootNavigator] Estado de autenticación:', {
      isAuthenticated,
      hasToken: !!token,
      showErrorScreen
    });
  }, [isAuthenticated, token, showErrorScreen]);

  // ✅ Inicialización simplificada - Redux Persist ya cargó el estado
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('[RootNavigator] 🚀 Inicializando aplicación...');
        
        // ✅ SOLO verificar disponibilidad (no cargar config, ya lo hizo Redux Persist)
        await dispatch(checkBiometricAvailability(false)).unwrap();
        console.log('[RootNavigator] ✅ Disponibilidad biométrica verificada');
        
      } catch (error) {
        console.error('[RootNavigator] ❌ Error en inicialización:', error);
      } finally {
        setIsReady(true);
      }
    };

    initializeApp();
  }, []); // ✅ Array vacío = solo ejecuta una vez

  // ✅ Limpiar estado biométrico cuando se cierra sesión
  useEffect(() => {
    if (!isAuthenticated && !token) {
      console.log('[RootNavigator] 🗑️ Sesión cerrada, limpiando biometría');
      dispatch(resetBiometricOnLogout());
    }
  }, [isAuthenticated, token, dispatch]);

  if (!isReady) {
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

