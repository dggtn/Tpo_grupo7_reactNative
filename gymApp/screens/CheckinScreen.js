import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Button } from "react-native-paper";
import { useSelector } from "react-redux";
import { selectToken } from "../../store/slices/authSlice";
import { API_BASE_URL } from "../../config/constants";

const API_URL = API_BASE_URL;

export default function CheckinScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  // controla si la cámara está escaneando o no
  const [scanned, setScanned] = useState(false);

  // info del QR válido
  const [preview, setPreview] = useState(null); // { shiftId, ...más datos si querés }

  // error de QR / token / etc
  const [errorMsg, setErrorMsg] = useState(null);

  // mientras se hace el POST de checkin
  const [isSubmitting, setIsSubmitting] = useState(false);

  // token desde Redux
  const token = useSelector(selectToken);

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const resetScan = () => {
    setScanned(false);
    setPreview(null);
    setErrorMsg(null);
    setIsSubmitting(false);
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return; // ya estamos procesando algo

    setScanned(true);      // congela la cámara (ya no se vuelve a escanear)
    setErrorMsg(null);
    setPreview(null);

    const raw = String(data ?? "").trim();
    const shiftId = Number(raw);

    if (!shiftId) {
      setErrorMsg(`QR inválido. No se encontró un id de clase válido: ${raw}`);
      return;
    }

    if (!token) {
      setErrorMsg("No se encontró token de autenticación. Volvé a iniciar sesión.");
      return;
    }

    // Si quisieras traer más datos del turno, acá podrías hacer un GET
    // por ejemplo: GET /shifts/{shiftId} y guardar nombreCurso, diaClase, etc.
    // Por ahora mostramos algo básico.
    setPreview({
      shiftId,
      // nombreCurso: "...",
      // diaClase: "...",
      // sede: "..."
    });
  };

  const confirmarCheckin = async () => {
    if (!preview?.shiftId) {
      Alert.alert("Check-in", "No se encontró el turno a confirmar.");
      return;
    }
    if (!token) {
      Alert.alert("Sesión", "No se encontró token. Volvé a iniciar sesión.");
      resetScan();
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch(`${API_URL}/reservations/checkin/${preview.shiftId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const js = await res.json().catch(() => null);

      if (!res.ok) {
        console.log("CHECKIN ERROR", res.status, js);
        throw new Error(js?.message || `Error ${res.status}`);
      }

      Alert.alert("Check-in", "Asistencia registrada correctamente.");
      resetScan(); // listo, volvemos a modo escaneo por si querés pasar otro
    } catch (e) {
      Alert.alert("Error", e.message || "No se pudo registrar el check-in.");
      // después de error te dejo en la pantalla de preview/error
      // para que el usuario decida “Volver a escanear”.
    } finally {
      setIsSubmitting(false);
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

  const mostrarCamera = !scanned; // si scanned=true, escondemos la cámara

  return (
    <View style={{ flex: 1 }}>
      {mostrarCamera && (
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={handleBarCodeScanned}
        />
      )}

      {/* Overlay de resultado (error o preview) */}
      {scanned && (
        <View style={styles.overlayContainer}>
          <View style={styles.overlayCard}>
            {errorMsg ? (
              <>
                <Text style={styles.title}>QR inválido</Text>
                <Text style={styles.text}>{errorMsg}</Text>
                <Button
                  mode="contained"
                  style={{ marginTop: 16 }}
                  onPress={resetScan}
                >
                  Volver a escanear
                </Button>
              </>
            ) : (
              <>
                <Text style={styles.title}>Confirmar check-in</Text>
                <Text style={styles.text}>
                  Vas a registrar asistencia para el turno #{preview?.shiftId}.
                </Text>

                {/* Si después traés más datos del turno, podés mostrarlos acá */}
                {/* {preview?.nombreCurso && (
                  <Text style={styles.text}>Curso: {preview.nombreCurso}</Text>
                )}
                {preview?.diaClase && (
                  <Text style={styles.text}>Día / Horario: {preview.diaClase}</Text>
                )}
                {preview?.sede && (
                  <Text style={styles.text}>Sede: {preview.sede}</Text>
                )} */}

                <Button
                  mode="contained"
                  style={{ marginTop: 16 }}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  onPress={confirmarCheckin}
                >
                  Confirmar check-in
                </Button>

                <Button
                  mode="text"
                  style={{ marginTop: 8 }}
                  disabled={isSubmitting}
                  onPress={resetScan}
                >
                  Cancelar / Volver a escanear
                </Button>
              </>
            )}
          </View>
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
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayCard: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#0e6c5e",
  },
  text: {
    fontSize: 14,
    color: "#333",
  },
});
