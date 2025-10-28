import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/authAPI';

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authAPI.authenticate(email, password);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Error en el inicio de sesión');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authAPI.iniciarRegistro(userData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Error en el registro');
    }
  }
);

export const verifyCode = createAsyncThunk(
  'auth/verifyCode',
  async ({ email, code }, { rejectWithValue }) => {
    try {
      const response = await authAPI.finalizarRegistro(email, code);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Error en la verificación');
    }
  }
);

export const resendCode = createAsyncThunk(
  'auth/resendCode',
  async (email, { rejectWithValue }) => {
    try {
      const response = await authAPI.reenviarCodigo(email);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Error al reenviar código');
    }
  }
);

export const checkPendingRegistration = createAsyncThunk(
  'auth/checkPendingRegistration',
  async (email, { rejectWithValue }) => {
    try {
      const response = await authAPI.verificarEmailPendiente(email);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'No hay registro pendiente');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue, getState }) => {
    try {
      console.log('[authSlice.logout] 🚪 Iniciando logout...');
      
      const state = getState();
      const token = state.auth.token;
      
      console.log('[authSlice.logout] 🔑 Token presente:', !!token);
      
      if (token) {
        console.log('[authSlice.logout] 📡 Enviando request al backend...');
        await authAPI.logout(token);
        console.log('[authSlice.logout] ✅ Logout exitoso en backend');
      } else {
        console.log('[authSlice.logout] ⚠️ No hay token, solo logout local');
      }
      
      return null;
    } catch (error) {
      console.error('[authSlice.logout] ❌ Error:', error);
      // ✅ CRÍTICO: Siempre hacer logout local aunque falle el servidor
      // No rechazar, solo loguear el error
      console.log('[authSlice.logout] 🔄 Continuando con logout local');
      return null;
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState: {
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  loginTime: null,
  pendingEmail: null,
  registrationInProgress: false,
  justLoggedIn: false, 
},
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      state.token = null;
      state.isAuthenticated = false;
      state.loginTime = null;
      state.error = null;
    },
    setPendingEmail: (state, action) => {
      state.pendingEmail = action.payload;
    },
    clearPendingEmail: (state) => {
      state.pendingEmail = null;
    },
    setRegistrationInProgress: (state, action) => {
      state.registrationInProgress = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.access_token;
        state.isAuthenticated = true;
        state.loginTime = Date.now();
        state.error = null;
        state.justLoggedIn = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.token = null;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.registrationInProgress = true;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.registrationInProgress = false;
      })
      // Verify Code
      .addCase(verifyCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyCode.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
        state.pendingEmail = null;
        state.registrationInProgress = false;
      })
      .addCase(verifyCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Resend Code
      .addCase(resendCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resendCode.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resendCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Check Pending Registration
      .addCase(checkPendingRegistration.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkPendingRegistration.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(checkPendingRegistration.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
        state.loginTime = null;
        state.pendingEmail = null;
        state.registrationInProgress = false;
      })
      .addCase(logout.rejected, (state) => {
        // Limpiar de todos modos
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.loginTime = null;
        state.pendingEmail = null;
        state.registrationInProgress = false;
      });
  },
});

export const { 
  clearError, 
  clearAuth, 
  setPendingEmail, 
  clearPendingEmail,
  setRegistrationInProgress 
} = authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectToken = (state) => state.auth.token;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectLoginTime = (state) => state.auth.loginTime;
export const selectPendingEmail = (state) => state.auth.pendingEmail;
export const selectRegistrationInProgress = (state) => state.auth.registrationInProgress;

export default authSlice.reducer;