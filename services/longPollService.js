// Servicio auxiliar (puede usarse desde pantallas y desde la tarea background) para:
// - gestionar lastTimestamp
// - fetch de events (long-poll)
// - programar/cancelar recordatorios locales 1h antes de clase
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../config/constants';

const POLL_KEY_LAST = '@lp:lastTimestamp';
const BACKEND_URL = (process.env.BACKEND_URL || API_BASE_URL).replace(/\/$/, '');
// mapeo en storage para notifs programadas: JSON { [classId]: notificationId }
const SCHEDULED_NOTIFS_KEY = '@lp:scheduledNotifs';

// util: leer storage mapeo notifs
async function _readScheduledMap() {
  const s = await AsyncStorage.getItem(SCHEDULED_NOTIFS_KEY);
  return s ? JSON.parse(s) : {};
}
async function _writeScheduledMap(m) {
  await AsyncStorage.setItem(SCHEDULED_NOTIFS_KEY, JSON.stringify(m));
}

export async function fetchLongPollEvents(userId, timeoutMs = 35000) {
  const sinceStr = await AsyncStorage.getItem(POLL_KEY_LAST);
  const since = sinceStr ? Number(sinceStr) : 0;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/longpoll/events?userId=${encodeURIComponent(userId)}&since=${since}`,
      {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      }
    );
    clearTimeout(timeout);
    if (!res.ok) return [];
    const events = await res.json();
    if (events.length) {
      const maxTs = events.reduce((m, e) => Math.max(m, e.createdAt || 0), since);
      await AsyncStorage.setItem(POLL_KEY_LAST, String(maxTs));
    }
    return events;
  } catch (e) {
    clearTimeout(timeout);
    return [];
  }
}

export async function setLastTimestamp(ts) {
  await AsyncStorage.setItem(POLL_KEY_LAST, String(ts));
}
export async function getLastTimestamp() {
  const s = await AsyncStorage.getItem(POLL_KEY_LAST);
  return s ? Number(s) : 0;
}

/**
 * scheduleClassReminder
 * - classId: identificador de la clase (único por inscripción)
 * - classStartISO: ISO string o timestamp en ms (fecha/hora de inicio de la clase)
 * - title / body: texto opcional
 *
 * Computa recordatorio 1 hora antes; si esa hora ya pasó, dispara notificación inmediata.
 * Guarda el notificationId en AsyncStorage para poder cancelarlo luego.
 */
export async function scheduleClassReminder(classId, classStartISO, title, body) {
  try {
    const startTs = typeof classStartISO === 'string' ? Date.parse(classStartISO) : Number(classStartISO);
    if (!startTs || Number.isNaN(startTs)) {
      console.warn('scheduleClassReminder: start time inválido', classStartISO);
      return null;
    }
    const reminderTs = startTs - 60 * 60 * 1000; // 1 hora antes
    const now = Date.now();

    // cancelar notificación previa si existía (evitamos duplicados)
    await cancelScheduledNotificationForClass(classId);

    if (reminderTs <= now) {
      // Ya pasó la hora del recordatorio: enviar inmediata
      const nid = await Notifications.scheduleNotificationAsync({
        content: {
          title: title || 'Recordatorio: clase en menos de 1 hora',
          body: body || 'Tu clase está empezando pronto.',
          data: { classId, scheduledFor: reminderTs },
        },
        trigger: null,
      });
      // No la guardamos como programada futura (porque ya se disparó), pero por coherencia la guardamos para permitir cancelaciones posteriores
      const map = await _readScheduledMap();
      map[classId] = nid;
      await _writeScheduledMap(map);
      return nid;
    } else {
      let trigger;
      if (Platform.OS === 'android') {
        // trigger con timestamp en segundos en expo -> Date
        trigger = new Date(reminderTs);
      } else {
        trigger = new Date(reminderTs);
      }
      const nid = await Notifications.scheduleNotificationAsync({
        content: {
          title: title || 'Recordatorio: clase dentro de 1 hora',
          body: body || 'Tu clase empezará en una hora.',
          data: { classId, scheduledFor: reminderTs },
        },
        trigger,
      });
      const map = await _readScheduledMap();
      map[classId] = nid;
      await _writeScheduledMap(map);
      return nid;
    }
  } catch (e) {
    console.warn('Error scheduleClassReminder', e);
    return null;
  }
}

/**
 * cancelScheduledNotificationForClass
 * - borra la notificación programada asociada al classId y la remueve del map
 */
export async function cancelScheduledNotificationForClass(classId) {
  try {
    const map = await _readScheduledMap();
    const nid = map[classId];
    if (nid) {
      try {
        await Notifications.cancelScheduledNotificationAsync(nid);
      } catch (e) {
        // puede fallar si ya se disparó o si el id es inválido -> no rompa el flow
        console.warn('cancelScheduledNotificationForClass: error cancelando', e);
      }
      delete map[classId];
      await _writeScheduledMap(map);
      return true;
    }
    return false;
  } catch (e) {
    console.warn('cancelScheduledNotificationForClass err', e);
    return false;
  }
}

/**
 * cancelAllScheduledNotificationsManagedByApp
 * - útil en casos de logout para limpiar storage
 */
export async function cancelAllScheduledNotificationsManagedByApp() {
  try {
    const map = await _readScheduledMap();
    const ids = Object.values(map);
    for (const nid of ids) {
      try {
        await Notifications.cancelScheduledNotificationAsync(nid);
      } catch (e) {
        // ignore
      }
    }
    await _writeScheduledMap({});
    return true;
  } catch (e) {
    console.warn('cancelAll.. err', e);
    return false;
  }
}
