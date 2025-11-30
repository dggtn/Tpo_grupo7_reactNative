// Servicio auxiliar (puede usarse desde pantallas) para gestionar lastTimestamp y fetch
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/constants';
const POLL_KEY_LAST = '@lp:lastTimestamp';
const BACKEND_URL = (process.env.BACKEND_URL || API_BASE_URL).replace(/\/$/, '');

export async function fetchLongPollEvents(userId) {
  const sinceStr = await AsyncStorage.getItem(POLL_KEY_LAST);
  const since = sinceStr ? Number(sinceStr) : 0;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35000);
  try {
    const res = await fetch(`${BACKEND_URL}/api/longpoll/events?userId=${encodeURIComponent(userId)}&since=${since}`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
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