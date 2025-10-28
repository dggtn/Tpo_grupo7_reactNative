import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';

// Importar los slices
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import biometricReducer from './slices/biometricSlice';
import errorReducer from './slices/errorSlice';

// Configuración de persist para auth
const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
};

// Configuración de persist para user
const userPersistConfig = {
  key: 'user',
  storage: AsyncStorage,
};

// Persistir biometric PERO solo ciertos campos
const biometricPersistConfig = {
  key: 'biometric',
  storage: AsyncStorage,
  whitelist: [
    'enabled',        // ✅ Guardar si está habilitado
    'userEmail',      // ✅ Guardar email asociado
    'setupTime',      // ✅ Guardar cuándo se configuró
    'sessionOnly',    // ✅ Guardar que es solo para sesión
  ],
  // NO persistir: setupPromptShown (siempre debe resetearse)
  blacklist: [
    'setupPromptShown', 
    'lastUsed',         
    'isLoading',        
    'error',             
    'hasHardware',       
    'isEnrolled',        
    'isAvailable',       
    'reallyAvailable',   
    'supportedTypes',   
  ],
};

// Configuración de persist global
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'user', 'biometric'], // incluimos biometric
  blacklist: ['error'], // Solo errores no se persisten
};

// Combinar reducers
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  user: persistReducer(userPersistConfig, userReducer),
  biometric: persistReducer(biometricPersistConfig, biometricReducer), // ✅ CON persist
  error: errorReducer, // Sin persist
});

// Crear persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configurar store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);
