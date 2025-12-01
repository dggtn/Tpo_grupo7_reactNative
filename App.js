import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import {
  ActivityIndicator,
  View,
  StyleSheet,
  LogBox,
  Button,
  Text,
  Platform,
} from 'react-native';
import { PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

import { store, persistor } from './store/store';
import RootNavigator from './navigation/RootNavigator';
import ErrorBoundary from './gymApp/components/ErrorBoundary';
import { toastConfig } from './config/toastConfig';

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

/**
 * Configuration
 * - Usa Constants.manifest.extra.BACKEND_URL si está presente en app.json
 * - Si no, se puede configurar aquí como fallback.
 */
const BACKEND_URL =
  Constants.manifest?.extra?.BACKEND_URL ||
  process.env.BACKEND_URL ||
  'http://10.0.2.2:8080'; // por defecto para desarrollo en emulador Android

const TASK_NAME = 'LONG_POLL_TASK_v1';
const POLL_KEY_LAST = '@lp:lastTimestamp';
const USER_ID_KEY = '@user:id'; // debe establecerse al autenticarse

// Definición de la tarea de background para long-polling
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const userId = await AsyncStorage.getItem(USER_ID_KEY);
    if (!userId) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const sinceStr = await AsyncStorage.getItem(POLL_KEY_LAST);
    const since = sinceStr ? Number(sinceStr) : 0;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000); // 35s
    let res;
    try {
      res = await fetch(
        `${BACKEND_URL.replace(/\/$/, '')}/api/longpoll/events?userId=${encodeURIComponent(
          userId
        )}&since=${since}`,
        {
          method: 'GET',
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        }
      );
    } catch (e) {
      clearTimeout(timeout);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
    clearTimeout(timeout);

    if (!res.ok) {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    const events = await res.json();
    if (Array.isArray(events) && events.length > 0) {
      // actualizar timestamp al máximo de events para la próxima consulta
      const maxTs = events.reduce((m, e) => Math.max(m, e.createdAt || 0), since);
      await AsyncStorage.setItem(POLL_KEY_LAST, String(maxTs));

      // enviar notificaciones locales
      for (const ev of events) {
        let title = 'Novedad de clase';
        let body = ev.message || 'Cambio en tu inscripción';
        if (ev.type === 'REMINDER') {
          title = 'Recordatorio: clase en 1 hora';
        } else if (ev.type === 'RESCHEDULE') {
          title = 'Clase reprogramada';
        } else if (ev.type === 'CANCEL') {
          title = 'Clase cancelada';
        }
        try {
          await Notifications.scheduleNotificationAsync({
            content: { title, body, data: ev },
            trigger: null, // inmediata
          });
        } catch (notifErr) {
          // No queremos que un fallo en notificaciones rompa todo
          console.log('Error scheduling notification', notifErr);
        }
      }
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } else {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
  } catch (err) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [permissionsPostponed, setPermissionsPostponed] = useState(false);
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);

  useEffect(() => {
    // configuración de notificaciones en foreground (comportamiento de visualización)
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    // registrar la tarea background (intento)
    (async () => {
      try {
        await BackgroundFetch.registerTaskAsync(TASK_NAME, {
          minimumInterval: 15 * 60, // 15 minutos (sujeto a políticas SO)
          stopOnTerminate: false,
          startOnBoot: true,
        });
      } catch (e) {
        // ya registrado u otro error: lo ignoramos para que la app siga funcionando
        console.log('Background fetch register error:', e);
      }
    })();
  }, []);

  useEffect(() => {
    // guarda userId y dispara el prompt visual (banner) justo después de autenticarse
    if (authenticated && userId) {
      AsyncStorage.setItem(USER_ID_KEY, userId);
      // mostrar banner para aceptar o posponer permisos
      setShowPermissionBanner(true);

      // mostrar toast informativo (no reemplaza la necesidad de que el usuario acepte o posponga)
      Toast.show({
        type: 'info',
        text1: 'Permisos necesarios',
        text2: 'La app necesita permiso para notificaciones y cámara. Puedes aceptar ahora o posponer.',
        visibilityTime: 6000,
      });
    }
  }, [authenticated, userId]);

  const fakeLogin = async () => {
    // sustituir por login real; aquí guardamos un userId de ejemplo
    const uid = 'user-123';
    setUserId(uid);
    setAuthenticated(true);
  };

  const postponePermissions = () => {
    setPermissionsPostponed(true);
    setShowPermissionBanner(false);
    Toast.show({
      type: 'info',
      text1: 'Permisos pospuestos',
      text2: 'Puedes activarlos desde Ajustes o desde el botón "Solicitar permisos ahora".',
    });
  };

  const requestPermissions = async () => {
    try {
      // Notificaciones
      const { status: notifStatus } = await Notifications.requestPermissionsAsync();

      if (notifStatus !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permiso notificaciones',
          text2: 'No se otorgó permiso para notificaciones. Puedes activarlo desde ajustes.',
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Permiso notificaciones otorgado',
        });
      }

      setPermissionsPostponed(false);
      setShowPermissionBanner(false);
    } catch (e) {
      console.log('Error pidiendo permisos:', e);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Ocurrió un error solicitando permisos.',
      });
    }
  };

  // Polling ligero en foreground: cada 30s (activo con la app en foreground)
  const startForegroundPolling = async () => {
    const uid = await AsyncStorage.getItem(USER_ID_KEY);
    if (!uid) return;
    const interval = setInterval(async () => {
      try {
        const sinceStr = await AsyncStorage.getItem(POLL_KEY_LAST);
        const since = sinceStr ? Number(sinceStr) : 0;
        const res = await fetch(
          `${BACKEND_URL.replace(/\/$/, '')}/api/longpoll/events?userId=${encodeURIComponent(uid)}&since=${since}`,
          { method: 'GET' }
        );
        if (res.ok) {
          const events = await res.json();
          if (Array.isArray(events) && events.length > 0) {
            const maxTs = events.reduce((m, e) => Math.max(m, e.createdAt || 0), since);
            await AsyncStorage.setItem(POLL_KEY_LAST, String(maxTs));
            for (const ev of events) {
              await Notifications.scheduleNotificationAsync({
                content: { title: ev.type === 'REMINDER' ? 'Recordatorio: 1h' : ev.type, body: ev.message || '' },
                trigger: null,
              });
            }
          }
        }
      } catch (e) {
        // ignore errors silently
      }
    }, 30 * 1000);

    // limpiar en 30 minutos si no se cancela explícitamente (seguro)
    setTimeout(() => clearInterval(interval), 30 * 60 * 1000);
  };

  // Banner pequeño para solicitar permisos después del login
  const PermissionBanner = () => (
    <View style={styles.permissionBanner}>
      <Text style={styles.permissionText}>La app necesita permisos para notificaciones y cámara.</Text>
      <View style={styles.bannerButtons}>
        <Button title="Aceptar" onPress={requestPermissions} />
        <View style={styles.buttonSpacer} />
        <Button title="Posponer" onPress={postponePermissions} />
      </View>
    </View>
  );

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
            <View style={{ flex: 1 }}>
              <RootNavigator />
              {/* Muestra el banner de permisos sólo cuando corresponde */}
              {authenticated && showPermissionBanner ? <PermissionBanner /> : null}
              {/* Botón demo para iniciar polling en foreground */}
              {authenticated ? (
                <View style={styles.demoButtonContainer}>
                  <Button title="Iniciar polling en foreground (demo)" onPress={startForegroundPolling} />
                </View>
              ) : (
                // botón demo de login para propósitos de testing
                <View style={styles.loginDemo}>
                  <Button title="Ingresar (demo)" onPress={fakeLogin} />
                </View>
              )}
              <Toast config={toastConfig} />
            </View>
          </PaperProvider>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#faf7f7ff',
  },
  permissionBanner: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: Platform.OS === 'ios' ? 90 : 80,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  permissionText: {
    marginBottom: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  bannerButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonSpacer: {
    width: 12,
  },
  demoButtonContainer: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
  },
  loginDemo: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
  },
});