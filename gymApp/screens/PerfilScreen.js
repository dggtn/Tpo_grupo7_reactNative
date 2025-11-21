import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  LinearGradient,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { logout, selectToken } from "../../store/slices/authSlice";
import { selectUserEmail } from "../../store/slices/userSlice";
import {
  disableBiometric,
  enableBiometricForSession,
  authenticateWithBiometric,
  selectBiometricEnabled,
  selectBiometricAvailable,
  checkBiometricAvailability,
  resetBiometricOnLogout,
} from "../../store/slices/biometricSlice";
import { showSuccessToast, showErrorToast } from "../../utils/toastUtils";
import { getBiometricTypeName } from "../../utils/biometricUtils";
import {
  saveBiometricCredentials,
  deleteBiometricCredentials,
} from "../../utils/biometricStorageUtils";
import { Button } from "react-native-paper";

import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PerfilScreen = () => {
  const IMAGEN_PERFIL_KEY = "@IMAGEN_PERFIL";

  const dispatch = useDispatch();
  const token = useSelector(selectToken);
  const userEmail = useSelector(selectUserEmail);
  const biometricEnabled = useSelector(selectBiometricEnabled);
  const biometricAvailable = useSelector(selectBiometricAvailable);

  const url = process.env.EXPO_PUBLIC_API_URL;

  const [text, onChangeText] = useState();
  const [text2, onChangeText2] = useState();
  const [isLoading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState({});
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showBiometricDialog, setShowBiometricDialog] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordForBiometric, setPasswordForBiometric] = useState("");
  const [biometricTypeName, setBiometricTypeName] = useState("Huella Digital");
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("permiso denegado", `Necesitas activar permiso de la camara`);
    } else {
      const result = await ImagePicker.launchImageLibraryAsync({
        base64: true,
      });
      if (!result.cancelled) {
        const base64Image = result.assets[0].base64;
        AsyncStorage.setItem(IMAGEN_PERFIL_KEY, base64Image);
        setFile(base64Image);
        setError(null);
      }
    }
  };

  const cargarImagenDePerfil = async () => {
    const imagenGuardada = await AsyncStorage.getItem(IMAGEN_PERFIL_KEY);
    if (imagenGuardada != null) {
      setFile(imagenGuardada);
    }
  };

  useEffect(() => {
    cargarImagenDePerfil();
  }, []);

  useEffect(() => {
    initializeScreen();
  }, [token]);

  const initializeScreen = async () => {
    if (token) {
      await getUsuario();
    }
    await loadBiometricType();
  };

  const loadBiometricType = async () => {
    const typeName = await getBiometricTypeName();
    setBiometricTypeName(typeName);
  };

  const putUsuario = async () => {
    try {
      const response = await fetch(url + "/users/name", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: text,
        }),
      });

      const json = await response.json();

      if (json.ok) {
        setUsuario(json.data);
        showSuccessToast("Éxito", "Perfil actualizado correctamente");
      } else {
        showErrorToast("Error", "No se pudo actualizar el perfil");
      }
    } catch (error) {
      console.error("[PerfilScreen] ERROR: ", error);
      showErrorToast("Error", "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const getUsuario = async () => {
    try {
      const response = await fetch(url + "/users/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const json = await response.json();

      if (json.ok) {
        setUsuario(json.data);
        if (json.data.firstName) {
          onChangeText(json.data.firstName);
        }
        if (json.data.email) {
          onChangeText2(json.data.email);
        }
      } else {
        showErrorToast("Error", "No se pudo cargar el perfil");
      }
    } catch (error) {
      console.error("[PerfilScreen] ERROR: ", error);
      showErrorToast("Error", "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  // Limpiar biometría al cerrar sesión
  const performLogout = async () => {
    setShowLogoutDialog(false);
    setIsLoggingOut(true);
    try {
      console.log("[PerfilScreen] 🚪 Cerrando sesión...");

      // 1. Limpiar credenciales biométricas
      await deleteBiometricCredentials();
      console.log("[PerfilScreen] 🗑️ Credenciales biométricas eliminadas");

      // 2. Reset del estado biométrico
      dispatch(resetBiometricOnLogout());
      console.log("[PerfilScreen] 🔄 Estado biométrico reseteado");

      // 3. Logout normal
      await dispatch(logout()).unwrap();

      showSuccessToast("Sesión Cerrada", "Has cerrado sesión correctamente");
    } catch (error) {
      console.error("[PerfilScreen] Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDisableBiometric = () => {
    setShowBiometricDialog(true);
  };

  // Deshabilitar biometría para esta sesión
  const performDisableBiometric = async () => {
    setShowBiometricDialog(false);
    try {
      console.log(
        "[PerfilScreen] 🗑️ Deshabilitando biometría para sesión actual"
      );

      // Limpiar credenciales
      await deleteBiometricCredentials();

      // Deshabilitar en Redux (solo para esta sesión)
      await dispatch(disableBiometric()).unwrap();

      showSuccessToast("Éxito", "Biometría desactivada para esta sesión");
      dispatch(checkBiometricAvailability(true));
    } catch (error) {
      showErrorToast("Error", "No se pudo desactivar la biometría");
    }
  };

  const handleEnableBiometric = () => {
    setShowPasswordPrompt(true);
  };

  // Habilitar biometría para esta sesión solamente
  const performEnableBiometric = async () => {
    if (!passwordForBiometric.trim()) {
      showErrorToast("Error", "Debes ingresar tu contraseña");
      return;
    }

    setShowPasswordPrompt(false);

    try {
      console.log(
        "[PerfilScreen] 🔐 Habilitando biometría para sesión actual:",
        userEmail
      );

      // 1. Autenticar con biometría
      await dispatch(
        authenticateWithBiometric("Configurar " + biometricTypeName)
      ).unwrap();

      // 2. Guardar credenciales
      const saved = await saveBiometricCredentials(
        userEmail,
        passwordForBiometric
      );

      if (!saved) {
        throw new Error("No se pudieron guardar las credenciales");
      }

      // 3. Habilitar biometría SOLO para esta sesión (no persistente)
      await dispatch(enableBiometricForSession(userEmail)).unwrap();

      console.log("[PerfilScreen] ✅ Biometría configurada para sesión actual");
      showSuccessToast(
        "¡Listo!",
        `${biometricTypeName} activada para esta sesión`
      );

      setPasswordForBiometric("");
      dispatch(checkBiometricAvailability(true));
    } catch (error) {
      console.error("[PerfilScreen] ❌ Error habilitando biometría:", error);
      if (
        error.toString().includes("cancelada") ||
        error.toString().includes("cancel")
      ) {
        console.log("[PerfilScreen] Usuario canceló configuración");
      } else {
        showErrorToast("Error", "No se pudo activar la biometría");
      }
      setPasswordForBiometric("");
    }
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: "#fff", marginTop: 10 }}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <View style={styles.infoContainer}>
            <Text style={styles.subtitle}>MI PERFIL:</Text>
            {file ? (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: "data:image/jpeg;base64," + file }}
                  style={styles.image}
                />
              </View>
            ) : (
              <Text style={styles.errorText}>{error}</Text>
            )}
         
          <Text style={styles.header}>Agrega o edita tu foto:</Text>

          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>Elegir imagen:</Text>
          </TouchableOpacity>
           

          <TextInput
            style={styles.input}
            onChangeText={onChangeText}
            value={text}
            placeholder="edita o agrega tu nombre"
            placeholderTextColor="#f9f9f9ff"
          />

          <TextInput
            style={styles.input}
            value={text2}
            placeholder="edita o agrega tu email"
            placeholderTextColor="#f7f4f4ff"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={false}
          />
          <Button
            style={styles.button}
            mode="contained"
            onPress={putUsuario}
          >
            Guardar cambios
          </Button>
          </View>
        </View>

        {/* SECCIÓN DE BIOMETRÍA MEJORADA */}
        {biometricEnabled ? (
          <View style={styles.biometricEnabledContainer}>
            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Autenticación Segura:</Text>
                <Text style={[styles.infoValue, { color: "#4CAF50" }]}>
                  Activa ({biometricTypeName})
                </Text>
                <Text style={styles.sessionInfo}>
                  Solo activa en esta sesión
                </Text>
              </View>
              <TouchableOpacity onPress={handleDisableBiometric}>
                <Ionicons
                  name="close-circle-outline"
                  size={24}
                  color="#f44336"
                />
              </TouchableOpacity>
            </View>
          </View>
        ) : biometricAvailable ? (
          <TouchableOpacity
            style={styles.enableBiometricButton}
            onPress={handleEnableBiometric}
          >
            <Ionicons
              name={
                biometricTypeName === "PIN del Dispositivo"
                  ? "keypad"
                  : "finger-print"
              }
              size={28}
              color="#74C1E6"
            />
            <View style={styles.enableBiometricTextContainer}>
              <Text style={styles.enableBiometricTitle}>
                Activar {biometricTypeName}
              </Text>
              <Text style={styles.enableBiometricSubtitle}>
                {biometricTypeName === "PIN del Dispositivo"
                  ? "Usa el PIN de tu dispositivo para iniciar sesión"
                  : "Inicia sesión más rápido y seguro"}
              </Text>
              <Text style={styles.sessionWarning}>
                ⚠️ Se desactivará al cerrar sesión
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#74C1E6" />
          </TouchableOpacity>
        ) : (
          <View style={styles.biometricUnavailableContainer}>
            <Ionicons name="alert-circle-outline" size={24} color="#FF9800" />
            <Text style={styles.biometricUnavailableText}>
              No hay seguridad configurada en este dispositivo. Configura un
              PIN, patrón o huella digital en la configuración de tu
              dispositivo.
            </Text>
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, isLoggingOut && styles.buttonDisabled]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={24} color="#fff" />
              <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Logout Confirmation Dialog */}
        <Modal
          visible={showLogoutDialog}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowLogoutDialog(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Ionicons name="log-out-outline" size={48} color="#f44336" />
              <Text style={styles.modalTitle}>Cerrar Sesión</Text>
              <Text style={styles.modalMessage}>
                ¿Estás seguro que deseas cerrar sesión?
              </Text>
              {biometricEnabled && (
                <View style={styles.warningBox}>
                  <Ionicons name="warning" size={20} color="#FF9800" />
                  <Text style={styles.warningText}>
                    La biometría se desactivará
                  </Text>
                </View>
              )}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonSecondary}
                  onPress={() => setShowLogoutDialog(false)}
                >
                  <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButtonPrimary}
                  onPress={performLogout}
                >
                  <Text style={styles.modalButtonPrimaryText}>Sí, salir</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Biometric Disable Dialog */}
        <Modal
          visible={showBiometricDialog}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowBiometricDialog(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Ionicons name="finger-print" size={48} color="#FF9800" />
              <Text style={styles.modalTitle}>Desactivar Biometría</Text>
              <Text style={styles.modalMessage}>
                ¿Deseas desactivar la autenticación biométrica para esta sesión?
                Podrás volver a activarla en cualquier momento.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonSecondary}
                  onPress={() => setShowBiometricDialog(false)}
                >
                  <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButtonPrimary}
                  onPress={performDisableBiometric}
                >
                  <Text style={styles.modalButtonPrimaryText}>
                    Sí, desactivar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Password Prompt Dialog */}
        <Modal
          visible={showPasswordPrompt}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setShowPasswordPrompt(false);
            setPasswordForBiometric("");
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Ionicons name="lock-closed" size={48} color="#74C1E6" />
              <Text style={styles.modalTitle}>Confirma tu Contraseña</Text>
              <Text style={styles.modalMessage}>
                Para activar la biometría, necesitamos verificar tu identidad
              </Text>

              <TextInput
                style={styles.passwordInput}
                placeholder="Ingresa tu contraseña"
                value={passwordForBiometric}
                onChangeText={setPasswordForBiometric}
                secureTextEntry
                autoCapitalize="none"
              />

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={18} color="#FF9800" />
                <Text style={styles.infoBoxText}>
                  La biometría se desactivará al cerrar sesión
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonSecondary}
                  onPress={() => {
                    setShowPasswordPrompt(false);
                    setPasswordForBiometric("");
                  }}
                >
                  <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButtonPrimary}
                  onPress={performEnableBiometric}
                >
                  <Text style={styles.modalButtonPrimaryText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    
    </View>
  );
};

export default PerfilScreen;

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor:"linear-gradient(120deg, rgba(255, 156, 117, 1) 0%, rgba(163, 235, 226, 1) 100%);",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 20,
    color: "#fff",
  },
  subtitle: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: "bold",
    fontStyle: "italic",
    marginBottom: 20,
    color: "#e2dcebff",
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    borderColor: "#ecdae8ff",
    borderStyle: "solid",
    borderRadius: 10,
    padding: 10,
    color: "#fff",
    backgroundColor: "linear-gradient(120deg, rgba(255, 156, 117, 1) 0%, rgba(163, 235, 226, 1) 100%)",
    fontSize: 15,
    fontWeight: "bold",
    fontStyle: "italic",
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#fff",
  },
  infoContainer: {
    backgroundColor: "linear-gradient(120deg, rgba(255, 156, 117, 1) 0%, rgba(163, 235, 226, 1) 100%);",
    borderRadius: 12,
    padding: 20,
  },
  biometricEnabledContainer: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  sessionInfo: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 2,
    fontStyle: "italic",
  },
  btnGuardar: {
    backgroundColor: "#74C1E6",
  },
  enableBiometricButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(116, 193, 230, 0.15)",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    gap: 15,
    borderWidth: 2,
    borderColor: "#74C1E6",
    borderStyle: "dashed",
  },
  enableBiometricTextContainer: {
    flex: 1,
  },
  enableBiometricTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 4,
  },
  enableBiometricSubtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 13,
    marginBottom: 4,
  },
  sessionWarning: {
    color: "#FFB74D",
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 2,
  },
  biometricUnavailableContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 152, 0, 0.1)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 152, 0, 0.3)",
  },
  biometricUnavailableText: {
    flex: 1,
    color: "#FFB74D",
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: "row",
    backgroundColor: "#f44336",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginHorizontal: 20,
    maxWidth: 400,
    width: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 12,
    textAlign: "center",
    color: "#121212",
  },
  modalMessage: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginBottom: 24,
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 152, 0, 0.1)",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  warningText: {
    color: "#F57C00",
    fontSize: 13,
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButtonPrimary: {
    flex: 1,
    backgroundColor: "#f44336",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonPrimaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: "#e0e0e0",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonSecondaryText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "bold",
  },
  passwordInput: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#f9f9f9",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 152, 0, 0.1)",
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
    width: "100%",
  },
  infoBoxText: {
    flex: 1,
    fontSize: 12,
    color: "#F57C00",
    lineHeight: 16,
  },

  container: {
    flex: 1,
    backgroundColor: "linear-gradient(120deg, rgba(255, 156, 117, 1) 0%, rgba(163, 235, 226, 1) 100%);",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  header: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    margin:"center"
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
    margin:"center"
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  imageContainer: {
    borderRadius: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  errorText: {
    color: "red",
    marginTop: 16,
  },
});
