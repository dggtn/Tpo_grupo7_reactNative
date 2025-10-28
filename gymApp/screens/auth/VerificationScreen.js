import React, { useState, useEffect, useRef } from 'react';
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
  clearPendingEmail,
} from '../../../store/slices/authSlice';
import { VALIDATION } from '../../../config/constants';
import {
  showErrorToast,
  showSuccessToast,
  showInfoToast,
} from '../../../utils/toastUtils';

const RESEND_COOLDOWN = 120; // 2 minutos en segundos
const CODE_EXPIRATION = 600; // 10 minutos en segundos

export default function VerificationScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const { email } = route.params;
  const [code, setCode] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [showExpiredDialog, setShowExpiredDialog] = useState(false);
  
  // Estados para el contador
  const [resendCountdown, setResendCountdown] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);
  const [codeExpiration, setCodeExpiration] = useState(CODE_EXPIRATION);
  const [isCodeExpired, setIsCodeExpired] = useState(false);
  
  const resendTimerRef = useRef(null);
  const expirationTimerRef = useRef(null);

  useEffect(() => {
    console.log('[VerificationScreen] 📧 Email para verificar:', email);
    
    // Iniciar contadores al montar
    startResendTimer();
    startExpirationTimer();
    
    // Cleanup al desmontar
    return () => {
      if (resendTimerRef.current) clearInterval(resendTimerRef.current);
      if (expirationTimerRef.current) clearInterval(expirationTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (error) {
      console.log('[VerificationScreen] ❌ Error detectado:', error);
      
      if (error.includes('expirado completamente') || error.includes('iniciar el proceso')) {
        setShowExpiredDialog(true);
      } else {
        showErrorToast('Error', error);
      }
      dispatch(clearError());
    }
  }, [error]);

  // Contador para reenvío (2 minutos)
  const startResendTimer = () => {
    setResendCountdown(RESEND_COOLDOWN);
    setCanResend(false);
    
    if (resendTimerRef.current) {
      clearInterval(resendTimerRef.current);
    }
    
    resendTimerRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(resendTimerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Contador para expiración del código (10 minutos)
  const startExpirationTimer = () => {
    setCodeExpiration(CODE_EXPIRATION);
    setIsCodeExpired(false);
    
    if (expirationTimerRef.current) {
      clearInterval(expirationTimerRef.current);
    }
    
    expirationTimerRef.current = setInterval(() => {
      setCodeExpiration((prev) => {
        if (prev <= 1) {
          clearInterval(expirationTimerRef.current);
          setIsCodeExpired(true);
          showWarningToast('Código Expirado', 'Debes solicitar un nuevo código');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Formatear tiempo en MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = async () => {
    if (isCodeExpired) {
      showErrorToast('Código Expirado', 'Debes solicitar un nuevo código');
      return;
    }

    if (!code.trim()) {
      showErrorToast('Error', 'Ingresa el código de verificación');
      return;
    }

    if (code.length !== VALIDATION.CODE_LENGTH) {
      showErrorToast('Error', `El código debe tener ${VALIDATION.CODE_LENGTH} dígitos`);
      return;
    }

    try {
      console.log('[VerificationScreen] 🔐 Verificando código para:', email);
      await dispatch(verifyCode({ email, code })).unwrap();

      console.log('[VerificationScreen] ✅ Verificación exitosa');
      dispatch(clearPendingEmail());
      
      // Limpiar timers
      if (resendTimerRef.current) clearInterval(resendTimerRef.current);
      if (expirationTimerRef.current) clearInterval(expirationTimerRef.current);
      
      showSuccessToast('¡Registro Exitoso!', 'Tu cuenta ha sido verificada correctamente');
      
      setTimeout(() => {
        navigation.navigate('Login', { email });
      }, 1500);
    } catch (err) {
      console.error('[VerificationScreen] ❌ Error en verificación:', err);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) {
      showInfoToast(
        'Espera un momento', 
        `Podrás reenviar el código en ${formatTime(resendCountdown)}`
      );
      return;
    }

    if (!email) {
      showErrorToast('Error', 'Email no disponible');
      return;
    }

    setResendLoading(true);
    try {
      console.log('[VerificationScreen] 📧 Reenviando código a:', email);
      await dispatch(resendCode(email)).unwrap();
      
      showSuccessToast('Código Reenviado', 'Se ha enviado un nuevo código a tu email');
      setCode('');
      
      // Reiniciar ambos contadores
      startResendTimer();
      startExpirationTimer();
      
    } catch (err) {
      console.error('[VerificationScreen] ❌ Error reenviando código:', err);
      
      if (err.includes('expirado completamente') || err.includes('iniciar el proceso')) {
        setShowExpiredDialog(true);
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleExpiredAction = (action) => {
    setShowExpiredDialog(false);
    dispatch(clearPendingEmail());
    
    // Limpiar timers
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    if (expirationTimerRef.current) clearInterval(expirationTimerRef.current);
    
    if (action === 'register') {
      console.log('[VerificationScreen] 🔄 Navegando a Register por expiración');
      navigation.navigate('Register', { email });
    } else {
      console.log('[VerificationScreen] 🔄 Navegando a Login');
      navigation.navigate('Login');
    }
  };

  const showWarningToast = (title, message) => {
    showInfoToast(title, message);
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
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail-outline" size={80} color="#c25a06be" />
          </View>

          <Text style={styles.title}>Confirmar Email</Text>

          <View style={styles.emailContainer}>
            <Text style={styles.emailLabel}>Código enviado a:</Text>
            <Text style={styles.email}>{email}</Text>
          </View>

          <Text style={styles.instruction}>
            Ingresa el código de 4 dígitos que te enviamos por email
          </Text>

          {/* Indicador de expiración del código */}
          <View style={[
            styles.timerContainer, 
            isCodeExpired && styles.timerContainerExpired
          ]}>
            <Ionicons 
              name={isCodeExpired ? "alert-circle" : "time-outline"} 
              size={18} 
              color={isCodeExpired ? "#f44336" : "#40b88a"} 
            />
            <Text style={[
              styles.timerText,
              isCodeExpired && styles.timerTextExpired
            ]}>
              {isCodeExpired 
                ? 'Código expirado' 
                : `Código válido por: ${formatTime(codeExpiration)}`
              }
            </Text>
          </View>

          <TextInput
            style={[
              styles.codeInput,
              isCodeExpired && styles.codeInputDisabled
            ]}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={VALIDATION.CODE_LENGTH}
            placeholder="0000"
            placeholderTextColor="#999"
            textAlign="center"
            editable={!isLoading && !isCodeExpired}
            autoFocus={true}
          />

          <TouchableOpacity
            style={[
              styles.verifyButton, 
              (isLoading || isCodeExpired) && styles.buttonDisabled
            ]}
            onPress={handleVerify}
            disabled={isLoading || isCodeExpired}
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

          {/* Botón de reenvío con contador */}
          <TouchableOpacity
            style={[
              styles.resendButton, 
              (!canResend || isLoading || resendLoading) && styles.resendButtonDisabled
            ]}
            onPress={handleResendCode}
            disabled={!canResend || isLoading || resendLoading}
          >
            {resendLoading ? (
              <ActivityIndicator color="#e67e10" />
            ) : (
              <>
                <Ionicons 
                  name={canResend ? "refresh-outline" : "time-outline"} 
                  size={20} 
                  color={canResend ? "#fff" : "#999"} 
                />
                <Text style={[
                  styles.resendButtonText,
                  !canResend && styles.resendButtonTextDisabled
                ]}>
                  {canResend 
                    ? 'Reenviar Código' 
                    : `Reenviar en ${formatTime(resendCountdown)}`
                  }
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Información adicional */}
          <View style={styles.noteContainer}>
            <Ionicons name="information-circle-outline" size={18} color="#666" />
            <Text style={styles.note}>
              El código expira en 10 minutos. Puedes solicitar uno nuevo después de 2 minutos.
            </Text>
          </View>

          <View style={styles.noteContainer}>
            <Ionicons name="mail-outline" size={18} color="#666" />
            <Text style={styles.note}>
              Si no recibes el código, verifica tu carpeta de spam.
            </Text>
          </View>
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
              <Ionicons name="time-outline" size={64} color="#f44336" />
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
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(194, 90, 6, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#0b2b24ea',
  },
  emailContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  emailLabel: {
    fontSize: 15,
    color: '#0b2b24ea',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0b2b24ea',
  },
  instruction: {
    fontSize: 14,
    textAlign: 'center',
    color: '#434040ff',
    marginBottom: 16,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(64, 184, 138, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#40b88a',
    gap: 8,
  },
  timerContainerExpired: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderColor: '#f44336',
  },
  timerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#40b88a',
  },
  timerTextExpired: {
    color: '#f44336',
  },
  codeInput: {
    backgroundColor: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
    width: 200,
    letterSpacing: 12,
    borderWidth: 2,
    borderColor: '#40b88a',
    shadowColor: '#40b88a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  codeInputDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
    opacity: 0.6,
  },
  verifyButton: {
    flexDirection: 'row',
    backgroundColor: '#40b88ac3',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
    shadowColor: '#40b88a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 240,
    justifyContent: 'center',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    flexDirection: 'row',
    backgroundColor: '#e67e10ad',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
    minWidth: 240,
    justifyContent: 'center',
  },
  resendButtonDisabled: {
    backgroundColor: '#e0e0e0',
    opacity: 0.7,
  },
  resendButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  resendButtonTextDisabled: {
    color: '#999',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    maxWidth: 320,
    gap: 8,
    marginBottom: 12,
  },
  note: {
    flex: 1,
    fontSize: 12,
    textAlign: 'center',
    color: '#434040ff',
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
    fontSize: 22,
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
});