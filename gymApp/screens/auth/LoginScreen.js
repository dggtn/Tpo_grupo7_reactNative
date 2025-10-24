import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import {
  login,
  clearError,
  selectAuthLoading,
  selectAuthError,
} from '../../../store/slices/authSlice';
import {
  checkBiometricAvailability,
  authenticateWithBiometric,
  loadBiometricConfig,
  enableBiometric,
  selectBiometric,
  selectShouldRequestBiometric,
} from '../../../store/slices/biometricSlice';
import { setUserEmail } from '../../../store/slices/userSlice';
import { VALIDATION } from '../../../config/constants';
import { 
  showErrorToast, 
  showSuccessToast, 
  showWarningToast,
  showInfoToast 
} from '../../../utils/toastUtils';

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const biometric = useSelector(selectBiometric);
  const shouldRequestBiometric = useSelector(selectShouldRequestBiometric);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [showBiometricDialog, setShowBiometricDialog] = useState(false);
  const [biometricDialogType, setBiometricDialogType] = useState(null);

  useEffect(() => {
    dispatch(loadBiometricConfig());
    dispatch(checkBiometricAvailability());

    if (biometric.userEmail) {
      setEmail(biometric.userEmail);
    }
  }, []);

  useEffect(() => {
    if (shouldRequestBiometric && biometric.userEmail) {
      handleBiometricLogin();
    }
  }, [shouldRequestBiometric]);

  useEffect(() => {
    if (error) {
      showErrorToast('Error', error);
      dispatch(clearError());
    }
  }, [error]);

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email requerido';
    } else if (!VALIDATION.EMAIL_REGEX.test(email)) {
      newErrors.email = 'Email inválido';
    }

    if (!password.trim()) {
      newErrors.password = 'Contraseña requerida';
    } else if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      newErrors.password = `Mínimo ${VALIDATION.PASSWORD_MIN_LENGTH} caracteres`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      const result = await dispatch(login({ email, password })).unwrap();
      
      dispatch(setUserEmail(email));
      showSuccessToast('Login exitoso', 'Bienvenido de vuelta');

      if (biometric.isAvailable && !biometric.enabled) {
        setBiometricDialogType('enroll');
        setShowBiometricDialog(true);
      } else if (biometric.enabled && biometric.userEmail !== email) {
        setBiometricDialogType('update');
        setShowBiometricDialog(true);
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      await dispatch(authenticateWithBiometric('Acceso rápido con biometría')).unwrap();
      showSuccessToast('Éxito', 'Acceso biométrico exitoso');
    } catch (err) {
      showWarningToast(
        'Error biométrico',
        '¿Deseas iniciar sesión con contraseña?'
      );
    }
  };

  const handleEnableBiometric = async () => {
    setShowBiometricDialog(false);
    try {
      await dispatch(authenticateWithBiometric('Activar autenticación biométrica')).unwrap();
      await dispatch(enableBiometric(email)).unwrap();
      showSuccessToast('Éxito', 'Autenticación biométrica activada');
    } catch (err) {
      showErrorToast('Error', 'No se pudo activar la biometría');
    }
  };

  const handleUpdateBiometric = async () => {
    setShowBiometricDialog(false);
    try {
      await dispatch(authenticateWithBiometric('Actualizar configuración')).unwrap();
      await dispatch(enableBiometric(email)).unwrap();
      showSuccessToast('Éxito', 'Biometría actualizada');
    } catch (err) {
      showErrorToast('Error', 'No se pudo actualizar la biometría');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/adaptive-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Iniciar Sesión</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="Ingresa tu email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: null });
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, errors.password && styles.inputError]}
            placeholder="Contraseña"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: null });
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            editable={!isLoading}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

        <View style={styles.loginButtonsContainer}>
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          {biometric.isAvailable && biometric.enabled && (
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricLogin}
              disabled={isLoading}
            >
              <Ionicons name="finger-print" size={28} color="#74C1E6" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate('Register')}
          disabled={isLoading}
        >
          <Text style={styles.registerButtonText}>Registrarse</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.recoveryButton}
          onPress={() => navigation.navigate('Recovery')}
          disabled={isLoading}
        >
          <Text style={styles.recoveryButtonText}>Recuperar Acceso</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Biometric Dialog Modal */}
      <Modal
        visible={showBiometricDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBiometricDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="finger-print" size={48} color="#74C1E6" />
            <Text style={styles.modalTitle}>
              {biometricDialogType === 'enroll' 
                ? 'Activar Autenticación Biométrica' 
                : 'Actualizar Autenticación Biométrica'}
            </Text>
            <Text style={styles.modalMessage}>
              {biometricDialogType === 'enroll'
                ? '¿Quieres activar el acceso rápido con huella digital o reconocimiento facial?'
                : `La biometría está configurada para ${biometric.userEmail}. ¿Quieres actualizarla para tu cuenta actual?`}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowBiometricDialog(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Ahora no</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={biometricDialogType === 'enroll' ? handleEnableBiometric : handleUpdateBiometric}
              >
                <Text style={styles.modalButtonPrimaryText}>
                  {biometricDialogType === 'enroll' ? 'Activar' : 'Actualizar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B1A1A1',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 200,
    height: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#121212',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 5,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#f44336',
    borderWidth: 1,
  },
  eyeIcon: {
    padding: 5,
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
  loginButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 10,
  },
  loginButton: {
    backgroundColor: '#74C1E6',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    minWidth: 140,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  biometricButton: {
    backgroundColor: '#fff',
    width: 53,
    height: 53,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#74C1E6',
  },
  registerButton: {
    backgroundColor: '#9CCC65',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recoveryButton: {
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  recoveryButtonText: {
    color: '#121212',
    fontSize: 14,
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
    backgroundColor: '#74C1E6',
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