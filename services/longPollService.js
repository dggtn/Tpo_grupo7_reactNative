import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../config/constants';

const API_URL = API_BASE_URL;
const POLL_KEY_LAST = '@lp:lastTimestamp';
const NOTIFICATION_ID_PREFIX = '@notif:class:';
const EVENT_IDS_PROCESSED = '@lp:processedEventIds';

/**
 * Obtiene el token de autorización del storage
 */
async function getAuthToken() {
  try {
    const token = await AsyncStorage.getItem('persist:auth');
    if (!token) return null;
    
    const authData = JSON.parse(token);
    const tokenValue = authData.token ? JSON.parse(authData.token) : null;
    
    return tokenValue;
  } catch (error) {
    console.error('[LongPoll] Error obteniendo token:', error);
    return null;
  }
}

/**
 * Guarda IDs de eventos procesados para evitar duplicados
 */
async function markEventAsProcessed(eventId) {
  try {
    const stored = await AsyncStorage.getItem(EVENT_IDS_PROCESSED);
    const processedIds = stored ? JSON.parse(stored) : [];
    
    const updated = [...new Set([...processedIds, eventId])].slice(-100);
    await AsyncStorage.setItem(EVENT_IDS_PROCESSED, JSON.stringify(updated));
  } catch (error) {
    console.error('[LongPoll] Error guardando evento procesado:', error);
  }
}

/**
 * Verifica si un evento ya fue procesado
 */
async function isEventProcessed(eventId) {
  try {
    const stored = await AsyncStorage.getItem(EVENT_IDS_PROCESSED);
    const processedIds = stored ? JSON.parse(stored) : [];
    return processedIds.includes(eventId);
  } catch (error) {
    console.error('[LongPoll] Error verificando evento:', error);
    return false;
  }
}

/**
 * ✅ Verifica permisos reales de notificación
 */
async function checkNotificationPermissions() {
  try {
    const settings = await Notifications.getPermissionsAsync();
    const granted = settings.granted || settings.status === 'granted';
    
    if (!granted) {
      console.warn('[LongPoll] ⚠️ Permisos NO otorgados:', settings.status);
    }
    
    return granted;
  } catch (error) {
    console.error('[LongPoll] ❌ Error verificando permisos:', error);
    return false;
  }
}

/**
 * Realiza long polling al endpoint del backend
 */
export async function fetchLongPollEvents(userId = null, timeout = 30000) {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      console.log('[LongPoll] ⚠️ No hay token, omitiendo polling');
      return [];
    }

    console.log('[LongPoll] 🔄 Iniciando polling...');
    
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

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('[LongPoll] ❌ Error del servidor:', response.status, errorText);
      
      if (response.status === 401) {
        console.log('[LongPoll] 🔒 Token expirado');
        await AsyncStorage.removeItem('persist:auth');
      }
      
      return [];
    }

    const result = await response.json();
    
    if (!result || result.ok !== true) {
      console.warn('[LongPoll] ⚠️ Respuesta no exitosa:', result);
      return [];
    }

    const events = result.data;
    
    if (!Array.isArray(events)) {
      console.warn('[LongPoll] ⚠️ Data no es un array:', typeof events);
      return [];
    }
    
    // Filtrar eventos ya procesados
    const newEvents = [];
    for (const event of events) {
      if (event.id) {
        const processed = await isEventProcessed(event.id);
        if (!processed) {
          newEvents.push(event);
        }
      } else {
        newEvents.push(event);
      }
    }
    
    console.log(`[LongPoll] ✅ Eventos recibidos: ${events.length} | Nuevos: ${newEvents.length}`);
    
    if (newEvents.length > 0) {
      await AsyncStorage.setItem(POLL_KEY_LAST, new Date().toISOString());
    }
    
    return newEvents;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('[LongPoll] ⏱️ Timeout alcanzado (normal)');
    } else if (error.message?.includes('Network')) {
      console.warn('[LongPoll] 📡 Error de red');
    } else {
      console.error('[LongPoll] ❌ Error:', error.message);
    }
    return [];
  }
}

/**
 * Programa una notificación para recordatorio de clase
 */
export async function scheduleClassReminder(classId, classStartAt, title, body) {
  try {
    const hasPermission = await checkNotificationPermissions();
    if (!hasPermission) {
      console.warn('[LongPoll] 🚫 Sin permisos, no se puede programar recordatorio');
      return;
    }

    if (!classStartAt) {
      console.warn('[LongPoll] ⚠️ Sin fecha de inicio para clase:', classId);
      return;
    }

    const startDate = new Date(classStartAt);
    
    if (isNaN(startDate.getTime())) {
      console.error('[LongPoll] ❌ Fecha inválida:', classStartAt);
      return;
    }

    const reminderDate = new Date(startDate.getTime() - 60 * 60 * 1000);
    const now = new Date();

    if (reminderDate <= now) {
      console.log('[LongPoll] ⏭️ Recordatorio en el pasado, omitiendo:', classId);
      return;
    }

    await cancelScheduledNotificationForClass(classId);

    const notificationId = `class_${classId}`;
    
    const content = {
      title: title || '🔔 Clase en 1 hora',
      body: body || 'Tu clase está próxima a comenzar',
      data: { classId, type: 'CLASS_REMINDER' },
      sound: true,
    };

    if (Platform.OS === 'android') {
      content.priority = Notifications.AndroidNotificationPriority.HIGH;
      content.channelId = 'default';
    }
    
    const scheduledId = await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        date: reminderDate,
      },
      identifier: notificationId,
    });

    await AsyncStorage.setItem(
      `${NOTIFICATION_ID_PREFIX}${classId}`,
      scheduledId
    );

    console.log(`[LongPoll] ⏰ Recordatorio programado para: ${reminderDate.toLocaleString('es-AR')}`);
    console.log(`[LongPoll] 🆔 Notification ID: ${scheduledId}`);
  } catch (error) {
    console.error('[LongPoll] ❌ Error programando recordatorio:', error);
  }
}

/**
 * Cancela la notificación programada de una clase específica
 */
export async function cancelScheduledNotificationForClass(classId) {
  try {
    const notificationId = await AsyncStorage.getItem(
      `${NOTIFICATION_ID_PREFIX}${classId}`
    );

    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await AsyncStorage.removeItem(`${NOTIFICATION_ID_PREFIX}${classId}`);
      console.log('[LongPoll] 🗑️ Notificación cancelada para clase:', classId);
    }
  } catch (error) {
    console.error('[LongPoll] ❌ Error cancelando notificación:', error);
  }
}

/**
 * Cancela todas las notificaciones programadas
 */
export async function cancelAllScheduledNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    const keys = await AsyncStorage.getAllKeys();
    const notificationKeys = keys.filter(key => key.startsWith(NOTIFICATION_ID_PREFIX));
    
    if (notificationKeys.length > 0) {
      await AsyncStorage.multiRemove(notificationKeys);
    }
    
    console.log('[LongPoll] 🗑️ Todas las notificaciones canceladas');
  } catch (error) {
    console.error('[LongPoll] ❌ Error cancelando notificaciones:', error);
  }
}

/**
 * Marca eventos como leídos en el backend
 */
export async function markEventsAsRead(eventIds) {
  try {
    if (!eventIds || eventIds.length === 0) return;

    const token = await getAuthToken();
    if (!token) return;

    console.log('[LongPoll] 📝 Marcando como leídos:', eventIds.length, 'eventos');

    const response = await fetch(`${API_URL}/notifications/mark-read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ eventIds }),
    });

    if (response.ok) {
      console.log('[LongPoll] ✅ Eventos marcados como leídos');
    } else {
      console.warn('[LongPoll] ⚠️ Error marcando:', response.status);
    }
  } catch (error) {
    console.error('[LongPoll] ❌ Error marcando eventos:', error.message);
  }
}

/**
 * Obtiene el contador de notificaciones no leídas
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
    return result.ok ? (result.data || 0) : 0;
  } catch (error) {
    console.error('[LongPoll] ❌ Error obteniendo contador:', error);
    return 0;
  }
}

/**
 * Procesa un evento del backend y muestra notificación
 */
export async function processEvent(event) {
  try {
    if (event.id) {
      const processed = await isEventProcessed(event.id);
      if (processed) {
        console.log('[LongPoll] ⏭️ Evento ya procesado:', event.id);
        return;
      }
    }

    const hasPermission = await checkNotificationPermissions();
    if (!hasPermission) {
      console.warn('[LongPoll] 🚫 Sin permisos, evento ignorado:', event.eventType);
      return;
    }

    const { eventType, title, message, relatedShiftId, metadata } = event;
    let parsedMetadata = {};
    
    try {
      parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata || {};
    } catch (e) {
      console.warn('[LongPoll] ⚠️ Error parseando metadata:', e);
    }

    console.log(`[LongPoll] 📨 Procesando: ${eventType}`);
    console.log(`[LongPoll] 🆔 Shift ID: ${relatedShiftId}`);

    switch (eventType) {
      case 'ENROLLMENT_CONFIRMED':
      case 'RESERVATION_CONFIRMED':
        console.log('[LongPoll] ✅ Confirmación de inscripción/reserva');
        
        const classTime = parsedMetadata.classTime || parsedMetadata.fechaClase || parsedMetadata.classStartAt;
        
        if (classTime && relatedShiftId) {
          await scheduleClassReminder(
            relatedShiftId,
            classTime,
            '🔔 Recordatorio de clase',
            `Tu clase comienza en 1 hora: ${title || 'Clase programada'}`
          );
        }
        
        await showImmediateNotification(
          title || '✅ Inscripción confirmada',
          message || 'Tu reserva fue confirmada exitosamente',
          event
        );
        break;

      case 'CLASS_CANCELLED':
        console.log('[LongPoll] ❌ Clase cancelada');
        
        if (relatedShiftId) {
          await cancelScheduledNotificationForClass(relatedShiftId);
        }
        
        await showImmediateNotification(
          title || '❌ Clase cancelada',
          message || 'Tu clase ha sido cancelada',
          event
        );
        break;

      case 'CLASS_RESCHEDULED':
        console.log('[LongPoll] 📅 Clase reprogramada');
        
        if (relatedShiftId) {
          await cancelScheduledNotificationForClass(relatedShiftId);
          
          const newClassTime = parsedMetadata.classTime || parsedMetadata.nuevaFecha;
          if (newClassTime) {
            await scheduleClassReminder(
              relatedShiftId,
              newClassTime,
              '📅 Clase reprogramada',
              `Nueva fecha: ${message || 'Ver detalles en la app'}`
            );
          }
        }
        
        await showImmediateNotification(
          title || '📅 Clase reprogramada',
          message || 'Tu clase fue reprogramada',
          event
        );
        break;

      case 'CLASS_REMINDER':
        console.log('[LongPoll] ⏰ Recordatorio automático');
        await showImmediateNotification(
          title || '🔔 Recordatorio',
          message || 'Tu clase comienza pronto',
          event
        );
        break;

      case 'RESERVATION_EXPIRING':
      case 'RESERVATION_EXPIRED':
      case 'ENROLLMENT_CANCELLED':
        console.log('[LongPoll] ⚠️ Evento de estado:', eventType);
        await showImmediateNotification(title, message, event);
        break;

      default:
        console.log('[LongPoll] 📨 Evento genérico:', eventType);
        await showImmediateNotification(
          title || '📬 Notificación',
          message || 'Tienes una novedad',
          event
        );
    }

    if (event.id) {
      await markEventAsProcessed(event.id);
      console.log('[LongPoll] ✅ Evento marcado como procesado:', event.id);
    }

  } catch (error) {
    console.error('[LongPoll] ❌ Error procesando evento:', error);
  }
}

/**
 * ✅ VERSIÓN MEJORADA: Muestra notificación con configuración completa
 */
async function showImmediateNotification(title, body, data) {
  try {
    console.log('[LongPoll] ═══════════════════════════════════════');
    console.log('[LongPoll] 🔔 PREPARANDO NOTIFICACIÓN INMEDIATA');
    console.log('[LongPoll] 📝 Título:', title);
    console.log('[LongPoll] 💬 Cuerpo:', body);
    console.log('[LongPoll] 📦 Data:', JSON.stringify(data));

    const hasPermission = await checkNotificationPermissions();
    if (!hasPermission) {
      console.error('[LongPoll] 🚫 BLOQUEADO: Sin permisos de notificación');
      console.log('[LongPoll] ═══════════════════════════════════════');
      return;
    }

    console.log('[LongPoll] ✅ Permisos OK');

    // ✅ CONFIGURACIÓN SIMPLIFICADA QUE FUNCIONA
    const content = {
      title: String(title || 'Notificación'),
      body: String(body || ''),
      data: data || {},
      sound: true,
    };

    // ✅ Configuración específica de Android
    if (Platform.OS === 'android') {
      content.priority = Notifications.AndroidNotificationPriority.HIGH;
      content.channelId = 'default';
      console.log('[LongPoll] 📱 Plataforma: Android');
      console.log('[LongPoll] 📡 Canal: default');
      console.log('[LongPoll] ⚡ Prioridad: HIGH');
    }

    console.log('[LongPoll] 📤 ENVIANDO NOTIFICACIÓN...');
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content,
      trigger: null, // Inmediato
    });

    console.log('[LongPoll] ✅ ¡NOTIFICACIÓN ENVIADA!');
    console.log('[LongPoll] 🆔 ID de notificación:', notificationId);
    console.log('[LongPoll] ═══════════════════════════════════════');
  } catch (error) {
    console.error('[LongPoll] ═══════════════════════════════════════');
    console.error('[LongPoll] ❌ ERROR CRÍTICO AL MOSTRAR NOTIFICACIÓN');
    console.error('[LongPoll] 📛 Error:', error.message);
    console.error('[LongPoll] 📚 Stack:', error.stack);
    console.error('[LongPoll] ═══════════════════════════════════════');
  }
}