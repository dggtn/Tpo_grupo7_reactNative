import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  TextInput
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '../../store/slices/authSlice';
import { selectUser, selectUserEmail, selectUserFullName } from '../../store/slices/userSlice';
import {
  disableBiometric,
  selectBiometricEnabled,
  selectBiometricUserEmail,
} from '../../store/slices/biometricSlice';
import {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
} from '../../utils/toastUtils';

import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

const PerfilScreen = () => {
  const dispatch = useDispatch();
  const token = useSelector(selectToken); 
  const biometricEnabled = useSelector(selectBiometricEnabled);
  const biometricEmail = useSelector(selectBiometricUserEmail);

  const [text, onChangeText] = useState("edita o agrega tu nombre");
  const [text2, onChangeText2] = useState("edita o agrega tu email");
  const navigation = useNavigation();
  const url = process.env.EXPO_PUBLIC_API_URL;
  const [isLoading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState({});

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showBiometricDialog, setShowBiometricDialog] = useState(false);

  const getUsuario = async () => {
    try {
      const response = await fetch(url + "/users/me", {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const json = await response.json();
      console.log('[PerfilScreen] Response:', json);
      
      if (json.success) {
        setUsuario(json.data);
        onChangeText(json.data.firstName || "edita o agrega tu nombre");
        onChangeText2(json.data.email || "edita o agrega tu email");
      } else {
        console.error('[PerfilScreen] Error:', json.error);
      }
    } catch (error) {
      console.error("[PerfilScreen] ERROR: ", error);
    } finally {
      setLoading(false);
    }
  };

  // useEffect para cargar usuario
  useEffect(() => {
    console.log('[PerfilScreen] Montando componente');
    if (token) {
      getUsuario();
    }
  }, [token]);

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const performLogout = async () => {
    setShowLogoutDialog(false);
    setIsLoggingOut(true);
    try {
      await dispatch(logout()).unwrap();
      showSuccessToast('Sesión Cerrada', 'Has cerrado sesión correctamente');
    } catch (error) {
      console.error('Logout error:', error);
      showInfoToast('Sesión Cerrada', 'Sesión cerrada localmente');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDisableBiometric = () => {
    setShowBiometricDialog(true);
  };

  const performDisableBiometric = async () => {
    setShowBiometricDialog(false);
    try {
      await dispatch(disableBiometric()).unwrap();
      showSuccessToast('Éxito', 'Biometría desactivada correctamente');
    } catch (error) {
      showErrorToast('Error', 'No se pudo desactivar la biometría');
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaProvider>
        <SafeAreaView>
          <Text style={styles.title}>MI PERFIL</Text>
          {/* Avatar Placeholder */}
          <View style={styles.avatarContainer}>
            <Image
              source={require('../../assets/adaptive-icon.png')}
              style={styles.avatar}
            />
          </View>
  
          {/* User Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.title}>Perfil</Text>
            <TextInput
            style={styles.input}
            onChangeText={onChangeText}
            value={text}
            placeholder="edita o agrega tu nombre"
            />
            <TextInput
            style={styles.input}
            onChangeText={onChangeText2}
            value={text2}
            placeholder="edita o agrega tu email"
            />
          </View>

          {/* Biometric Status */}
          {biometricEnabled && (
          <View style={styles.infoRow}>
            <Ionicons name="finger-print" size={24} color="#4CAF50" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Biometría:</Text>
              <Text style={[styles.infoValue, { color: '#4CAF50' }]}>
                Activa para {biometricEmail}
              </Text>
            </View>
            <TouchableOpacity onPress={handleDisableBiometric}>
              <Ionicons name="close-circle-outline" size={24} color="#f44336" />
            </TouchableOpacity>
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
                  ¿Deseas desactivar la autenticación biométrica? Podrás volver a activarla en cualquier momento.
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
                    <Text style={styles.modalButtonPrimaryText}>Sí, desactivar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
          </Modal>

        </SafeAreaView>
      </SafeAreaProvider>
    </View>
  );
}
export default PerfilScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#b35cbdff",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 20,
    color: '#fff',
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
    color: "#e2dcebff",
    fontSize: 15,
    fontWeight: "bold",
    fontStyle: "italic",
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 15,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#f44336',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 20,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
    color: '#121212',
  },
  modalMessage: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonPrimary: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalButtonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonSecondary: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalButtonSecondaryText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
