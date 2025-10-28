import React, { useState } from 'react';
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
} from '../../../utils/toastUtils';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8080';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSendCode = async () => {
    if (!validateEmail()) return;

    setIsLoading(true);
    try {
      console.log('[ForgotPassword] 📧 Enviando solicitud para:', email);

      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (data.ok) {
        console.log('[ForgotPassword] ✅ Código enviado');
        showSuccessToast('Código Enviado', 'Revisa tu email para el código de recuperación');
        
        // Navegar a pantalla de verificación
        setTimeout(() => {
          navigation.navigate('ResetPasswordVerification', { email: email.trim().toLowerCase() });
        }, 1500);
      } else {
        console.error('[ForgotPassword] ❌ Error:', data.error);
        showErrorToast('Error', data.error || 'No se pudo enviar el código');
      }
    } catch (error) {
      console.error('[ForgotPassword] ❌ Error de red:', error);
      showErrorToast('Error de Conexión', 'Verifica tu internet');
    } finally {
      setIsLoading(false);
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
            <Ionicons name="lock-closed-outline" size={80} color="#5a7a87" />
            <Text style={styles.title}>¿Olvidaste tu Contraseña?</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.instruction}>
              Ingresa tu email y te enviaremos un código de verificación para restablecer tu contraseña.
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
              style={[styles.sendButton, isLoading && styles.buttonDisabled]}
              onPress={handleSendCode}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send-outline" size={20} color="#fff" />
                  <Text style={styles.sendButtonText}>Enviar Código</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              disabled={isLoading}
            >
              <Ionicons name="arrow-back-outline" size={20} color="#5a7a87" />
              <Text style={styles.backButtonText}>Volver al Login</Text>
            </TouchableOpacity>

            <View style={styles.noteContainer}>
              <Ionicons name="information-circle-outline" size={18} color="#666" />
              <Text style={styles.note}>
                El código expirará en 15 minutos. Revisa tu carpeta de spam si no lo recibes.
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
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
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
  sendButton: {
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
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
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
  backButtonText: {
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
});