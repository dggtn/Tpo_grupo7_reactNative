import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';

// Importar los slices
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import biometricReducer from './slices/biometricSlice';
import errorReducer from './slices/errorSlice';

// Configuración de persist
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'user', 'biometric'], // Solo persistir estos reducers
  blacklist: ['error'], // No persistir errores
};

// Combinar reducers
const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  biometric: biometricReducer,
  error: errorReducer,
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