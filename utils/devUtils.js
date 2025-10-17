/**
 * Utilidades de desarrollo para debugging
 * NO USAR EN PRODUCCIÓN
 */

import { store } from '../store/store';
import { persistor } from '../store/store';

/**
 * Debug del estado completo de Redux
 */
export const debugReduxState = () => {
  if (__DEV__) {
    const state = store.getState();
    console.group('🔍 Redux State Debug');
    console.log('Auth:', state.auth);
    console.log('User:', state.user);
    console.log('Biometric:', state.biometric);
    console.log('Error:', state.error);
    console.groupEnd();
    return state;
  }
};

/**
 * Limpiar todo el storage persistido
 */
export const clearAllStorage = async () => {
  if (__DEV__) {
    console.warn('⚠️ Limpiando todo el storage...');
    await persistor.purge();
    console.log('✅ Storage limpiado');
  }
};

/**
 * Simular login rápido para desarrollo
 */
export const devQuickLogin = async () => {
  if (__DEV__) {
    const { login } = require('../redux/slices/authSlice');
    
    try {
      await store.dispatch(
        login({
          email: 'test@example.com',
          password: 'test123',
        })
      ).unwrap();
      console.log('✅ Login de desarrollo exitoso');
    } catch (error) {
      console.error('❌ Error en login de desarrollo:', error);
    }
  }
};

/**
 * Ver información del token actual
 */
export const debugToken = () => {
  if (__DEV__) {
    const state = store.getState();
    const token = state.auth.token;
    
    if (!token) {
      console.log('❌ No hay token');
      return;
    }
    
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const payload = JSON.parse(jsonPayload);
      
      console.group('🔑 Token Debug');
      console.log('Token:', token.substring(0, 50) + '...');
      console.log('Payload:', payload);
      console.log('Expira:', new Date(payload.exp * 1000).toLocaleString());
      console.groupEnd();
    } catch (error) {
      console.error('Error parseando token:', error);
    }
  }
};

/**
 * Simular error para testing
 */
export const simulateError = (type = 'network') => {
  if (__DEV__) {
    const { setError } = require('../redux/slices/errorSlice');
    
    const errors = {
      network: {
        type: 'network',
        message: 'Error de conexión simulado',
        details: 'Este es un error de prueba',
        source: 'DevUtils',
      },
      auth: {
        type: 'auth',
        message: 'Error de autenticación simulado',
        details: 'Token inválido de prueba',
        source: 'DevUtils',
      },
      functional: {
        type: 'functional',
        message: 'Error funcional simulado',
        details: 'Operación no permitida',
        source: 'DevUtils',
      },
    };
    
    store.dispatch(setError(errors[type] || errors.network));
    console.log('⚠️ Error simulado:', type);
  }
};

/**
 * Toggle biometría para testing
 */
export const toggleBiometric = async () => {
  if (__DEV__) {
    const state = store.getState();
    const enabled = state.biometric.enabled;
    
    if (enabled) {
      const { disableBiometric } = require('../redux/slices/biometricSlice');
      await store.dispatch(disableBiometric()).unwrap();
      console.log('❌ Biometría desactivada');
    } else {
      const { enableBiometric } = require('../redux/slices/biometricSlice');
      await store.dispatch(enableBiometric('test@example.com')).unwrap();
      console.log('✅ Biometría activada');
    }
  }
};

/**
 * Información del entorno
 */
export const debugEnvironment = () => {
  if (__DEV__) {
    console.group('🌍 Environment Info');
    console.log('API URL:', process.env.EXPO_PUBLIC_API_URL);
    console.log('Platform:', require('react-native').Platform.OS);
    console.log('Development:', __DEV__);
    console.groupEnd();
  }
};

/**
 * Exportar funciones de desarrollo al window (para React Native Debugger)
 */
export const enableDevTools = () => {
  if (__DEV__ && typeof window !== 'undefined') {
    window.devUtils = {
      debugState: debugReduxState,
      clearStorage: clearAllStorage,
      quickLogin: devQuickLogin,
      debugToken,
      simulateError,
      toggleBiometric,
      debugEnvironment,
    };
    
    console.log('🛠️ Dev Tools habilitadas. Usa window.devUtils.*');
  }
};

// Auto-habilitar en desarrollo
if (__DEV__) {
  enableDevTools();
}