// gymApp/screens/MisReservasScreen.js
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { Button } from "react-native-paper";
import { useSelector } from "react-redux";
import { selectToken } from "../../store/slices/authSlice";
import { API_BASE_URL } from '../config/constants';

const API_URL = API_BASE_URL;

// --- helpers ---
async function safeJson(res) {
  try {
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return null;
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function MisReservasScreen() {
  const token = useSelector(selectToken);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState(null);
  

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/reservations/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = await safeJson(res);

      if (!res.ok) throw new Error(payload?.message || `Error ${res.status}`);

      let lista = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : [];

      lista = lista.filter(r => (r?.estadoReserva || "").toUpperCase() !== "ASISTIO");

      console.log("Reservas:", JSON.stringify(lista, null, 2));

      setItems(lista);
    } catch (e) {
      const msg = (e?.message || "").toLowerCase();
    
      // 👉 Si el back dice que no hay reservas, NO lo trato como error visible
      if (!msg.includes("no hay reservas")) {
        Alert.alert("Reservas", e.message || "No se pudo cargar tus reservas");
      }
    
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const cancelar = async (shiftId) => {
    if (!token) {
      Alert.alert("Reserva", "Sesión no válida. Volvé a iniciar sesión.");
      return;
    }
  
    try {
      setCancelingId(shiftId);  // 👈 empieza el “loading” para ese turno
  
      const res = await fetch(`${API_URL}/reservations/cancelar/${shiftId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
  
      const payload = await safeJson(res);
      if (!res.ok) throw new Error(payload?.message || `Error ${res.status}`);
  
      Alert.alert("Reserva", "Reserva cancelada.");
      await load();             // refrescamos listado
    } catch (e) {
      Alert.alert("Reserva", e.message || "No se pudo cancelar la reserva");
    } finally {
      setCancelingId(null);     // 👈 se apaga el “loading”
    }
  };
  

  if (loading && items.length === 0) {
    return <ActivityIndicator style={{ marginTop: 24 }} />;
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(it, idx) => String(it?.reservationId ?? idx)}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      renderItem={({ item }) => {
        const shiftId = item?.shiftId;
        const isCancelingThis = cancelingId === shiftId;  // 👈 está cancelando justo este
      
        return (
          <View style={{ padding: 12, borderBottomWidth: 1, borderColor: "#eee" }}>
            <Text style={{ fontWeight: "600" }}>{item?.nombreCurso ?? "Curso"}</Text>
            <Text>
              Turno: #{shiftId} • Estado: {item?.estadoReserva ?? "N/D"}
            </Text>
            {item?.diaClase && <Text>Horario: {item.diaClase}</Text>}
      
            {item?.cancelable && shiftId != null && (
              <Button
                mode="contained"
                buttonColor="#cc3b3b"
                onPress={() => cancelar(shiftId)}
                style={{ marginTop: 8 }}
                loading={isCancelingThis}   // 👈 ruedita
                disabled={isCancelingThis}  // 👈 no se puede tocar mientras tanto
              >
                Cancelar Reserva
              </Button>
            )}
          </View>
        );
      }}      
      ListEmptyComponent={
        <Text style={{ textAlign: "center", marginTop: 24 }}>No tenés reservas</Text>
      }
    />
  );
}