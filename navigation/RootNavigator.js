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
  loadBiometricConfig,
  checkBiometricAvailability,
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
      tokenLength: token ? token.length : 0,
      showErrorScreen
    });
  }, [isAuthenticated, token, showErrorScreen]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('[RootNavigator] 🚀 Inicializando aplicación...');
        
        // Cargar configuración biométrica guardada
        await dispatch(loadBiometricConfig()).unwrap();
        console.log('[RootNavigator] ✅ Configuración biométrica cargada');
        
        // Verificar disponibilidad de biometría
        await dispatch(checkBiometricAvailability()).unwrap();
        console.log('[RootNavigator] ✅ Disponibilidad biométrica verificada');
        
      } catch (error) {
        console.error('[RootNavigator] ❌ Error en inicialización:', error);
      } finally {
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#B1A1A1' }}>
        <ActivityIndicator size="large" color="#74C1E6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          // ✅ AGREGADO: Animación más suave
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
                // Evitar animación brusca al navegar desde login
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
              // ✅ Mantener la pantalla de auth montada para el modal
              animationEnabled: true,
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
