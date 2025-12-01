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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VALIDATION } from '../../../config/constants';
import {
  showErrorToast,
  showSuccessToast,
  showInfoToast,
} from '../../../utils/toastUtils';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.12:8080' || 'http://10.0.2.2:8080';
const RESEND_COOLDOWN = 120; // 2 minutos
const CODE_EXPIRATION = 900; // 15 minutos

export default function ResetPassVerifScreen({ navigation, route }) {
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  
  // Contadores
  const [resendCountdown, setResendCountdown] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);
  const [codeExpiration, setCodeExpiration] = useState(CODE_EXPIRATION);
  const [isCodeExpired, setIsCodeExpired] = useState(false);

  useEffect(() => {
    startResendTimer();
    startExpirationTimer();
    
    return () => {
      // Cleanup timers
    };
  }, []);

  const startResendTimer = () => {
    setResendCountdown(RESEND_COOLDOWN);
    setCanResend(false);
    
    const interval = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startExpirationTimer = () => {
    setCodeExpiration(CODE_EXPIRATION);
    setIsCodeExpired(false);
    
    const interval = setInterval(() => {
      setCodeExpiration((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsCodeExpired(true);
          showInfoToast('Código Expirado', 'Solicita un nuevo código');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifyCode = async () => {
    if (isCodeExpired) {
      showErrorToast('Código Expirado', 'Solicita un nuevo código');
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

    setIsLoading(true);
    try {
      console.log('[ResetVerification] 🔐 Verificando código para:', email);

      const response = await fetch(`${API_URL}/auth/verify-reset-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          code 
        }),
      });

      const data = await response.json();

      if (data.ok) {
        console.log('[ResetVerification] ✅ Código verificado');
        showSuccessToast('Código Verificado', 'Ahora puedes cambiar tu contraseña');
        
        // Navegar a pantalla de nueva contraseña
        setTimeout(() => {
          navigation.navigate('NewPassword', { email, code });
        }, 1500);
      } else {
        console.error('[ResetVerification] ❌ Error:', data.error);
        showErrorToast('Error', data.error || 'Código inválido');
      }
    } catch (error) {
      console.error('[ResetVerification] ❌ Error de red:', error);
      showErrorToast('Error de Conexión', 'Verifica tu internet');
    } finally {
      setIsLoading(false);
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

    setResendLoading(true);
    try {
      console.log('[ResetVerification] 📧 Reenviando código a:', email);

      const response = await fetch(`${API_URL}/auth/resend-reset-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.ok) {
        showSuccessToast('Código Reenviado', 'Revisa tu email');
        setCode('');
        startResendTimer();
        startExpirationTimer();
      } else {
        showErrorToast('Error', data.error || 'No se pudo reenviar el código');
      }
    } catch (error) {
      console.error('[ResetVerification] ❌ Error:', error);
      showErrorToast('Error de Conexión', 'Verifica tu internet');
    } finally {
      setResendLoading(false);
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
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark-outline" size={80} color="#c25a06be" />
          </View>

          <Text style={styles.title}>Verificar Código</Text>

          <View style={styles.emailContainer}>
            <Text style={styles.emailLabel}>Código enviado a:</Text>
            <Text style={styles.email}>{email}</Text>
          </View>

          <Text style={styles.instruction}>
            Ingresa el código de 4 dígitos que te enviamos por email
          </Text>

          {/* Timer de expiración */}
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

          {/* Input de código */}
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

          {/* Botón verificar */}
          <TouchableOpacity
            style={[
              styles.verifyButton,
              (isLoading || isCodeExpired) && styles.buttonDisabled
            ]}
            onPress={handleVerifyCode}
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

          {/* Botón reenviar */}
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

          {/* Notas */}
          <View style={styles.noteContainer}>
            <Ionicons name="information-circle-outline" size={18} color="#666" />
            <Text style={styles.note}>
              El código expira en 15 minutos. Puedes solicitar uno nuevo después de 2 minutos.
            </Text>
          </View>
        </View>
        </ScrollView>
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
});