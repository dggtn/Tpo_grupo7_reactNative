import React, { useEffect, useState, useMemo, useCallback } from "react";
import { ActivityIndicator, Text, View, StyleSheet, ScrollView, Alert, Linking } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Button } from "react-native-paper";
import { useSelector } from "react-redux";
import { selectToken } from "../../store/slices/authSlice"; 
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE_URL } from "../../config/constants";

const API_URL = API_BASE_URL;

export default function DetalleCursoScreen({ route }) {
  const idCurso = route?.params?.idCurso;

  const token = useSelector(selectToken);
  const [isLoading, setLoading] = useState(true);
  const [detalleCursos, setDetalleCursos] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [shiftElegido, setShiftElegido] = useState(null);

  const [isBooking, setIsBooking] = useState(false);
  


  // -------- helpers --------
  const safeJson = async (res) => {
    try {
      const ct = res.headers.get("content-type") || "";
      const cl = res.headers.get("content-length");
      if (!ct.includes("application/json")) return null;
      if (cl !== null && Number(cl) === 0) return null;
      const text = await res.text();
      if (!text) return null;
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const fetchDetalle = useCallback(async () => {
    const res = await fetch(`${API_URL}/courses/${idCurso}`);
    if (!res.ok) {
      const maybe = await safeJson(res);
      throw new Error(maybe?.message || `Error ${res.status} en /courses/${idCurso}`);
    }
    const data = await safeJson(res);
    // si el back usa envoltorio {data:...}
    return data?.data ?? data ?? null;
  }, [idCurso]);

  const fetchShifts = useCallback(async () => {
    // si no tenés endpoint de shifts, podés comentar este fetch.
    const res = await fetch(`${API_URL}/shifts/by-course/${idCurso}`);
    if (!res.ok) {
      // No rompas la pantalla por esto: devolvé []
      return [];
    }
    const data = await safeJson(res);
    return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  }, [idCurso]);

  // Mantengo tu nombre de función
  const getDetalleCurso = useCallback(async () => {
    try {
      setLoading(true);
      const [d, s] = await Promise.all([fetchDetalle(), fetchShifts()]);
      setDetalleCursos(d);
      setShifts(s);
      setShiftElegido(s?.[0] ?? null);
    } catch (error) {
      console.log(error);
      Alert.alert("Curso", error?.message || "No se pudo cargar el detalle/turnos.");
      setDetalleCursos(null);
    } finally {
      setLoading(false);
    }
  }, [fetchDetalle, fetchShifts]);

  useEffect(() => {
    getDetalleCurso(idCurso);
  }, [getDetalleCurso, idCurso]);

  const reservar = async () => {
    const shiftId = detalleCursos?.shifts?.[0]?.id;
    if (!shiftId) {
      Alert.alert("Reserva", "No se encontró un turno para reservar.");
      return;
    }
    try {
      setIsBooking(true);
  
      console.log("[DetalleCurso] token selectToken =", token); // para ver si llega
  
      const res = await fetch(`${API_URL}/reservations/reservar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),  // ✅ acá va el token
        },
        body: JSON.stringify({ idShift: shiftId }),
      });
  
      const text = await res.text().catch(() => "");
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch {}
  
      if (!res.ok) {
        console.log("[Reserva] status", res.status, "body:", text.slice(0, 200));
        throw new Error(data?.message || `Error ${res.status}`);
      }
  
      Alert.alert("Reserva", "Reserva confirmada.");
    } catch (e) {
      Alert.alert("Reserva", e.message || "No se pudo reservar.");
    } finally {
      setIsBooking(false);
    }
  };
  

  // ------- datos seguros para render --------
  const teacherLabel = useMemo(() => {
    const t = detalleCursos?.teachers;
    if (!t) return "N/D";
    if (Array.isArray(t)) return t.map(x => x?.name).filter(Boolean).join(", ") || "N/D";
    return t?.name || "N/D";
  }, [detalleCursos]);

  // Mantengo tu ruta original para sede, pero con guards
  const sede = detalleCursos?.shifts?.[0]?.clase?.sedes?.[0] ?? null;
  const address = sede?.address ?? "Dirección no disponible";
  const sedeName = sede?.name ?? "Sede";
  const lat = sede?.location?.latitude ?? -34.6037;   // fallback BA
  const lng = sede?.location?.longitude ?? -58.3816;  // fallback BA

  const initialRegion = useMemo(() => ({
    latitude: lat,
    longitude: lng,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  }), [lat, lng]);

  const onComoLlegar = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}&travelmode=walking`;
    Linking.openURL(url).catch(() => Alert.alert("Mapa", "No se pudo abrir Google Maps."));
  };

  if (isLoading) {
    return (
      
      <View>
        <ActivityIndicator />
      </View>
    );
  }

  if (!detalleCursos) {
    return (
      
      <View style={styles.container}>
        <Text style={styles.item}>No se encontraron datos del curso.</Text>
      </View>
    );
  }

  return (
      <LinearGradient
                colors={["#71c9efff", "#e99a84ff", "#f1dca0ff"]}
                style={styles.gradientContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
    <View>
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={styles.container}>
          <Text style={styles.item}>Curso: {detalleCursos?.name ?? "N/D"}</Text>
          <Text style={styles.item}>Fecha de inicio: {detalleCursos?.fechaInicio ?? "N/D"}</Text>
          <Text style={styles.item}>Fecha fin: {detalleCursos?.fechaFin ?? "N/D"}</Text>
          <Text style={styles.item}>Duración: {detalleCursos?.length ?? detalleCursos?.duracion ?? "N/D"}</Text>
          <Text style={styles.item}>Precio: {detalleCursos?.price != null ? `$${detalleCursos.price}` : "N/D"}</Text>
          <Text style={styles.item}>Profesor: {teacherLabel}</Text>

          <Text style={styles.item}>Ubicacion: {address}</Text>
          <Button style={styles.btn} mode="contained" onPress={onComoLlegar}>
            Cómo llegar a la sede: {sedeName}
          </Button>

          <Text style={styles.item}>Ubicacion en el mapa:</Text>
          <MapView style={{ width: "100%", height: 300 }} initialRegion={initialRegion}>
            <Marker coordinate={{ latitude: lat, longitude: lng }} title={sedeName} />
          </MapView>
          <View style={{ height: 16 }} />
          <Button style={styles.btn} mode="contained" onPress={reservar} loading={isBooking}>
            Reservar
          </Button>
        </View>
      </ScrollView>
    </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    marginTop: 10,
    marginRight: 20,
    marginLeft: 20,
  },
  item: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffebcd',
    marginTop: 10,
  },
  btn:{
    marginTop:10,
    marginBottom:10,
    borderRadius:20,
  }
});