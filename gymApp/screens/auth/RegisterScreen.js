import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import {
  register,
  clearError,
  selectAuthLoading,
  selectAuthError,
  setPendingEmail,
} from '../../../store/slices/authSlice';
import { VALIDATION } from '../../../config/constants';
import {
  showErrorToast,
  showSuccessToast,
} from '../../../utils/toastUtils';

export default function RegisterScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const [email, setEmail] = useState(route.params?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState(null);

  // Pre-llenar email si viene de otro lugar
  useEffect(() => {
    if (route.params?.email) {
      console.log('[RegisterScreen] 📧 Email pre-llenado:', route.params.email);
      setEmail(route.params.email);
    }
  }, [route.params?.email]);

  useEffect(() => {
    if (error) {
      handleRegisterError(error);
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

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      const normalizedEmail = email.trim().toLowerCase();
      console.log('[RegisterScreen] 📝 Iniciando registro para:', normalizedEmail);
      
      await dispatch(register({ 
        email: normalizedEmail, 
        password 
      })).unwrap();

      dispatch(setPendingEmail(normalizedEmail));
      showSuccessToast('Código Enviado', 'Revisa tu email para el código de verificación');
      
      setTimeout(() => {
        navigation.navigate('Verification', { email: normalizedEmail });
      }, 1500);
    } catch (err) {
      console.error('[RegisterScreen] ❌ Error en registro:', err);
      // El error ya se maneja en el useEffect
    }
  };

  const handleRegisterError = (errorMessage) => {
    console.log('[RegisterScreen] 🔴 Manejando error:', errorMessage);
    
    if (errorMessage.includes('ya está registrado') || errorMessage.includes('already exists')) {
      setDialogType('exists');
      setShowDialog(true);
    } else if (errorMessage.includes('registro pendiente') || errorMessage.includes('pending')) {
      setDialogType('pending');
      setShowDialog(true);
    } else {
      showErrorToast('Error', errorMessage);
    }
  };

  const handleDialogAction = (action) => {
    setShowDialog(false);
    
    switch (action) {
      case 'login':
        console.log('[RegisterScreen] 🔑 Navegando a Login');
        navigation.navigate('Login', { email });
        break;
      case 'recovery':
        console.log('[RegisterScreen] 🔄 Navegando a Recovery');
        navigation.navigate('Recovery', { email });
        break;
      case 'clear':
        console.log('[RegisterScreen] 🧹 Limpiando campos');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setErrors({});
        break;
      default:
        break;
    }
  };

  return (
    <LinearGradient
      colors={['#71c9efff', '#e99a84ff', '#f1dca0ff']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Ionicons name="barbell-sharp" size={64} color="#fcefd5de" />
            <Text style={styles.title}>RitmoFit</Text>
            <Text style={styles.subtitle}>Registro de Usuario</Text>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Ingresa tu email"
              placeholderTextColor="#999"
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
              placeholderTextColor="#999"
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

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, errors.confirmPassword && styles.inputError]}
              placeholder="Confirma contraseña"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
              }}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#2c2d52ff" />
            ) : (
              <>
                <Ionicons name="person-add-outline" size={20} color="#2c2d52ff" />
                <Text style={styles.registerButtonText}>Enviar Código</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>Ya tengo cuenta - Iniciar Sesión</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Dialog Modal */}
        <Modal
          visible={showDialog}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDialog(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Ionicons 
                name={dialogType === 'exists' ? 'alert-circle' : 'information-circle'} 
                size={64} 
                color="#FF9800" 
              />
              <Text style={styles.modalTitle}>
                {dialogType === 'exists' ? 'Email Ya Registrado' : 'Registro Pendiente'}
              </Text>
              <Text style={styles.modalMessage}>
                {dialogType === 'exists'
                  ? `El email ${email} ya está registrado. ¿Qué deseas hacer?`
                  : `Ya tienes un registro pendiente para ${email}. ¿Deseas recuperar el acceso para completar la verificación?`}
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonSecondary}
                  onPress={() => handleDialogAction('clear')}
                >
                  <Text style={styles.modalButtonSecondaryText}>Usar otro email</Text>
                </TouchableOpacity>
                {dialogType === 'exists' ? (
                  <TouchableOpacity
                    style={styles.modalButtonPrimary}
                    onPress={() => handleDialogAction('login')}
                  >
                    <Text style={styles.modalButtonPrimaryText}>Iniciar Sesión</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.modalButtonPrimary}
                    onPress={() => handleDialogAction('recovery')}
                  >
                    <Text style={styles.modalButtonPrimaryText}>Recuperar Acceso</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    color: '#2c2d52ff',
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffffe7',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 5,
    height: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#f44336',
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
  registerButton: {
    flexDirection: 'row',
    backgroundColor: '#e5d9c5e0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
    shadowColor: '#e5d9c5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButtonText: {
    color: '#2c2d52ff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButton: {
    backgroundColor: '#2c2d52ea',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    marginHorizontal: 20,
    maxWidth: 400,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    fontSize: 15,
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButtonPrimary: {
    flex: 1,
    backgroundColor: '#74C1E6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
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
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
});