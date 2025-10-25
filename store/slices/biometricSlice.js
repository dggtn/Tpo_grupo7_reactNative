import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

// Async thunks
export const checkBiometricAvailability = createAsyncThunk(
  'biometric/checkAvailability',
  async (_, { rejectWithValue }) => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      // ✅ MODIFICADO: Aceptar como disponible si tiene hardware Y está enrollado
      // (esto incluye PIN/Patrón como alternativa)
      const isAvailable = hasHardware && isEnrolled;
      
      console.log('[BiometricSlice] Availability Check:', {
        hasHardware,
        isEnrolled,
        supportedTypes,
        isAvailable
      });
      
      return {
        hasHardware,
        isEnrolled,
        supportedTypes,
        isAvailable,
      };
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
        return rejectWithValue('Autenticación fallida');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Error en autenticación biométrica');
    }
  }
);

export const enableBiometric = createAsyncThunk(
  'biometric/enable',
  async (userEmail, { rejectWithValue }) => {
    try {
      // Guardar email en SecureStore
      await SecureStore.setItemAsync('biometric_user_email', userEmail);
      await SecureStore.setItemAsync('biometric_enabled', 'true');
      await SecureStore.setItemAsync('biometric_setup_time', Date.now().toString());
      
      return { enabled: true, userEmail };
    } catch (error) {
      return rejectWithValue('Error habilitando biometría');
    }
  }
);

export const disableBiometric = createAsyncThunk(
  'biometric/disable',
  async (_, { rejectWithValue }) => {
    try {
      await SecureStore.deleteItemAsync('biometric_user_email');
      await SecureStore.deleteItemAsync('biometric_enabled');
      await SecureStore.deleteItemAsync('biometric_last_used');
      
      return { enabled: false };
    } catch (error) {
      return rejectWithValue('Error deshabilitando biometría');
    }
  }
);

export const loadBiometricConfig = createAsyncThunk(
  'biometric/loadConfig',
  async (_, { rejectWithValue }) => {
    try {
      const enabled = await SecureStore.getItemAsync('biometric_enabled');
      const userEmail = await SecureStore.getItemAsync('biometric_user_email');
      const setupTime = await SecureStore.getItemAsync('biometric_setup_time');
      const lastUsed = await SecureStore.getItemAsync('biometric_last_used');
      
      return {
        enabled: enabled === 'true',
        userEmail: userEmail || null,
        setupTime: setupTime ? parseInt(setupTime) : null,
        lastUsed: lastUsed ? parseInt(lastUsed) : null,
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
      await SecureStore.setItemAsync('biometric_last_used', timestamp);
      return { lastUsed: parseInt(timestamp) };
    } catch (error) {
      return rejectWithValue('Error actualizando último uso');
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
    supportedTypes: [],
    isLoading: false,
    error: null,
    autoRequest: true,
  },
  reducers: {
    clearBiometricError: (state) => {
      state.error = null;
    },
    setAutoRequest: (state, action) => {
      state.autoRequest = action.payload;
    },
    clearBiometricConfig: (state) => {
      state.enabled = false;
      state.userEmail = null;
      state.setupTime = null;
      state.lastUsed = null;
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
      // Enable
      .addCase(enableBiometric.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(enableBiometric.fulfilled, (state, action) => {
        state.isLoading = false;
        state.enabled = true;
        state.userEmail = action.payload.userEmail;
        state.setupTime = Date.now();
      })
      .addCase(enableBiometric.rejected, (state, action) => {
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
      })
      .addCase(disableBiometric.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Load Config
      .addCase(loadBiometricConfig.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadBiometricConfig.fulfilled, (state, action) => {
        state.isLoading = false;
        state.enabled = action.payload.enabled;
        state.userEmail = action.payload.userEmail;
        state.setupTime = action.payload.setupTime;
        state.lastUsed = action.payload.lastUsed;
      })
      .addCase(loadBiometricConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Last Used
      .addCase(updateLastUsed.fulfilled, (state, action) => {
        state.lastUsed = action.payload.lastUsed;
      });
  },
});

export const { 
  clearBiometricError, 
  setAutoRequest, 
  clearBiometricConfig 
} = biometricSlice.actions;

// Selectors
export const selectBiometric = (state) => state.biometric;
export const selectBiometricEnabled = (state) => state.biometric.enabled;
export const selectBiometricAvailable = (state) => state.biometric.isAvailable;
export const selectBiometricUserEmail = (state) => state.biometric.userEmail;
export const selectBiometricLoading = (state) => state.biometric.isLoading;
export const selectShouldRequestBiometric = (state) => {
  const { enabled, isAvailable, autoRequest, userEmail } = state.biometric;
  const currentUserEmail = state.user.email;
  return enabled && isAvailable && autoRequest && userEmail === currentUserEmail;
};

export default biometricSlice.reducer;