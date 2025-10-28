import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';

// Importar los slices
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import biometricReducer from './slices/biometricSlice';
import errorReducer from './slices/errorSlice';

// Configuración de persist para auth y user
const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
};

const userPersistConfig = {
  key: 'user',
  storage: AsyncStorage,
};

// Biometric NO se persiste - solo vive en memoria (sesión actual)
// Esto asegura que la biometría se desactive automáticamente al cerrar la app

// Configuración de persist global
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'user'], // Solo persistir auth y user
  blacklist: ['error', 'biometric'], // NUNCA persistir biometric ni errores
};

// Combinar reducers
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  user: persistReducer(userPersistConfig, userReducer),
  biometric: biometricReducer, // NO persistido - se resetea en cada inicio
  error: errorReducer, // NO persistido
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