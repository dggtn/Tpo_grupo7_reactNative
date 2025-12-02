import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

let availabilityCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60000; // 1 minuto

// Detecta PIN/Pattern/Biometría
export const checkBiometricAvailability = createAsyncThunk(
  'biometric/checkAvailability',
  async (forceCheck = false, { rejectWithValue }) => {
    try {
      const now = Date.now();
      if (!forceCheck && availabilityCache && (now - cacheTimestamp) < CACHE_DURATION) {
        console.log('[BiometricSlice] ✅ Usando resultado cacheado');
        return availabilityCache;
      }

      console.log('[BiometricSlice] 🔍 Verificando disponibilidad biométrica/PIN...');

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      console.log('[BiometricSlice] Detección inicial:', {
        hasHardware,
        isEnrolled,
        supportedTypes
      });

      let isAvailable = false;
      
      if (hasHardware) {
        if (isEnrolled) {
          console.log('[BiometricSlice] ✅ Biometría real detectada');
          isAvailable = true;
        } else if (supportedTypes.length > 0) {
          console.log('[BiometricSlice] ⚠️ Sin biometría, verificando PIN/Pattern...');
          isAvailable = true;
          console.log('[BiometricSlice] ✅ PIN/Pattern disponible');
        } else {
          console.log('[BiometricSlice] ❌ Sin autenticación configurada');
          isAvailable = false;
        }
      } else {
        console.log('[BiometricSlice] ❌ Sin hardware de seguridad');
        isAvailable = false;
      }
      
      const result = {
        hasHardware,
        isEnrolled,
        supportedTypes,
        isAvailable,
        reallyAvailable: isAvailable,
      };
      
      console.log('[BiometricSlice] ✅ Resultado final:', result);
      
      availabilityCache = result;
      cacheTimestamp = now;
      
      return result;
    } catch (error) {
      console.error('[BiometricSlice] ❌ Error checking availability:', error);
      return rejectWithValue('Error verificando biometría');
    }
  }
);

export const authenticateWithBiometric = createAsyncThunk(
  'biometric/authenticate',
  async (promptMessage = 'Autenticación biométrica', { rejectWithValue }) => {
    try {
      console.log('[BiometricSlice] 🔐 Solicitando autenticación:', promptMessage);
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });
      
      console.log('[BiometricSlice] Resultado autenticación:', result);
      
      if (result.success) {
        return { success: true };
      } else {
        return rejectWithValue(result.error || 'Autenticación fallida');
      }
    } catch (error) {
      console.error('[BiometricSlice] ❌ Error en autenticación:', error);
      return rejectWithValue(error.message || 'Error en autenticación biométrica');
    }
  }
);

// Habilitar biometría SOLO para la sesión actual (NO persistente)
export const enableBiometricForSession = createAsyncThunk(
  'biometric/enableForSession',
  async (userEmail, { rejectWithValue }) => {
    try {
      console.log('[BiometricSlice] ✅ Habilitando biometría para sesión actual:', userEmail);
      
      return { 
        enabled: true, 
        userEmail,
        sessionOnly: true,
        setupTime: Date.now()
      };
    } catch (error) {
      console.error('[BiometricSlice] ❌ Error habilitando biometría:', error);
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
      console.error('[BiometricSlice] ❌ Error deshabilitando biometría:', error);
      return rejectWithValue('Error deshabilitando biometría');
    }
  }
);

// Cargar configuración respetando el estado persistido
export const loadBiometricConfig = createAsyncThunk(
  'biometric/loadConfig',
  async (_, { getState, rejectWithValue }) => {
    try {
      console.log('[BiometricSlice] 📂 Cargando configuración biométrica...');
      
      // Redux Persist ya cargó el estado
      const currentState = getState().biometric;
      
      console.log('[BiometricSlice] Estado persistido:', {
        enabled: currentState.enabled,
        userEmail: currentState.userEmail,
        sessionOnly: currentState.sessionOnly,
        setupTime: currentState.setupTime
      });
      
      // MANTENER el estado que Redux Persist cargó
      // Solo resetear setupPromptShown para permitir que aparezca de nuevo si hace login
      return {
        keepCurrentState: true,
        resetPrompt: true
      };
    } catch (error) {
      console.error('[BiometricSlice] ❌ Error cargando configuración:', error);
      return rejectWithValue('Error cargando configuración');
    }
  }
);

export const updateLastUsed = createAsyncThunk(
  'biometric/updateLastUsed',
  async (_, { rejectWithValue }) => {
    try {
      const timestamp = Date.now();
      console.log('[BiometricSlice] ⏰ Actualizando último uso:', timestamp);
      return { lastUsed: timestamp };
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
      console.log('[BiometricSlice] ✅ Marcando prompt como mostrado');
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
    sessionOnly: false,
    setupPromptShown: false, // Se resetea al cargar pero se mantiene enabled
  },
  reducers: {
    clearBiometricError: (state) => {
      state.error = null;
    },
    
    // Reset completo al hacer logout
    resetBiometricOnLogout: (state) => {
      console.log('[BiometricSlice] 🔄 Reset por logout - Limpiando TODO');
      state.enabled = false;
      state.userEmail = null;
      state.setupTime = null;
      state.lastUsed = null;
      state.sessionOnly = false;
      state.setupPromptShown = false;
      state.error = null;
    },
    
    // Reset del flag de prompt mostrado (para testing)
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
        state.setupTime = action.payload.setupTime;
        state.sessionOnly = true;
        console.log('[BiometricSlice] ✅ Biometría activada para sesión');
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
        console.log('[BiometricSlice] ❌ Biometría desactivada');
      })
      .addCase(disableBiometric.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Load Config - Mantener estado persistido
      .addCase(loadBiometricConfig.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // MANTENER enabled, userEmail, setupTime del estado persistido
        // Solo resetear setupPromptShown para que NO bloquee el modal post-login
        state.setupPromptShown = false;
        
        console.log('[BiometricSlice] ✅ Config cargada, manteniendo estado:', {
          enabled: state.enabled,
          userEmail: state.userEmail,
          setupTime: state.setupTime
        });
      })
      
      // Update Last Used
      .addCase(updateLastUsed.fulfilled, (state, action) => {
        state.lastUsed = action.payload.lastUsed;
      })
      
      // Mark Setup Prompt Shown
      .addCase(markSetupPromptShown.fulfilled, (state) => {
        state.setupPromptShown = true;
        console.log('[BiometricSlice] ✅ Prompt marcado como mostrado');
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
export const selectSetupPromptShown = (state) => state.biometric.setupPromptShown;

export const selectShouldRequestBiometric = (state) => {
  const { enabled, isAvailable } = state.biometric;
  return enabled && isAvailable;
};

export default biometricSlice.reducer;