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

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.12:8080' || 'http://10.0.2.2:8080';

export default function NewPasswordScreen({ navigation, route }) {
  const { email, code } = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Validación de fortaleza de contraseña
  const checkPasswordStrength = (password) => {
    const checks = {
      hasLength: password.length >= VALIDATION.PASSWORD_MIN_LENGTH,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
    };

    return checks;
  };

  const passwordChecks = checkPasswordStrength(newPassword);

  const validateForm = () => {
    const newErrors = {};

    if (!newPassword.trim()) {
      newErrors.newPassword = 'Contraseña requerida';
    } else if (newPassword.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      newErrors.newPassword = `Mínimo ${VALIDATION.PASSWORD_MIN_LENGTH} caracteres`;
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      console.log('[NewPassword] 🔐 Reseteando contraseña para:', email);

      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code,
          newPassword,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        console.log('[NewPassword] ✅ Contraseña actualizada');
        showSuccessToast(
          '¡Contraseña Actualizada!',
          'Ya puedes iniciar sesión con tu nueva contraseña'
        );

        // Navegar al login después de un delay
        setTimeout(() => {
          navigation.navigate('Login', { email });
        }, 2000);
      } else {
        console.error('[NewPassword] ❌ Error:', data.error);
        showErrorToast('Error', data.error || 'No se pudo actualizar la contraseña');
      }
    } catch (error) {
      console.error('[NewPassword] ❌ Error de red:', error);
      showErrorToast('Error de Conexión', 'Verifica tu internet');
    } finally {
      setIsLoading(false);
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
          <View style={styles.header}>
            <Ionicons name="key-outline" size={80} color="#fcefd5de" />
            <Text style={styles.title}>Nueva Contraseña</Text>
            <Text style={styles.subtitle}>Crea una contraseña segura</Text>
          </View>

          <View style={styles.card}>
            {/* Nueva Contraseña */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, errors.newPassword && styles.inputError]}
                placeholder="Nueva contraseña"
                placeholderTextColor="#999"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  if (errors.newPassword) setErrors({ ...errors, newPassword: null });
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
            {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword}</Text>}

            {/* Indicadores de fortaleza */}
            {newPassword.length > 0 && (
              <View style={styles.strengthContainer}>
                <Text style={styles.strengthTitle}>Fortaleza de contraseña:</Text>
                <View style={styles.checkItem}>
                  <Ionicons
                    name={passwordChecks.hasLength ? "checkmark-circle" : "close-circle"}
                    size={16}
                    color={passwordChecks.hasLength ? "#4CAF50" : "#f44336"}
                  />
                  <Text style={styles.checkText}>Mínimo 6 caracteres</Text>
                </View>
                <View style={styles.checkItem}>
                  <Ionicons
                    name={passwordChecks.hasUpperCase ? "checkmark-circle" : "close-circle"}
                    size={16}
                    color={passwordChecks.hasUpperCase ? "#4CAF50" : "#f44336"}
                  />
                  <Text style={styles.checkText}>Mayúscula</Text>
                </View>
                <View style={styles.checkItem}>
                  <Ionicons
                    name={passwordChecks.hasLowerCase ? "checkmark-circle" : "close-circle"}
                    size={16}
                    color={passwordChecks.hasLowerCase ? "#4CAF50" : "#f44336"}
                  />
                  <Text style={styles.checkText}>Minúscula</Text>
                </View>
                <View style={styles.checkItem}>
                  <Ionicons
                    name={passwordChecks.hasNumber ? "checkmark-circle" : "close-circle"}
                    size={16}
                    color={passwordChecks.hasNumber ? "#4CAF50" : "#f44336"}
                  />
                  <Text style={styles.checkText}>Número</Text>
                </View>
              </View>
            )}

            {/* Confirmar Contraseña */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                placeholder="Confirmar contraseña"
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

            {/* Botón Actualizar */}
            <TouchableOpacity
              style={[styles.updateButton, isLoading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#2c2d52ff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#2c2d52ff" />
                  <Text style={styles.updateButtonText}>Actualizar Contraseña</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Nota de seguridad */}
            <View style={styles.infoBox}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#4CAF50" />
              <Text style={styles.infoText}>
                Tu contraseña será encriptada de forma segura
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
  header: {
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
    fontSize: 16,
    color: '#ffffffe7',
    marginTop: 5,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
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
  strengthContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  strengthTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  checkText: {
    fontSize: 12,
    color: '#666',
  },
  updateButton: {
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
  updateButtonText: {
    color: '#2c2d52ff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#4CAF50',
    lineHeight: 18,
  },
});