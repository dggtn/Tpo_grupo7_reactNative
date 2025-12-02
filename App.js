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
  '`shouldShowAlert` is deprecated',
]);

const TASK_NAME = 'LONG_POLL_TASK_v2';
const PERMISSIONS_KEY = '@permissions:status';
const PERMISSIONS_POSTPONED_KEY = '@permissions:postponed';

// ==================== CONFIGURACIÓN DE NOTIFICACIONES ====================
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldShowBanner: true,
    shouldSetBadge: true,
    shouldPlaySound: true,
  }),
});

// ==================== DEFINICIÓN DE LA TAREA DE BACKGROUND ====================
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    console.log('[BackgroundTask] 🔄 Ejecutando...');
    
    const events = await fetchLongPollEvents(null, 35000);
    
    if (!Array.isArray(events) || events.length === 0) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    console.log('[BackgroundTask] 📨 Procesando', events.length, 'eventos');

    for (const event of events) {
      try {
        await processEvent(event);
      } catch (error) {
        console.error('[BackgroundTask] ❌ Error procesando evento:', error);
      }
    }

    const eventIds = events.map(e => e.id).filter(Boolean);
    if (eventIds.length > 0) {
      await markEventsAsRead(eventIds);
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (err) {
    console.error('[BackgroundTask] ❌ Error:', err);
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
  const pollingInProgress = useRef(false);
  const bannerTimeout = useRef(null);

  // ==================== CONFIGURAR CANAL DE ANDROID AL INICIAR ====================
  useEffect(() => {
    const setupNotifications = async () => {
      if (Platform.OS === 'android') {
        try {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Notificaciones de Clases',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#74C1E6',
            sound: 'default',
            enableVibrate: true,
            showBadge: true,
          });
          console.log('[App] ✅ Canal de notificaciones configurado');
        } catch (error) {
          console.error('[App] ❌ Error configurando canal:', error);
        }
      }
    };

    setupNotifications();
  }, []);

  // ==================== VERIFICAR PERMISOS AL INICIAR ====================
  useEffect(() => {
    const checkInitialPermissions = async () => {
      try {
        const savedStatus = await AsyncStorage.getItem(PERMISSIONS_KEY);
        const postponedStatus = await AsyncStorage.getItem(PERMISSIONS_POSTPONED_KEY);
        
        if (savedStatus === 'granted') {
          // ✅ Verificar que los permisos REALMENTE estén otorgados
          const { status: notifStatus } = await Notifications.getPermissionsAsync();
          const { status: cameraStatus } = await Camera.getCameraPermissionsAsync();
          
          const reallyGranted = notifStatus === 'granted' && cameraStatus === 'granted';
          
          if (reallyGranted) {
            setPermissionsGranted(true);
            setShowPermissionBanner(false);
            console.log('[App] ✅ Permisos verificados y otorgados');
          } else {
            console.log('[App] ⚠️ Permisos guardados pero no otorgados realmente');
            await AsyncStorage.removeItem(PERMISSIONS_KEY);
          }
        } else if (postponedStatus === 'true') {
          setPermissionsPostponed(true);
          setShowPermissionBanner(false);
          console.log('[App] ⏭️ Permisos pospuestos');
        }
      } catch (error) {
        console.error('[App] ❌ Error verificando permisos:', error);
      } finally {
        setIsCheckingPermissions(false);
      }
    };

    checkInitialPermissions();
  }, []);

  // ==================== MOSTRAR BANNER DESPUÉS DE AUTENTICARSE ====================
  useEffect(() => {
    const handlePostLogin = async () => {
      // ✅ Limpiar timeout previo si existe
      if (bannerTimeout.current) {
        clearTimeout(bannerTimeout.current);
      }

      if (isAuthenticated && !permissionsGranted && !permissionsPostponed) {
        console.log('[App] 🔔 Programando banner de permisos...');
        
        // ✅ Esperar 3 segundos para que se complete el prompt de biometría
        bannerTimeout.current = setTimeout(() => {
          setShowPermissionBanner(true);
          
          Toast.show({
            type: 'info',
            text1: 'Permisos necesarios',
            text2: 'Activa notificaciones y cámara para todas las funciones',
            visibilityTime: 5000,
          });
        }, 3000);
      }
    };

    handlePostLogin();

    return () => {
      if (bannerTimeout.current) {
        clearTimeout(bannerTimeout.current);
      }
    };
  }, [isAuthenticated, permissionsGranted, permissionsPostponed]);

  // ==================== REGISTRAR BACKGROUND TASK ====================
  useEffect(() => {
    if (!permissionsGranted) return;

    const registerTask = async () => {
      try {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
        
        if (!isRegistered) {
          await BackgroundFetch.registerTaskAsync(TASK_NAME, {
            minimumInterval: 15 * 60,
            stopOnTerminate: false,
            startOnBoot: true,
          });
          console.log('[App] ✅ Background task registrada');
        }
      } catch (error) {
        console.error('[App] ❌ Error registrando background task:', error);
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
        console.log('[App] 🛑 Polling detenido');
      }
      return;
    }

    const doPoll = async () => {
      if (pollingInProgress.current) {
        console.log('[App] ⏭️ Polling ya en progreso');
        return;
      }

      try {
        pollingInProgress.current = true;
        
        const events = await fetchLongPollEvents(null, 25000);
        
        if (Array.isArray(events) && events.length > 0) {
          console.log('[App] 📨 Foreground:', events.length, 'eventos');
          
          for (const event of events) {
            try {
              await processEvent(event);
            } catch (error) {
              console.error('[App] ❌ Error procesando:', error);
            }
          }

          const eventIds = events.map(e => e.id).filter(Boolean);
          if (eventIds.length > 0) {
            await markEventsAsRead(eventIds);
          }
        }
      } catch (error) {
        console.error('[App] ❌ Error en polling:', error);
      } finally {
        pollingInProgress.current = false;
      }
    };

    console.log('[App] 🔄 Iniciando polling...');
    
    doPoll();
    pollingInterval.current = setInterval(doPoll, 45 * 1000);

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
        console.log('[App] 🔄 App volvió al foreground');
        
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
              console.error('[App] ❌ Error en poll al volver:', error);
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
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      response => {
        console.log('[App] 🔔 Notificación tocada:', response.notification.request.content);
      }
    );

    const receivedSubscription = Notifications.addNotificationReceivedListener(
      notification => {
        console.log('[App] 📬 Notificación recibida:', notification.request.content);
      }
    );

    return () => {
      responseSubscription.remove();
      receivedSubscription.remove();
    };
  }, []);

  // ==================== SOLICITAR PERMISOS ====================
  const requestPermissions = async () => {
    try {
      console.log('[App] 🔐 Solicitando permisos...');

      // 1. Notificaciones
      const { status: notifStatus } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
        android: {},
      });
      
      console.log('[App] 🔔 Resultado notificaciones:', notifStatus);

      // 2. Cámara
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      console.log('[App] 📷 Resultado cámara:', cameraStatus);

      if (notifStatus === 'granted' && cameraStatus === 'granted') {
        setPermissionsGranted(true);
        setShowPermissionBanner(false);
        setPermissionsPostponed(false);
        
        await AsyncStorage.setItem(PERMISSIONS_KEY, 'granted');
        await AsyncStorage.removeItem(PERMISSIONS_POSTPONED_KEY);

        Toast.show({
          type: 'success',
          text1: '✅ Permisos otorgados',
          text2: 'Recibirás notificaciones de tus clases',
        });

        console.log('[App] ✅ Permisos guardados exitosamente');
      } else {
        let message = 'Algunos permisos no fueron otorgados.';
        if (notifStatus !== 'granted') message = 'Permiso de notificaciones denegado.';
        if (cameraStatus !== 'granted') message = 'Permiso de cámara denegado.';
        if (notifStatus !== 'granted' && cameraStatus !== 'granted') {
          message = 'Ambos permisos denegados.';
        }

        Toast.show({
          type: 'error',
          text1: 'Permisos incompletos',
          text2: message,
        });
      }
    } catch (error) {
      console.error('[App] ❌ Error solicitando permisos:', error);
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
      text2: 'Puedes activarlos desde Configuración',
    });
  };

  // ==================== BANNER DE PERMISOS ====================
  const PermissionBanner = () => (
    <View style={styles.permissionBanner}>
      <Text style={styles.permissionText}>
        🔔 Para recibir recordatorios y escanear QR necesitamos permisos de notificaciones y cámara
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

  // ==================== BOTÓN FLOTANTE ====================
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
      
      {isAuthenticated && showPermissionBanner && <PermissionBanner />}
      
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
    zIndex: 1000,
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
    zIndex: 999,
  },
  floatingButton: {
    backgroundColor: '#FF9800',
    elevation: 6,
  },
});