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
  checkPendingRegistration,
  resendCode,
  clearError,
  selectAuthLoading,
  selectAuthError,
  setPendingEmail,
} from '../../../store/slices/authSlice';
import { VALIDATION } from '../../../config/constants';
import {
  showErrorToast,
  showSuccessToast,
  showInfoToast,
} from '../../../utils/toastUtils';

export default function RecoveryScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const [email, setEmail] = useState(route.params?.email || '');
  const [emailError, setEmailError] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState(null);

  useEffect(() => {
    if (error) {
      if (error.includes('No hay registro pendiente')) {
        setDialogType('noRegistration');
        setShowDialog(true);
      } else {
        showErrorToast('Error', error);
      }
      dispatch(clearError());
    }
  }, [error]);

  const validateEmail = () => {
    if (!email.trim()) {
      setEmailError('Email requerido');
      return false;
    }

    if (!VALIDATION.EMAIL_REGEX.test(email)) {
      setEmailError('Email inválido');
      return false;
    }

    return true;
  };

  const handleCheckEmail = async () => {
    if (!validateEmail()) return;

    try {
      console.log('[RecoveryScreen] 🔍 Verificando email pendiente:', email);
      await dispatch(checkPendingRegistration(email)).unwrap();
      
      console.log('[RecoveryScreen] ✅ Registro pendiente encontrado');
      setDialogType('found');
      setShowDialog(true);
    } catch (err) {
      console.error('[RecoveryScreen] ❌ Error:', err);
      // El error ya se maneja en el useEffect
    }
  };

  const handleResendCode = async () => {
    setShowDialog(false);
    try {
      console.log('[RecoveryScreen] 📧 Reenviando código a:', email);
      await dispatch(resendCode(email)).unwrap();
      
      // Guardar email como pendiente en el estado
      dispatch(setPendingEmail(email));
      
      showSuccessToast('Código Enviado', 'Se ha enviado un nuevo código a tu email');
      
      setTimeout(() => {
        navigation.navigate('Verification', { email });
      }, 1500);
    } catch (err) {
      console.error('[RecoveryScreen] ❌ Error reenviando código:', err);
    }
  };

  const handleDialogAction = (action) => {
    setShowDialog(false);
    
    switch (action) {
      case 'register':
        console.log('[RecoveryScreen] 🔄 Navegando a Register');
        navigation.navigate('Register', { email });
        break;
      case 'cancel':
        break;
      case 'resend':
        handleResendCode();
        break;
      case 'newRegister':
        console.log('[RecoveryScreen] 🆕 Iniciando nuevo registro');
        navigation.navigate('Register', { email });
        break;
      default:
        break;
    }
  };

  return (
    <LinearGradient
      colors={['#a9bfc8ff', '#ddcac5ff', '#c3c5a7ff']}
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
          <View style={styles.header}>
            <Ionicons name="key-outline" size={80} color="#5a7a87" />
            <Text style={styles.title}>Recuperar Acceso</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.instruction}>
              Si iniciaste un registro pero no completaste la verificación por email, 
              ingresa tu correo para recuperar el acceso y recibir un nuevo código.
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, emailError && styles.inputError]}
                placeholder="Ingresa tu email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

            <TouchableOpacity
              style={[styles.checkButton, isLoading && styles.buttonDisabled]}
              onPress={handleCheckEmail}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="search-outline" size={20} color="#fff" />
                  <Text style={styles.checkButtonText}>Verificar Email</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.goBack()}
              disabled={isLoading}
            >
              <Ionicons name="arrow-back-outline" size={20} color="#5a7a87" />
              <Text style={styles.loginButtonText}>Volver al Login</Text>
            </TouchableOpacity>

            <View style={styles.noteContainer}>
              <Ionicons name="information-circle-outline" size={18} color="#666" />
              <Text style={styles.note}>
                Solo puedes recuperar registros que no hayan expirado 
                (máximo 24 horas desde el inicio del registro).
              </Text>
            </View>
          </View>
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
                name={dialogType === 'found' ? 'checkmark-circle' : 'alert-circle'} 
                size={64} 
                color={dialogType === 'found' ? '#4CAF50' : '#FF9800'} 
              />
              <Text style={styles.modalTitle}>
                {dialogType === 'found' ? 'Registro Pendiente Encontrado' : 'Sin Registro Pendiente'}
              </Text>
              <Text style={styles.modalMessage}>
                {dialogType === 'found'
                  ? `Tienes un registro pendiente de verificación para ${email}. ¿Deseas que te enviemos un nuevo código de verificación?`
                  : `No hay registro pendiente para este email. Puedes registrarte normalmente.`}
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonSecondary}
                  onPress={() => handleDialogAction('cancel')}
                >
                  <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButtonPrimary}
                  onPress={() => handleDialogAction(dialogType === 'found' ? 'resend' : 'register')}
                >
                  <Text style={styles.modalButtonPrimaryText}>
                    {dialogType === 'found' ? 'Enviar código' : 'Ir a Registro'}
                  </Text>
                </TouchableOpacity>
              </View>
              {dialogType === 'found' && (
                <TouchableOpacity
                  style={styles.modalButtonTertiary}
                  onPress={() => handleDialogAction('newRegister')}
                >
                  <Text style={styles.modalButtonTertiaryText}>Iniciar nuevo registro</Text>
                </TouchableOpacity>
              )}
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
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
    color: '#0b2b24ea',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  instruction: {
    fontSize: 15,
    textAlign: 'center',
    color: '#434040ff',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 5,
    height: 56,
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
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
  checkButton: {
    flexDirection: 'row',
    backgroundColor: '#40b88ac3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
    shadowColor: '#40b88a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  checkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: '#5a7a87',
  },
  loginButtonText: {
    color: '#5a7a87',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  note: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
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
    marginBottom: 12,
  },
  modalButtonPrimary: {
    flex: 1,
    backgroundColor: '#40b88a',
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
  modalButtonTertiary: {
    paddingVertical: 10,
  },
  modalButtonTertiaryText: {
    color: '#40b88a',
    fontSize: 14,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});