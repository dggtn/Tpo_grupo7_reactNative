import { createSlice } from '@reduxjs/toolkit';

// Tipos de errores
export const ERROR_TYPES = {
  NETWORK: 'network',
  AUTH: 'auth',
  FUNCTIONAL: 'functional',
  CRASH: 'crash',
  UNKNOWN: 'unknown',
};

const errorSlice = createSlice({
  name: 'error',
  initialState: {
    currentError: null,
    errorHistory: [],
    showErrorScreen: false,
  },
  reducers: {
    setError: (state, action) => {
      const error = {
        id: Date.now(),
        type: action.payload.type || ERROR_TYPES.UNKNOWN,
        message: action.payload.message,
        details: action.payload.details || null,
        source: action.payload.source || 'Unknown',
        timestamp: Date.now(),
      };
      
      state.currentError = error;
      state.errorHistory.push(error);
      
      // Mantener solo los últimos 10 errores
      if (state.errorHistory.length > 10) {
        state.errorHistory = state.errorHistory.slice(-10);
      }
    },
    clearError: (state) => {
      state.currentError = null;
      state.showErrorScreen = false;
    },
    showErrorScreen: (state, action) => {
      state.showErrorScreen = true;
      if (action.payload) {
        state.currentError = action.payload;
      }
    },
    hideErrorScreen: (state) => {
      state.showErrorScreen = false;
    },
    clearErrorHistory: (state) => {
      state.errorHistory = [];
    },
    setNetworkError: (state, action) => {
      const error = {
        id: Date.now(),
        type: ERROR_TYPES.NETWORK,
        message: action.payload.message || 'Error de conexión',
        details: action.payload.details,
        source: action.payload.source,
        timestamp: Date.now(),
      };
      state.currentError = error;
      state.errorHistory.push(error);
    },
    setAuthError: (state, action) => {
      const error = {
        id: Date.now(),
        type: ERROR_TYPES.AUTH,
        message: action.payload.message || 'Error de autenticación',
        details: action.payload.details,
        source: action.payload.source,
        timestamp: Date.now(),
      };
      state.currentError = error;
      state.errorHistory.push(error);
    },
    setFunctionalError: (state, action) => {
      const error = {
        id: Date.now(),
        type: ERROR_TYPES.FUNCTIONAL,
        message: action.payload.message,
        details: action.payload.details,
        source: action.payload.source,
        timestamp: Date.now(),
      };
      state.currentError = error;
      state.errorHistory.push(error);
    },
  },
});

export const {
  setError,
  clearError,
  showErrorScreen,
  hideErrorScreen,
  clearErrorHistory,
  setNetworkError,
  setAuthError,
  setFunctionalError,
} = errorSlice.actions;

// Selectors
export const selectCurrentError = (state) => state.error.currentError;
export const selectShowErrorScreen = (state) => state.error.showErrorScreen;
export const selectErrorHistory = (state) => state.error.errorHistory;

export default errorSlice.reducer;