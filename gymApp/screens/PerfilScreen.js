import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { logout, selectToken } from '../../store/slices/authSlice';
import { selectUserEmail } from '../../store/slices/userSlice';
import {
  disableBiometric,
  enableBiometric,
  authenticateWithBiometric,
  selectBiometricEnabled,
  selectBiometricAvailable,
  checkBiometricAvailability,
} from '../../store/slices/biometricSlice';
import {
  showSuccessToast,
  showErrorToast,
} from '../../utils/toastUtils';
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { getBiometricTypeName } from '../../utils/biometricUtils';
import { 
  saveBiometricCredentials, 
  deleteBiometricCredentials 
} from '../../utils/biometricStorageUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_PROMPT_SHOWN_KEY = 'biometric_prompt_shown';

const PerfilScreen = () => {
  const dispatch = useDispatch();
  const token = useSelector(selectToken);
  const userEmail = useSelector(selectUserEmail);
  const biometricEnabled = useSelector(selectBiometricEnabled);
  const biometricAvailable = useSelector(selectBiometricAvailable);

  const url = process.env.EXPO_PUBLIC_API_URL;
  
  const [text, onChangeText] = useState("Cargando...");
  const [text2, onChangeText2] = useState("Cargando...");
  const [isLoading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState({});
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showBiometricDialog, setShowBiometricDialog] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordForBiometric, setPasswordForBiometric] = useState('');
  const [biometricTypeName, setBiometricTypeName] = useState('Huella Digital');
  
  useEffect(() => {
    initializeScreen();
  }, [token]);

  const initializeScreen = async () => {
    if (token) {
      await getUsuario();
    }
    // ✅ YA NO llamar checkBiometricAvailability (ya está en cache)
    await loadBiometricType();
  };

  const loadBiometricType = async () => {
    const typeName = await getBiometricTypeName();
    setBiometricTypeName(typeName);
  };

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
      
      if (json.success) {
        setUsuario(json.data);
        onChangeText(json.data.firstName || "edita o agrega tu nombre");
        onChangeText2(json.data.email || "edita o agrega tu email");
      } else {
        showErrorToast('Error', 'No se pudo cargar el perfil');
      }
    } catch (error) {
      console.error("[PerfilScreen] ERROR: ", error);
      showErrorToast('Error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

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
      // Eliminar credenciales guardadas
      await deleteBiometricCredentials();
      
      // Desactivar biometría en el estado
      await dispatch(disableBiometric()).unwrap();
      
      // Limpiar preferencia de "no mostrar más"
      if (userEmail) {
        const shownKey = `${BIOMETRIC_PROMPT_SHOWN_KEY}_${userEmail}`;
        await AsyncStorage.removeItem(shownKey);
      }
      
      showSuccessToast('Éxito', 'Biometría desactivada correctamente');
      
      // ✅ OPCIONAL: Re-verificar disponibilidad después de cambios manuales
      // (forzar bypass de cache)
      dispatch(checkBiometricAvailability(true));
      
    } catch (error) {
      showErrorToast('Error', 'No se pudo desactivar la biometría');
    }
  };

  const handleEnableBiometric = () => {
    setShowPasswordPrompt(true);
  };

  const performEnableBiometric = async () => {
    if (!passwordForBiometric.trim()) {
      showErrorToast('Error', 'Debes ingresar tu contraseña');
      return;
    }

    setShowPasswordPrompt(false);

    try {
      console.log('[PerfilScreen] 🔐 Habilitando biometría para:', userEmail);
      
      // 1. Autenticar para verificar que funciona
      await dispatch(authenticateWithBiometric('Configurar ' + biometricTypeName)).unwrap();
      
      // 2. Guardar credenciales (⚠️ temporal hasta implementar refresh tokens)
      const saved = await saveBiometricCredentials(
        userEmail,
        passwordForBiometric
      );
      
      if (!saved) {
        throw new Error('No se pudieron guardar las credenciales');
      }
      
      // 3. Habilitar biometría en el estado
      await dispatch(enableBiometric(userEmail)).unwrap();
      
      console.log('[PerfilScreen] ✅ Biometría configurada exitosamente');
      showSuccessToast('¡Listo!', 'Biometría activada correctamente');
      
      // Limpiar contraseña
      setPasswordForBiometric('');
      
      // ✅ OPCIONAL: Re-verificar disponibilidad después de cambios manuales
      dispatch(checkBiometricAvailability(true));
      
    } catch (error) {
      console.error('[PerfilScreen] ❌ Error habilitando biometría:', error);
      if (error.toString().includes('cancelada') || error.toString().includes('cancel')) {
        console.log('[PerfilScreen] Usuario canceló configuración');
      } else {
        showErrorToast('Error', 'No se pudo activar la biometría');
      }
      setPasswordForBiometric('');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaProvider>
        <SafeAreaView>
          <Text style={styles.title}>MI PERFIL</Text>
          
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Image
              source={require('../../assets/adaptive-icon.png')}
              style={styles.avatar}
            />
          </View>
  
          {/* User Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.subtitle}>Perfil</Text>
            <TextInput
              style={styles.input}
              onChangeText={onChangeText}
              value={text}
              placeholder="edita o agrega tu nombre"
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              onChangeText={onChangeText2}
              value={text2}
              placeholder="edita o agrega tu email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false}
            />
          </View>

          {/* Biometric Status */}
          {biometricEnabled ? (
            <View style={styles.biometricEnabledContainer}>
              <View style={styles.infoRow}>
                <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Autenticación Segura:</Text>
                  <Text style={[styles.infoValue, { color: '#4CAF50' }]}>
                    Activa ({biometricTypeName})
                  </Text>
                </View>
                <TouchableOpacity onPress={handleDisableBiometric}>
                  <Ionicons name="close-circle-outline" size={24} color="#f44336" />
                </TouchableOpacity>
              </View>
            </View>
          ) : biometricAvailable ? (
            <TouchableOpacity
              style={styles.enableBiometricButton}
              onPress={handleEnableBiometric}
            >
              <Ionicons 
                name={biometricTypeName === 'PIN del Dispositivo' ? 'keypad' : 'finger-print'} 
                size={28} 
                color="#74C1E6" 
              />
              <View style={styles.enableBiometricTextContainer}>
                <Text style={styles.enableBiometricTitle}>
                  Activar {biometricTypeName}
                </Text>
                <Text style={styles.enableBiometricSubtitle}>
                  {biometricTypeName === 'PIN del Dispositivo' 
                    ? 'Usa el PIN de tu dispositivo para iniciar sesión'
                    : 'Inicia sesión más rápido y seguro'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#74C1E6" />
            </TouchableOpacity>
          ) : (
            <View style={styles.biometricUnavailableContainer}>
              <Ionicons name="alert-circle-outline" size={24} color="#FF9800" />
              <Text style={styles.biometricUnavailableText}>
                No hay seguridad configurada en este dispositivo. Configura un PIN, patrón o huella digital en la configuración de tu dispositivo.
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

          {/* Password Prompt for Biometric Setup */}
          <Modal
            visible={showPasswordPrompt}
            transparent={true}
            animationType="fade"
            onRequestClose={() => {
              setShowPasswordPrompt(false);
              setPasswordForBiometric('');
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

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalButtonSecondary}
                    onPress={() => {
                      setShowPasswordPrompt(false);
                      setPasswordForBiometric('');
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
    color: "#fff",
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    marginBottom: 20,
  },
  biometricEnabledContainer: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  enableBiometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(116, 193, 230, 0.15)',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    gap: 15,
    borderWidth: 2,
    borderColor: '#74C1E6',
    borderStyle: 'dashed',
  },
  enableBiometricTextContainer: {
    flex: 1,
  },
  enableBiometricTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  enableBiometricSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
  },
  biometricUnavailableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  biometricUnavailableText: {
    flex: 1,
    color: '#FFB74D',
    fontSize: 14,
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
    width: '90%',
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
    width: '100%',
  },
  modalButtonPrimary: {
    flex: 1,
    backgroundColor: '#f44336',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  passwordInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
});