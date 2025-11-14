import AsyncStorage from "@react-native-async-storage/async-storage";

const API = process.env.EXPO_PUBLIC_API_URL;

async function authHeaders() {
  const token = await AsyncStorage.getItem("authToken"); 
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function crearReserva(idShift) {
  const res = await fetch(`${API}/reservations/reservar`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ idShift }),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data?.data ?? data; 
}

export async function cancelarReservaPorShift(shiftId) {
  const res = await fetch(`${API}/reservations/cancelar/${shiftId}`, {
    method: "DELETE",
    headers: { ...(await authHeaders()) },
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data?.data ?? data;
}

export async function misReservasConEstado() {
  const res = await fetch(`${API}/reservations/status`, {
    headers: { ...(await authHeaders()) },
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data?.data ?? data; 
}

async function safeJson(res) {
  try { return await res.json(); } catch { return null; }
}
