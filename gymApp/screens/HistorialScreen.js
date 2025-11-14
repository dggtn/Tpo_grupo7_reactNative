// gymApp/screens/HistorialScreen.js
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useSelector } from "react-redux";
import { selectToken } from "../../store/slices/authSlice";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

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

export default function HistorialScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // 👉 token desde Redux (igual que en MisReservas / Checkin / DetalleCurso)
  const token = useSelector(selectToken);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${API_URL}/reservations/history`, { headers });

      const payload = await safeJson(res);
      if (!res.ok) throw new Error(payload?.message || `Error ${res.status}`);

      const lista = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : [];

      setItems(lista);
    } catch (e) {
      const msg = (e?.message || "").toLowerCase();
      // No mostrar alerta si simplemente no hay historial
      if (
        !msg.includes("no hay historial") &&
        !msg.includes("no hay asistencias")
      ) {
        Alert.alert("Historial", e.message || "No se pudo cargar el historial");
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const renderItem = ({ item }) => {
    const nombreCurso = item?.nombreCurso ?? "Curso";
    const estado = item?.estadoReserva ?? "N/D";
    const diaClase = item?.diaClase ?? null;
    const sede = item?.sede ?? null;

    return (
      <View style={styles.card}>
        <Text style={styles.curso}>{nombreCurso}</Text>
        {diaClase ? (
          <Text style={styles.linea}>Día / Horario: {diaClase}</Text>
        ) : null}
        {sede ? <Text style={styles.linea}>Sede: {sede}</Text> : null}
        <Text style={[styles.linea, styles.estado]}>Estado: {estado}</Text>
      </View>
    );
  };

  if (loading && items.length === 0) {
    return <ActivityIndicator style={{ marginTop: 24 }} />;
  }

  return (
    <FlatList
      style={{ flex: 1 }}
      data={items ?? []}
      keyExtractor={(it, idx) => String(it?.reservationId ?? idx)}
      renderItem={renderItem}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={load} />
      }
      ListEmptyComponent={
        <Text style={styles.emptyText}>
          Todavía no tenés historial de asistencias.
        </Text>
      }
      contentContainerStyle={
        (items ?? []).length === 0
          ? { flexGrow: 1, justifyContent: "center" }
          : null
      }
    />
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  curso: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0e6c5e",
    marginBottom: 4,
  },
  linea: {
    fontSize: 14,
    color: "#444",
  },
  estado: {
    marginTop: 4,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 16,
    color: "#666",
  },
});
