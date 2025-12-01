import React, { useEffect, useState, useRef } from 'react';
import {
  fetchLongPollEvents,
  processEvent,
  markEventsAsRead,
  cancelAllScheduledNotifications,
} from './services/longPollService';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import {
  ActivityIndicator,
  View,
  StyleSheet,
  LogBox,
  Text,
  Platform,
  AppState,
} from 'react-native';
import { PaperProvider, Button } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import { Camera } from 'expo-camera';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { store, persistor } from './store/store';
import RootNavigator from './navigation/RootNavigator';
import ErrorBoundary from './gymApp/components/ErrorBoundary';
import { toastConfig } from './config/toastConfig';
import { selectIsAuthenticated } from './store/slices/authSlice';

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

const TASK_NAME = 'LONG_POLL_TASK_v2';
const PERMISSIONS_KEY = '@permissions:status';
const PERMISSIONS_POSTPONED_KEY = '@permissions:postponed';

// ==================== CONFIGURACIÓN DE NOTIFICACIONES ====================
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ==================== DEFINICIÓN DE LA TAREA DE BACKGROUND ====================
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    console.log('[BackgroundTask] Ejecutando...');
    
    // Obtener eventos del backend
    const events = await fetchLongPollEvents(null, 35000);
    
    if (!Array.isArray(events) || events.length === 0) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    console.log('[BackgroundTask] Procesando', events.length, 'eventos');

    // Procesar cada evento
    for (const event of events) {
      await processEvent(event);
    }

    // Marcar eventos como leídos
    const eventIds = events.map(e => e.id).filter(Boolean);
    if (eventIds.length > 0) {
      await markEventsAsRead(eventIds);
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (err) {
    console.error('[BackgroundTask] Error:', err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ==================== COMPONENTE INTERNO CON PERMISOS ====================
function AppContent() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [permissionsPostponed, setPermissionsPostponed] = useState(false);
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);
  
  const appState = useRef(AppState.currentState);
  const pollingInterval = useRef(null);

  // ==================== VERIFICAR PERMISOS AL INICIAR ====================
  useEffect(() => {
    const checkInitialPermissions = async () => {
      try {
        const savedStatus = await AsyncStorage.getItem(PERMISSIONS_KEY);
        const postponedStatus = await AsyncStorage.getItem(PERMISSIONS_POSTPONED_KEY);
        
        if (savedStatus === 'granted') {
          setPermissionsGranted(true);
          setShowPermissionBanner(false);
        } else if (postponedStatus === 'true') {
          setPermissionsPostponed(true);
          setShowPermissionBanner(false);
        }
      } catch (error) {
        console.error('[App] Error verificando permisos:', error);
      } finally {
        setIsCheckingPermissions(false);
      }
    };

    checkInitialPermissions();
  }, []);

  // ==================== MOSTRAR BANNER DESPUÉS DE AUTENTICARSE ====================
  useEffect(() => {
    const handlePostLogin = async () => {
      if (isAuthenticated && !permissionsGranted && !permissionsPostponed) {
        setShowPermissionBanner(true);
        
        Toast.show({
          type: 'info',
          text1: 'Permisos necesarios',
          text2: 'Activa notificaciones y cámara para usar todas las funciones',
          visibilityTime: 5000,
        });
      }
    };

    handlePostLogin();
  }, [isAuthenticated, permissionsGranted, permissionsPostponed]);

  // ==================== REGISTRAR BACKGROUND TASK ====================
  useEffect(() => {
    if (!permissionsGranted) return;

    const registerTask = async () => {
      try {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
        
        if (!isRegistered) {
          await BackgroundFetch.registerTaskAsync(TASK_NAME, {
            minimumInterval: 15 * 60, // 15 minutos
            stopOnTerminate: false,
            startOnBoot: true,
          });
          console.log('[App] Background task registrada');
        }
      } catch (error) {
        console.error('[App] Error registrando background task:', error);
      }
    };

    registerTask();
  }, [permissionsGranted]);

  // ==================== FOREGROUND POLLING ====================
  useEffect(() => {
    if (!isAuthenticated || !permissionsGranted) {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
      return;
    }

    const startForegroundPolling = () => {
      if (pollingInterval.current) return; // Ya está corriendo

      console.log('[App] Iniciando polling en foreground');
      
      pollingInterval.current = setInterval(async () => {
        try {
          const events = await fetchLongPollEvents(null, 25000);
          
          if (Array.isArray(events) && events.length > 0) {
            console.log('[App] Foreground polling:', events.length, 'eventos');
            
            for (const event of events) {
              await processEvent(event);
            }

            const eventIds = events.map(e => e.id).filter(Boolean);
            if (eventIds.length > 0) {
              await markEventsAsRead(eventIds);
            }
          }
        } catch (error) {
          console.error('[App] Error en foreground polling:', error);
        }
      }, 45 * 1000); // Cada 45 segundos
    };

    startForegroundPolling();

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
    };
  }, [isAuthenticated, permissionsGranted]);

  // ==================== MANEJAR CAMBIOS DE APP STATE ====================
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('[App] App volvió al foreground');
        
        // Hacer un poll inmediato al volver
        if (isAuthenticated && permissionsGranted) {
          (async () => {
            try {
              const events = await fetchLongPollEvents(null, 25000);
              if (Array.isArray(events) && events.length > 0) {
                for (const event of events) {
                  await processEvent(event);
                }
                const eventIds = events.map(e => e.id).filter(Boolean);
                if (eventIds.length > 0) {
                  await markEventsAsRead(eventIds);
                }
              }
            } catch (error) {
              console.error('[App] Error en poll al volver:', error);
            }
          })();
        }
      }

      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [isAuthenticated, permissionsGranted]);

  // ==================== LISTENER DE NOTIFICACIONES ====================
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      response => {
        console.log('[App] Notificación tocada:', response.notification.request.content.data);
        // Aquí puedes navegar a pantallas específicas según el tipo de evento
      }
    );

    return () => subscription.remove();
  }, []);

  // ==================== SOLICITAR PERMISOS ====================
  const requestPermissions = async () => {
    try {
      console.log('[App] Solicitando permisos...');

      // 1. Permisos de notificaciones
      const { status: notifStatus } = await Notifications.requestPermissionsAsync();
      const notifGranted = notifStatus === 'granted';

      // 2. Permisos de cámara
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const cameraGranted = cameraStatus === 'granted';

      if (notifGranted && cameraGranted) {
        setPermissionsGranted(true);
        setShowPermissionBanner(false);
        setPermissionsPostponed(false);
        
        await AsyncStorage.setItem(PERMISSIONS_KEY, 'granted');
        await AsyncStorage.removeItem(PERMISSIONS_POSTPONED_KEY);

        Toast.show({
          type: 'success',
          text1: 'Permisos otorgados',
          text2: 'Recibirás notificaciones de tus clases',
        });
      } else {
        let message = 'Algunos permisos no fueron otorgados.';
        if (!notifGranted) message = 'Permiso de notificaciones denegado.';
        if (!cameraGranted) message = 'Permiso de cámara denegado.';
        if (!notifGranted && !cameraGranted) message = 'Ambos permisos fueron denegados.';

        Toast.show({
          type: 'error',
          text1: 'Permisos incompletos',
          text2: message,
        });
      }
    } catch (error) {
      console.error('[App] Error solicitando permisos:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No se pudieron solicitar los permisos',
      });
    }
  };

  // ==================== POSPONER PERMISOS ====================
  const postponePermissions = async () => {
    setPermissionsPostponed(true);
    setShowPermissionBanner(false);
    
    await AsyncStorage.setItem(PERMISSIONS_POSTPONED_KEY, 'true');

    Toast.show({
      type: 'info',
      text1: 'Permisos pospuestos',
      text2: 'Puedes activarlos desde Perfil > Configuración',
    });
  };

  // ==================== BANNER DE PERMISOS ====================
  const PermissionBanner = () => (
    <View style={styles.permissionBanner}>
      <Text style={styles.permissionText}>
        Para recibir recordatorios y escanear QR necesitamos permisos de notificaciones y cámara
      </Text>
      <View style={styles.bannerButtons}>
        <Button
          mode="contained"
          onPress={requestPermissions}
          style={styles.acceptButton}
          labelStyle={styles.buttonLabel}
        >
          Aceptar
        </Button>
        <Button
          mode="outlined"
          onPress={postponePermissions}
          style={styles.postponeButton}
          labelStyle={styles.buttonLabel}
        >
          Posponer
        </Button>
      </View>
    </View>
  );

  // ==================== BOTÓN FLOTANTE PARA REACTIVAR PERMISOS ====================
  const PermissionsButton = () => {
    if (!permissionsPostponed || permissionsGranted || !isAuthenticated) return null;

    return (
      <View style={styles.floatingButtonContainer}>
        <Button
          mode="contained"
          icon="bell-outline"
          onPress={requestPermissions}
          style={styles.floatingButton}
        >
          Activar Permisos
        </Button>
      </View>
    );
  };

  if (isCheckingPermissions) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#74C1E6" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <RootNavigator />
      
      {/* Banner de permisos */}
      {isAuthenticated && showPermissionBanner && <PermissionBanner />}
      
      {/* Botón flotante para reactivar permisos */}
      <PermissionsButton />
      
      <Toast config={toastConfig} />
    </View>
  );
}

// ==================== COMPONENTE PRINCIPAL ====================
export default function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate
          loading={
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#74C1E6" />
            </View>
          }
          persistor={persistor}
        >
          <PaperProvider theme={{ version: 2 }}>
            <AppContent />
          </PaperProvider>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
}

// ==================== ESTILOS ====================
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#faf7f7ff',
  },
  permissionBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: Platform.OS === 'ios' ? 100 : 90,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  permissionText: {
    marginBottom: 16,
    fontSize: 15,
    textAlign: 'center',
    color: '#333',
    lineHeight: 22,
  },
  bannerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#74C1E6',
  },
  postponeButton: {
    flex: 1,
    borderColor: '#74C1E6',
  },
  buttonLabel: {
    fontSize: 14,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  floatingButton: {
    backgroundColor: '#FF9800',
    elevation: 6,
  },
});