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
  Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import {
  verifyCode,
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

export default function VerificationScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const { email } = route.params;
  const [code, setCode] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [showExpiredDialog, setShowExpiredDialog] = useState(false);

  useEffect(() => {
    if (error) {
      if (error.includes('expirado completamente') || error.includes('iniciar el proceso')) {
        setShowExpiredDialog(true);
      } else {
        showErrorToast('Error', error);
      }
      dispatch(clearError());
    }
  }, [error]);

  const handleVerify = async () => {
    if (!code.trim()) {
      showErrorToast('Error', 'Ingresa el código de verificación');
      return;
    }

    if (code.length !== VALIDATION.CODE_LENGTH) {
      showErrorToast('Error', `El código debe tener ${VALIDATION.CODE_LENGTH} dígitos`);
      return;
    }

    try {
      await dispatch(verifyCode({ email, code })).unwrap();

      showSuccessToast('Registro Exitoso', 'Tu cuenta ha sido verificada');
      
      setTimeout(() => {
        navigation.navigate('Login', { email });
      }, 1500);
    } catch (err) {
      console.error('Verification error:', err);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    try {
      await dispatch(resendCode(email)).unwrap();
      showSuccessToast('Código Reenviado', 'Se ha enviado un nuevo código a tu email');
      setCode('');
    } catch (err) {
      console.error('Resend code error:', err);
    } finally {
      setResendLoading(false);
    }
  };

  const handleExpiredAction = (action) => {
    setShowExpiredDialog(false);
    if (action === 'register') {
      navigation.navigate('Register', { email });
    } else {
      navigation.navigate('Login');
    }
  };

  return (
    <LinearGradient
              colors={['#a9bfc8ff', '#ddcac5ff', '#c3c5a7ff']} // Array of colors for the gradient
              style={styles.container}
              start={{ x: 0, y: 0 }} // Start point of the gradient (top-left)
              end={{ x: 1, y: 1 }}   // End point of the gradient (bottom-right)
      >
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Ionicons name="mail-outline" size={80} color="#c25a06be" />

        <Text style={styles.title}>Confirmar Email</Text>

        <Text style={styles.emailText}>Código enviado a:</Text>
        <Text style={styles.email}>{email}</Text>

        <Text style={styles.instruction}>
          Ingresa el código de 4 dígitos que te enviamos por email
        </Text>

        <TextInput
          style={styles.codeInput}
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={VALIDATION.CODE_LENGTH}
          placeholder="0000"
          textAlign="center"
          editable={!isLoading}
        />

        <TouchableOpacity
          style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.verifyButtonText}>Verificar Código</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendCode}
          disabled={isLoading || resendLoading}
        >
          {resendLoading ? (
            <ActivityIndicator color="#FF9800" />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={20} color="#fff" />
              <Text style={styles.resendButtonText}>Reenviar Código</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.note}>
          Nota: El código expira en 10 minutos. Si no lo recibes, verifica tu carpeta de spam.
        </Text>
      </View>

      {/* Expired Dialog */}
      <Modal
        visible={showExpiredDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExpiredDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="time-outline" size={48} color="#f44336" />
            <Text style={styles.modalTitle}>Registro Expirado</Text>
            <Text style={styles.modalMessage}>
              Tu registro ha expirado completamente. ¿Deseas iniciar un nuevo registro?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => handleExpiredAction('login')}
              >
                <Text style={styles.modalButtonSecondaryText}>Volver al Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={() => handleExpiredAction('register')}
              >
                <Text style={styles.modalButtonPrimaryText}>Sí, registrarme</Text>
              </TouchableOpacity>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    color: '#0b2b24ea',
  },
  emailText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#0b2b24ea',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#0b2b24ea',
    marginBottom: 20,
  },
  instruction: {
    fontSize: 14,
    textAlign: 'center',
    color: '#434040ff',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  codeInput: {
    backgroundColor: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
    width: 200,
  },
  verifyButton: {
    flexDirection: 'row',
    backgroundColor: '#40b88ac3',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    gap: 8,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    flexDirection: 'row',
    backgroundColor: '#e67e10ad',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
    gap: 8,
  },
  resendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 12,
    textAlign: 'center',
    color: '#434040ff',
    paddingHorizontal: 20,
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