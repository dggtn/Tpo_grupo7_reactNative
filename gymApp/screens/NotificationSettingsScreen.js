import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUnreadCount, cancelAllScheduledNotifications } from '../../services/longPollService';

const PERMISSIONS_KEY = '@permissions:status';
const PERMISSIONS_POSTPONED_KEY = '@permissions:postponed';
const TASK_NAME = 'LONG_POLL_TASK_v2';

export default function NotificationSettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [backgroundTaskRegistered, setBackgroundTaskRegistered] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Verificar permisos de notificaciones
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationsEnabled(status === 'granted');

      // Verificar si la tarea está registrada
      const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
      setBackgroundTaskRegistered(isRegistered);

      // Obtener contador de no leídas
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('[NotificationSettings] Error cargando configuración:', error);
    }
  };

  const handleToggleNotifications = async (value) => {
    if (value) {
      // Activar notificaciones
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permisos Requeridos',
          'Para recibir notificaciones, debes habilitar los permisos en la configuración de tu dispositivo.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Abrir Configuración',
              onPress: () => Linking.openSettings(),
            },
          ]
        );
        return;
      }

      await AsyncStorage.setItem(PERMISSIONS_KEY, 'granted');
      await AsyncStorage.removeItem(PERMISSIONS_POSTPONED_KEY);

      // Registrar background task
      try {
        await BackgroundFetch.registerTaskAsync(TASK_NAME, {
          minimumInterval: 15 * 60,
          stopOnTerminate: false,
          startOnBoot: true,
        });
      } catch (e) {
        console.log('[NotificationSettings] Background task ya registrada');
      }

      setNotificationsEnabled(true);
      Alert.alert('Activado', 'Recibirás notificaciones de tus clases');
    } else {
      // Desactivar notificaciones
      Alert.alert(
        'Desactivar Notificaciones',
        '¿Estás seguro? No recibirás recordatorios de tus clases.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Desactivar',
            style: 'destructive',
            onPress: async () => {
              await AsyncStorage.removeItem(PERMISSIONS_KEY);
              await cancelAllScheduledNotifications();
              
              try {
                await BackgroundFetch.unregisterTaskAsync(TASK_NAME);
              } catch (e) {
                console.log('[NotificationSettings] Error desregistrando task');
              }

              setNotificationsEnabled(false);
              Alert.alert('Desactivado', 'Notificaciones desactivadas');
            },
          },
        ]
      );
    }

    await loadSettings();
  };

  const handleTestNotification = async () => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Error', 'Necesitas activar las notificaciones primero');
      return;
    }

    // 1. Notificación inmediata
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🧪 Prueba Inmediata',
        body: 'Esta es una notificación de prueba inmediata',
        data: { type: 'TEST_IMMEDIATE' },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
      },
      trigger: null, // Inmediato
    });

    // 2. Notificación programada para 10 segundos
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Prueba Programada',
        body: 'Esta notificación se programó hace 10 segundos',
        data: { type: 'TEST_SCHEDULED' },
        sound: true,
      },
      trigger: {
        seconds: 10,
      },
    });

    // 3. Verificar eventos en el backend
    const token = await AsyncStorage.getItem('persist:auth');
    let authToken = null;
    if (token) {
      const authData = JSON.parse(token);
      authToken = authData.token ? JSON.parse(authData.token) : null;
    }

    if (authToken) {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.12:8080' || 'http://10.0.2.2:8080';
      
      const response = await fetch(`${API_URL}/notifications/poll`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const result = await response.json();
      const eventCount = result.data?.length || 0;

      Alert.alert(
        '✅ Prueba Enviada',
        `• Notificación inmediata enviada\n` +
        `• Notificación en 10 segundos programada\n` +
        `• Eventos en backend: ${eventCount}`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Enviado', 'Deberías ver 2 notificaciones (una ahora y otra en 10 segundos)');
    }
  } catch (error) {
    console.error('[NotificationSettings] Error en prueba:', error);
    Alert.alert('Error', 'No se pudo enviar la notificación de prueba: ' + error.message);
  }
};

  const handleRefreshStatus = async () => {
    setLoading(true);
    await loadSettings();
    setLoading(false);
  };

  const handleTestBackendEvent = async () => {
  try {
    setLoading(true);
    
    const token = await AsyncStorage.getItem('persist:auth');
    if (!token) {
      Alert.alert('Error', 'No hay sesión activa');
      return;
    }
    
    const authData = JSON.parse(token);
    const authToken = authData.token ? JSON.parse(authData.token) : null;
    
    if (!authToken) {
      Alert.alert('Error', 'Token no válido');
      return;
    }

    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.12:8080' || 'http://10.0.2.2:8080';
    
    // Crear evento de prueba
    const response = await fetch(`${API_URL}/api/test/create-test-event`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      Alert.alert(
        '✅ Evento Creado',
        'Evento de prueba creado en el backend. Espera ~30 segundos y debería aparecer una notificación.',
        [{ text: 'OK' }]
      );
      
      // Hacer polling inmediato
      setTimeout(async () => {
        const pollResponse = await fetch(`${API_URL}/notifications/poll`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });
        
        const result = await pollResponse.json();
        console.log('[Test] Eventos después de crear:', result);
      }, 2000);
    } else {
      Alert.alert('Error', 'No se pudo crear el evento de prueba');
    }
  } catch (error) {
    console.error('[NotificationSettings] Error creando evento:', error);
    Alert.alert('Error', error.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuración</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Notificaciones Push</Text>
            <Text style={styles.settingDescription}>
              Recibe recordatorios 1 hora antes de tus clases
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estado</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Permisos:</Text>
          <Text
            style={[
              styles.infoValue,
              { color: notificationsEnabled ? '#4CAF50' : '#F44336' },
            ]}
          >
            {notificationsEnabled ? 'Otorgados' : 'No otorgados'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tarea en background:</Text>
          <Text
            style={[
              styles.infoValue,
              { color: backgroundTaskRegistered ? '#4CAF50' : '#666' },
            ]}
          >
            {backgroundTaskRegistered ? 'Activa' : 'Inactiva'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Notificaciones sin leer:</Text>
          <Text style={styles.infoValue}>{unreadCount}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones</Text>

        <TouchableOpacity style={styles.button} onPress={handleTestNotification}>
          <Ionicons name="notifications-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Enviar Notificación de Prueba</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={handleRefreshStatus}
          disabled={loading}
        >
          <Ionicons name="refresh-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Actualizar Estado</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tipos de Notificaciones</Text>

        <View style={styles.notificationTypeCard}>
          <Text style={styles.notificationTypeTitle}>
            🔔 Recordatorios de Clase
          </Text>
          <Text style={styles.notificationTypeDesc}>
            Te avisamos 1 hora antes de cada clase inscrita
          </Text>
        </View>

        <View style={styles.notificationTypeCard}>
          <Text style={styles.notificationTypeTitle}>❌ Clases Canceladas</Text>
          <Text style={styles.notificationTypeDesc}>
            Notificación inmediata si se cancela alguna clase
          </Text>
        </View>

        <View style={styles.notificationTypeCard}>
          <Text style={styles.notificationTypeTitle}>
            📅 Clases Reprogramadas
          </Text>
          <Text style={styles.notificationTypeDesc}>
            Aviso cuando se modifica el horario de una clase
          </Text>
        </View>

        <View style={styles.notificationTypeCard}>
          <Text style={styles.notificationTypeTitle}>
            ⏰ Reservas por Expirar
          </Text>
          <Text style={styles.notificationTypeDesc}>
            Te recordamos cuando tu reserva está por vencer
          </Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color="#74C1E6" />
        <Text style={styles.infoBoxText}>
          El sistema verifica nuevos eventos cada 15 minutos en background y cada
          45 segundos cuando la app está abierta.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    marginVertical: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#74C1E6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    gap: 8,
  },
  buttonSecondary: {
    backgroundColor: '#757575',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  notificationTypeCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#74C1E6',
  },
  notificationTypeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notificationTypeDesc: {
    fontSize: 13,
    color: '#666',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(116, 193, 230, 0.1)',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});