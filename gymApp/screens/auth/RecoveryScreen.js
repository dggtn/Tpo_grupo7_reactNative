import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
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
      await dispatch(checkPendingRegistration(email)).unwrap();
      setDialogType('found');
      setShowDialog(true);
    } catch (err) {
      console.error('Check pending registration error:', err);
    }
  };

  const handleResendCode = async () => {
    setShowDialog(false);
    try {
      await dispatch(resendCode(email)).unwrap();
      showSuccessToast('Código Enviado', 'Se ha enviado un nuevo código a tu email');
      
      setTimeout(() => {
        navigation.navigate('Verification', { email });
      }, 1500);
    } catch (err) {
      console.error('Resend code error:', err);
    }
  };

  const handleDialogAction = (action) => {
    setShowDialog(false);
    
    switch (action) {
      case 'register':
        navigation.navigate('Register', { email });
        break;
      case 'cancel':
        break;
      case 'resend':
        handleResendCode();
        break;
      case 'newRegister':
        navigation.navigate('Register', { email });
        break;
      default:
        break;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/adaptive-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Recuperar Acceso</Text>

        <Text style={styles.instruction}>
          Si iniciaste un registro pero no completaste la verificación por email, ingresa tu
          correo para recuperar el acceso y recibir un nuevo código.
        </Text>

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, emailError && styles.inputError]}
            placeholder="Ingresa tu email"
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
          onPress={() => navigation.navigate('Login')}
          disabled={isLoading}
        >
          <Ionicons name="arrow-back-outline" size={20} color="#fff" />
          <Text style={styles.loginButtonText}>Volver al Login</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Nota: Solo puedes recuperar registros que no hayan expirado completamente (máximo 24
          horas desde el inicio del registro).
        </Text>
      </View>

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
              size={48} 
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B1A1A1',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
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
    marginBottom: 20,
    color: '#121212',
  },
  instruction: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 5,
    height: 56,
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
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 5,
  },
  checkButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  checkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: '#9CCC65',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    gap: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 12,
    textAlign: 'center',
    color: '#999',
    marginTop: 30,
    lineHeight: 18,
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
    marginBottom: 12,
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
  modalButtonTertiary: {
    paddingVertical: 8,
  },
  modalButtonTertiaryText: {
    color: '#74C1E6',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});