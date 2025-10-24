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
    // Cargar configuración inicial
    const initializeApp = async () => {
      try {
        await dispatch(loadBiometricConfig()).unwrap();
        await dispatch(checkBiometricAvailability()).unwrap();
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#74C1E6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {showErrorScreen ? (
          <Stack.Screen name="Error" component={ErrorScreen} />
        ) : isAuthenticated && token ? (
          <>
            <Stack.Screen name="App" component={AppStack} />
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
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}