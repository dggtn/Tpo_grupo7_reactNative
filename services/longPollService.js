import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.12:8080' || 'http://10.0.2.2:8080';
const POLL_KEY_LAST = '@lp:lastTimestamp';
const NOTIFICATION_ID_PREFIX = '@notif:class:';

/**
 * Obtiene el token de autorización del storage
 */
async function getAuthToken() {
  try {
    const token = await AsyncStorage.getItem('persist:auth');
    if (!token) return null;
    
    const authData = JSON.parse(token);
    const tokenValue = authData.token ? JSON.parse(authData.token) : null;
    
    console.log('[LongPoll] Token encontrado:', !!tokenValue);
    return tokenValue;
  } catch (error) {
    console.error('[LongPoll] Error obteniendo token:', error);
    return null;
  }
}

/**
 * Realiza long polling al endpoint del backend
 * @param {string} userId - ID del usuario (opcional, el backend usa el token)
 * @param {number} timeout - Timeout en ms (por defecto 30s)
 * @returns {Array} Lista de eventos pendientes
 */
export async function fetchLongPollEvents(userId = null, timeout = 30000) {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      console.log('[LongPoll] No hay token, omitiendo polling');
      return [];
    }

    console.log('[LongPoll] Iniciando polling...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${API_URL}/notifications/poll`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // ✅ MEJORADO: Manejar diferentes códigos de error
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('[LongPoll] Error del servidor:', response.status, errorText);
      
      // Si es 401, el token expiró
      if (response.status === 401) {
        console.log('[LongPoll] Token expirado, limpiando sesión');
        await AsyncStorage.removeItem('persist:auth');
      }
      
      return [];
    }

    const result = await response.json();
    
    // ✅ VALIDACIÓN ROBUSTA
    if (!result) {
      console.warn('[LongPoll] Respuesta vacía del servidor');
      return [];
    }

    // El backend devuelve { success: true, data: [...eventos], error: null }
    if (result.success === true) {
      const events = result.data;
      
      if (!Array.isArray(events)) {
        console.warn('[LongPoll] Data no es un array:', typeof events);
        return [];
      }
      
      console.log('[LongPoll] Eventos recibidos:', events.length);
      
      if (events.length > 0) {
        await AsyncStorage.setItem(POLL_KEY_LAST, new Date().toISOString());
      }
      
      return events;
    }

    // Si hay error en la respuesta
    if (result.error) {
      console.error('[LongPoll] Error en respuesta:', result.error);
    }

    return [];
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('[LongPoll] Timeout alcanzado (esperado)');
    } else if (error.message?.includes('Network')) {
      console.warn('[LongPoll] Error de red:', error.message);
    } else {
      console.error('[LongPoll] Error en polling:', error.message);
    }
    return [];
  }
}

/**
 * Programa una notificación local para recordatorio de clase (1h antes)
 * @param {number} classId - ID de la clase/shift
 * @param {string} classStartAt - ISO timestamp de inicio de clase
 * @param {string} title - Título de la notificación
 * @param {string} body - Cuerpo de la notificación
 */
export async function scheduleClassReminder(classId, classStartAt, title, body) {
  try {
    const startDate = new Date(classStartAt);
    const reminderDate = new Date(startDate.getTime() - 60 * 60 * 1000); // 1h antes
    const now = new Date();

    // Solo programar si el recordatorio es futuro
    if (reminderDate <= now) {
      console.log('[LongPoll] Recordatorio en el pasado, omitiendo:', classId);
      return;
    }

    // Cancelar notificación previa de esta clase (si existe)
    await cancelScheduledNotificationForClass(classId);

    // Guardar el ID de la notificación para poder cancelarla después
    const notificationId = `class_${classId}`;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title || '¡Clase en 1 hora!',
        body: body || 'No olvides asistir a tu clase',
        data: { classId, type: 'CLASS_REMINDER' },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        date: reminderDate,
      },
      identifier: notificationId,
    });

    // Guardar referencia en AsyncStorage
    await AsyncStorage.setItem(
      `${NOTIFICATION_ID_PREFIX}${classId}`,
      notificationId
    );

    console.log('[LongPoll] Recordatorio programado para:', reminderDate.toISOString(), 'classId:', classId);
  } catch (error) {
    console.error('[LongPoll] Error programando recordatorio:', error);
  }
}

/**
 * Cancela la notificación programada de una clase específica
 * @param {number} classId - ID de la clase/shift
 */
export async function cancelScheduledNotificationForClass(classId) {
  try {
    const notificationId = await AsyncStorage.getItem(
      `${NOTIFICATION_ID_PREFIX}${classId}`
    );

    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await AsyncStorage.removeItem(`${NOTIFICATION_ID_PREFIX}${classId}`);
      console.log('[LongPoll] Notificación cancelada para clase:', classId);
    }
  } catch (error) {
    console.error('[LongPoll] Error cancelando notificación:', error);
  }
}

/**
 * Cancela todas las notificaciones programadas
 */
export async function cancelAllScheduledNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Limpiar referencias en AsyncStorage
    const keys = await AsyncStorage.getAllKeys();
    const notificationKeys = keys.filter(key => key.startsWith(NOTIFICATION_ID_PREFIX));
    
    if (notificationKeys.length > 0) {
      await AsyncStorage.multiRemove(notificationKeys);
    }
    
    console.log('[LongPoll] Todas las notificaciones canceladas');
  } catch (error) {
    console.error('[LongPoll] Error cancelando todas las notificaciones:', error);
  }
}

/**
 * Marca eventos como leídos en el backend
 * @param {Array<number>} eventIds - Array de IDs de eventos
 */
export async function markEventsAsRead(eventIds) {
  try {
    if (!eventIds || eventIds.length === 0) return;

    const token = await getAuthToken();
    if (!token) return;

    console.log('[LongPoll] Marcando como leídos:', eventIds.length, 'eventos');

    const response = await fetch(`${API_URL}/notifications/mark-read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ eventIds }),
    });

    if (response.ok) {
      console.log('[LongPoll] Eventos marcados como leídos exitosamente');
    } else {
      const errorText = await response.text().catch(() => '');
      console.warn('[LongPoll] Error marcando como leídos:', response.status, errorText);
    }
  } catch (error) {
    console.error('[LongPoll] Error marcando eventos como leídos:', error.message);
  }
}
/**
 * Obtiene el contador de notificaciones no leídas
 * @returns {Promise<number>}
 */
export async function getUnreadCount() {
  try {
    const token = await getAuthToken();
    if (!token) return 0;

    const response = await fetch(`${API_URL}/notifications/unread-count`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) return 0;

    const result = await response.json();
    return result.success ? (result.data || 0) : 0;
  } catch (error) {
    console.error('[LongPoll] Error obteniendo contador:', error);
    return 0;
  }
}

/**
 * Procesa un evento del backend y muestra notificación local si corresponde
 * @param {Object} event - Evento del backend
 */
export async function processEvent(event) {
  try {
    const settings = await Notifications.getPermissionsAsync();
    const notifGranted = settings.granted || settings.status === 'granted';

    if (!notifGranted) {
      console.log('[LongPoll] Sin permisos de notificación, omitiendo evento');
      return;
    }

    const { eventType, title, message, relatedShiftId, relatedCourseId, metadata } = event;
    let parsedMetadata = {};
    
    try {
      parsedMetadata = metadata ? JSON.parse(metadata) : {};
    } catch (e) {
      console.warn('[LongPoll] Error parseando metadata:', e);
    }

    console.log('[LongPoll] Procesando evento:', eventType);

    switch (eventType) {
      case 'CLASS_REMINDER':
        // Ya programado previamente, no hacer nada
        break;

      case 'ENROLLMENT_CONFIRMED':
      case 'RESERVATION_CONFIRMED':
        // Programar recordatorio si hay classStartAt en metadata
        if (parsedMetadata.classTime && relatedShiftId) {
          await scheduleClassReminder(
            relatedShiftId,
            parsedMetadata.classTime,
            title,
            message
          );
        }
        // Mostrar notificación inmediata también
        await showImmediateNotification(title, message, event);
        break;

      case 'CLASS_CANCELLED':
        // Cancelar recordatorio programado
        if (relatedShiftId) {
          await cancelScheduledNotificationForClass(relatedShiftId);
        }
        await showImmediateNotification(title, message, event);
        break;

      case 'CLASS_RESCHEDULED':
        // Cancelar y reprogramar
        if (relatedShiftId) {
          await cancelScheduledNotificationForClass(relatedShiftId);
          if (parsedMetadata.classTime) {
            await scheduleClassReminder(
              relatedShiftId,
              parsedMetadata.classTime,
              'Clase reprogramada - recordatorio',
              message
            );
          }
        }
        await showImmediateNotification(title, message, event);
        break;

      case 'RESERVATION_EXPIRING':
      case 'RESERVATION_EXPIRED':
      case 'ENROLLMENT_CANCELLED':
        await showImmediateNotification(title, message, event);
        break;

      default:
        // Evento genérico
        await showImmediateNotification(title || 'Notificación', message, event);
    }

  } catch (error) {
    console.error('[LongPoll] Error procesando evento:', error);
  }
}

/**
 * Muestra una notificación inmediata
 */
async function showImmediateNotification(title, body, data) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
      },
      trigger: null, // Inmediato
    });
    console.log('[LongPoll] Notificación inmediata mostrada');
  } catch (error) {
    console.error('[LongPoll] Error mostrando notificación:', error);
  }
}