import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

let availabilityCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60000; // 1 minuto

// Async thunks
export const checkBiometricAvailability = createAsyncThunk(
  'biometric/checkAvailability',
  async (forceCheck = false, { rejectWithValue }) => {
    try {
      const now = Date.now();
      if (!forceCheck && availabilityCache && (now - cacheTimestamp) < CACHE_DURATION) {
        console.log('[BiometricSlice] ✅ Usando resultado cacheado');
        return availabilityCache;
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      console.log('[BiometricSlice] Detección inicial:', {
        hasHardware,
        isEnrolled,
        supportedTypes
      });

      let reallyAvailable = false;
      
      if (hasHardware) {
        try {
          console.log('[BiometricSlice] 🧪 Haciendo prueba real única...');
          
          const testResult = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Verificando seguridad del dispositivo',
            cancelLabel: 'Cancelar',
            disableDeviceFallback: false,
          });
          
          reallyAvailable = testResult.success || testResult.error === 'user_cancel';
          
          console.log('[BiometricSlice] ✅ Prueba real completada:', {
            testSuccess: testResult.success,
            testError: testResult.error,
            reallyAvailable
          });
          
        } catch (testError) {
          if (testError.toString().includes('not available') || 
              testError.toString().includes('not enrolled')) {
            reallyAvailable = false;
            console.log('[BiometricSlice] ❌ No disponible por error:', testError.message);
          } else {
            reallyAvailable = true;
            console.log('[BiometricSlice] ✅ Disponible (error de cancelación)');
          }
        }
      }
      
      const isAvailable = hasHardware && reallyAvailable;
      
      const result = {
        hasHardware,
        isEnrolled,
        supportedTypes,
        isAvailable,
        reallyAvailable,
      };
      
      console.log('[BiometricSlice] Availability Check FINAL:', result);
      
      availabilityCache = result;
      cacheTimestamp = now;
      
      return result;
    } catch (error) {
      console.error('[BiometricSlice] Error checking availability:', error);
      return rejectWithValue('Error verificando biometría');
    }
  }
);

export const authenticateWithBiometric = createAsyncThunk(
  'biometric/authenticate',
  async (promptMessage = 'Autenticación biométrica', { rejectWithValue }) => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });
      
      if (result.success) {
        return { success: true };
      } else {
        return rejectWithValue(result.error || 'Autenticación fallida');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Error en autenticación biométrica');
    }
  }
);

// Habilitar biometría para la SESIÓN ACTUAL (no persistente entre logouts)
export const enableBiometricForSession = createAsyncThunk(
  'biometric/enableForSession',
  async (userEmail, { rejectWithValue }) => {
    try {
      console.log('[BiometricSlice] ✅ Habilitando biometría para sesión actual:', userEmail);
      
      //NO guardar en SecureStore, solo en memoria (Redux)
      // Esto hace que la configuración se pierda al cerrar sesión
      
      return { 
        enabled: true, 
        userEmail,
        sessionOnly: true // Flag para indicar que es solo para esta sesión
      };
    } catch (error) {
      return rejectWithValue('Error habilitando biometría');
    }
  }
);

// Deshabilitar biometría (limpiar TODO)
export const disableBiometric = createAsyncThunk(
  'biometric/disable',
  async (_, { rejectWithValue }) => {
    try {
      console.log('[BiometricSlice] 🗑️ Deshabilitando biometría completamente');
      
      // Limpiar todo de SecureStore por seguridad
      await SecureStore.deleteItemAsync('biometric_user_email');
      await SecureStore.deleteItemAsync('biometric_enabled');
      await SecureStore.deleteItemAsync('biometric_last_used');
      await SecureStore.deleteItemAsync('biometric_setup_time');
      
      return { enabled: false };
    } catch (error) {
      return rejectWithValue('Error deshabilitando biometría');
    }
  }
);

// Cargar configuración (solo para verificar, NO habilitar automáticamente)
export const loadBiometricConfig = createAsyncThunk(
  'biometric/loadConfig',
  async (_, { rejectWithValue }) => {
    try {
      console.log('[BiometricSlice] 📂 Verificando configuración guardada...');
      
      // Solo verificar si hay algo guardado (no usarlo)
      const enabled = await SecureStore.getItemAsync('biometric_enabled');
      const userEmail = await SecureStore.getItemAsync('biometric_user_email');
      
      console.log('[BiometricSlice] Configuración encontrada:', { enabled, userEmail });
      
      // Siempre devolver enabled=false al cargar
      // La biometría solo se activa DESPUÉS de login si el usuario lo configura
      return {
        enabled: false, // NUNCA auto-habilitar
        userEmail: null,
        setupTime: null,
        lastUsed: null,
      };
    } catch (error) {
      return rejectWithValue('Error cargando configuración');
    }
  }
);

export const updateLastUsed = createAsyncThunk(
  'biometric/updateLastUsed',
  async (_, { rejectWithValue }) => {
    try {
      const timestamp = Date.now().toString();
      // NO guardar en SecureStore, solo actualizar en memoria
      return { lastUsed: parseInt(timestamp) };
    } catch (error) {
      return rejectWithValue('Error actualizando último uso');
    }
  }
);

// Marcar que se mostró el prompt de configuración
export const markSetupPromptShown = createAsyncThunk(
  'biometric/markPromptShown',
  async (_, { rejectWithValue }) => {
    try {
      return { setupPromptShown: true };
    } catch (error) {
      return rejectWithValue('Error marcando prompt');
    }
  }
);

const biometricSlice = createSlice({
  name: 'biometric',
  initialState: {
    enabled: false,
    userEmail: null,
    setupTime: null,
    lastUsed: null,
    hasHardware: false,
    isEnrolled: false,
    isAvailable: false,
    reallyAvailable: false,
    supportedTypes: [],
    isLoading: false,
    error: null,
    sessionOnly: false, // Indica si la biometría es solo para esta sesión
    setupPromptShown: false, // Indica si ya se mostró el prompt post-login
  },
  reducers: {
    clearBiometricError: (state) => {
      state.error = null;
    },
    //Reset completo al hacer logout
    resetBiometricOnLogout: (state) => {
      console.log('[BiometricSlice] 🔄 Reset por logout');
      state.enabled = false;
      state.userEmail = null;
      state.setupTime = null;
      state.lastUsed = null;
      state.sessionOnly = false;
      state.setupPromptShown = false;
      state.error = null;
    },
    // Reset del flag de prompt mostrado
    resetSetupPrompt: (state) => {
      state.setupPromptShown = false;
    },
    clearAvailabilityCache: (state) => {
      availabilityCache = null;
      cacheTimestamp = 0;
      console.log('[BiometricSlice] 🗑️ Cache limpiado');
    },
  },
  extraReducers: (builder) => {
    builder
      // Check Availability
      .addCase(checkBiometricAvailability.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkBiometricAvailability.fulfilled, (state, action) => {
        state.isLoading = false;
        state.hasHardware = action.payload.hasHardware;
        state.isEnrolled = action.payload.isEnrolled;
        state.isAvailable = action.payload.isAvailable;
        state.reallyAvailable = action.payload.reallyAvailable;
        state.supportedTypes = action.payload.supportedTypes;
      })
      .addCase(checkBiometricAvailability.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Authenticate
      .addCase(authenticateWithBiometric.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(authenticateWithBiometric.fulfilled, (state) => {
        state.isLoading = false;
        state.lastUsed = Date.now();
      })
      .addCase(authenticateWithBiometric.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Enable For Session 
      .addCase(enableBiometricForSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(enableBiometricForSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.enabled = true;
        state.userEmail = action.payload.userEmail;
        state.setupTime = Date.now();
        state.sessionOnly = true;
      })
      .addCase(enableBiometricForSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Disable
      .addCase(disableBiometric.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(disableBiometric.fulfilled, (state) => {
        state.isLoading = false;
        state.enabled = false;
        state.userEmail = null;
        state.setupTime = null;
        state.lastUsed = null;
        state.sessionOnly = false;
      })
      .addCase(disableBiometric.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Load Config
      .addCase(loadBiometricConfig.fulfilled, (state, action) => {
        state.isLoading = false;
        // Siempre cargar como deshabilitado
        state.enabled = false;
        state.userEmail = null;
        state.setupTime = null;
        state.lastUsed = null;
        state.sessionOnly = false;
        state.setupPromptShown = false;
      })
      // Update Last Used
      .addCase(updateLastUsed.fulfilled, (state, action) => {
        state.lastUsed = action.payload.lastUsed;
      })
      // Mark Setup Prompt Shown
      .addCase(markSetupPromptShown.fulfilled, (state) => {
        state.setupPromptShown = true;
      });
  },
});

export const { 
  clearBiometricError, 
  resetBiometricOnLogout, 
  resetSetupPrompt, 
  clearAvailabilityCache,
} = biometricSlice.actions;

// Selectors
export const selectBiometric = (state) => state.biometric;
export const selectBiometricEnabled = (state) => state.biometric.enabled;
export const selectBiometricAvailable = (state) => state.biometric.isAvailable;
export const selectBiometricReallyAvailable = (state) => state.biometric.reallyAvailable;
export const selectBiometricUserEmail = (state) => state.biometric.userEmail;
export const selectBiometricLoading = (state) => state.biometric.isLoading;
export const selectSetupPromptShown = (state) => state.biometric.setupPromptShown; // ✅ NUEVO

export const selectShouldRequestBiometric = (state) => {
  const { enabled, isAvailable } = state.biometric;
  return enabled && isAvailable;
};

export default biometricSlice.reducer;