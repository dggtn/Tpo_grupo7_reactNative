import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Button } from "react-native-paper";
import { useSelector } from "react-redux";
import { selectToken } from "../../store/slices/authSlice";
import { API_BASE_URL } from '../config/constants';

const API_URL = API_BASE_URL;

export default function CheckinScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // 👉 token sacado del store, igual que en DetalleCurso / MisReservas
  const token = useSelector(selectToken);

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);

    // data es lo que viene en el QR. Si el QR tiene solo el número, esto alcanza.
    // Si en algún momento el QR es tipo "shiftId=123", acá se podría parsear.
    const raw = String(data ?? "").trim();
    const shiftId = Number(raw);

    if (!shiftId) {
      Alert.alert("QR inválido", `No se encontró un shiftId numérico en: ${raw}`);
      setScanned(false);
      return;
    }

    if (!token) {
      Alert.alert(
        "Sesión",
        "No se encontró token de autenticación. Volvé a iniciar sesión."
      );
      setScanned(false);
      return;
    }

    try {
      console.log("CHECKIN shiftId:", shiftId);
      console.log("CHECKIN token (primeros chars):", token.slice(0, 20));

      const res = await fetch(`${API_URL}/reservations/checkin/${shiftId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // 👈 misma lógica que en las otras pantallas
        },
      });

      const js = await res.json().catch(() => null);

      if (!res.ok) {
        console.log("CHECKIN ERROR", res.status, js);
        throw new Error(js?.message || `Error ${res.status}`);
      }

      Alert.alert("Check-in", "Asistencia registrada correctamente.");
    } catch (e) {
      Alert.alert("Error", e.message || "No se pudo registrar el check-in.");
    } finally {
      // después de un ratito permitimos escanear de nuevo
      setTimeout(() => setScanned(false), 1500);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text>No otorgaste permisos de cámara</Text>
        <Button mode="contained" onPress={requestPermission}>
          Dar permisos
        </Button>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleBarCodeScanned}
      />

      {scanned && (
        <View style={styles.overlay}>
          <Text style={styles.scanText}>Procesando...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 16,
    borderRadius: 10,
  },
  scanText: { color: "white", fontSize: 18 },
});
