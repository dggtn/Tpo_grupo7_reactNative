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
  authenticateWithBiometric,
  enableBiometric,
  selectBiometricEnabled,
  selectBiometricUserEmail,
  selectBiometricAvailable,
  checkBiometricAvailability,
  updateLastUsed,
  
} from '../../../store/slices/biometricSlice';
import { setUserEmail } from '../../../store/slices/userSlice';
import { showErrorToast, showSuccessToast } from '../../../utils/toastUtils';
import { validateLoginForm } from '../../../utils/validationUtils';
import BiometricPromptModal from '../../components/BiometricPromptModal';
import { getBiometricTypeName } from '../../../utils/biometricUtils';
import {
  saveBiometricCredentials,
  getBiometricCredentials,
} from '../../../utils/biometricStorageUtils';

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);
  const biometricEnabled = useSelector(selectBiometricEnabled);
  const biometricUserEmail = useSelector(selectBiometricUserEmail);
  const biometricAvailable = useSelector(selectBiometricAvailable);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [biometricTypeName, setBiometricTypeName] = useState('Huella Digital');
  const [justLoggedInEmail, setJustLoggedInEmail] = useState(null);
  const [justLoggedInData, setJustLoggedInData] = useState(null);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    // Verificar disponibilidad de biometría
    dispatch(checkBiometricAvailability());
    
    // Cargar tipo de biometría
    const typeName = await getBiometricTypeName();
    setBiometricTypeName(typeName);

    // Si hay biometría habilitada, pre-llenar el email
    if (biometricEnabled && biometricUserEmail) {
      setEmail(biometricUserEmail);
      console.log('[LoginScreen] Biometría habilitada para:', biometricUserEmail);
    }
  };

  const handleBiometricLogin = async () => {
    if (!biometricEnabled || !biometricUserEmail) {
      showErrorToast('Error', 'Biometría no configurada');
      return;
    }

    setIsBiometricLoading(true);

    try {
      console.log('[LoginScreen] Iniciando login biométrico...');
      
      // 1. Autenticar con biometría
      await dispatch(authenticateWithBiometric('Iniciar sesión con ' + biometricTypeName)).unwrap();
      
      console.log('[LoginScreen] Autenticación biométrica exitosa');
      
      // 2. Obtener credenciales guardadas
      const credentials = await getBiometricCredentials();
      
      if (!credentials) {
        showErrorToast('Error', 'No se encontraron credenciales guardadas');
        setIsBiometricLoading(false);
        return;
      }

      // 3. Hacer login con las credenciales
      // NOTA: Aquí estamos usando las credenciales guardadas
      // En producción, deberías usar un refresh token o sistema similar
      await dispatch(login({ 
        email: credentials.email, 
        password: credentials.hashedPassword 
      })).unwrap();
      
      // 4. Actualizar último uso
      await dispatch(updateLastUsed()).unwrap();
      
      console.log('[LoginScreen] Login biométrico completo');
      showSuccessToast('Bienvenido', 'Inicio de sesión exitoso');
      
    } catch (error) {
      console.error('[LoginScreen] Error en login biométrico:', error);
      
      // Si el error es por credenciales inválidas, desactivar biometría
      if (error.includes('credenciales') || error.includes('401')) {
        showErrorToast(
          'Credenciales Expiradas', 
          'Por favor inicia sesión con tu contraseña'
        );
        // Opcional: desactivar biometría automáticamente
        // await dispatch(disableBiometric());
      } else {
        showErrorToast('Error', 'No se pudo autenticar con biometría');
      }
    } finally {
      setIsBiometricLoading(false);
    }
  };

  const handleLogin = async () => {
    // Validar formulario
    const validation = validateLoginForm(email, password);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});

    try {
      console.log('[LoginScreen] Intentando login con:', email);
      
      // Realizar login
      const result = await dispatch(login({ email, password })).unwrap();
      
      console.log('[LoginScreen] Login exitoso');
      
      // Guardar email en el slice de usuario
      dispatch(setUserEmail(email));
      
      // Guardar datos para configuración de biometría
      setJustLoggedInData({ email, password });
      
      showSuccessToast('Bienvenido', 'Inicio de sesión exitoso');
      
      // Si la biometría está disponible y NO está habilitada, preguntar
      if (biometricAvailable && !biometricEnabled) {
        console.log('[LoginScreen] Mostrando prompt de biometría');
         // Esperar un poco para que el usuario vea la pantalla principal
        setTimeout(() => {
          setShowBiometricPrompt(true);
        }, 1000);
      }
      
    } catch (error) {
      console.error('[LoginScreen] Error en login:', error);
      showErrorToast('Error', error || 'Error al iniciar sesión');
      setErrors({ general: error || 'Credenciales inválidas' });
    }
  };

  const handleBiometricPromptAccept = async () => {
    setShowBiometricPrompt(false);
    
    if (!justLoggedInData) {
      showErrorToast('Error', 'No se pudieron guardar las credenciales');
      return;
    }

    try {
      console.log('[LoginScreen] Configurando biometría...');
      
      // 1. Autenticar para verificar que funciona
      await dispatch(authenticateWithBiometric('Configurar ' + biometricTypeName)).unwrap();
      
      console.log('[LoginScreen] Prueba biométrica exitosa');
      
      // 2. Guardar credenciales de forma segura
      const saved = await saveBiometricCredentials(
        justLoggedInData.email,
        justLoggedInData.password
      );
      
      if (!saved) {
        throw new Error('No se pudieron guardar las credenciales');
      }
      
      // 3. Habilitar biometría en el estado
      await dispatch(enableBiometric(justLoggedInData.email)).unwrap();
      
      console.log('[LoginScreen] Biometría configurada exitosamente');
      showSuccessToast('¡Listo!', 'Biometría activada correctamente');
      
      // Limpiar datos temporales
      setJustLoggedInData(null);
      
    } catch (error) {
      console.error('[LoginScreen] Error configurando biometría:', error);
      showErrorToast('Error', 'No se pudo activar la biometría');
    }
  };

  const handleBiometricPromptDecline = () => {
    setShowBiometricPrompt(false);
    setJustLoggedInData(null);
    console.log('[LoginScreen] Usuario rechazó biometría');
  };

  const handleBiometricPromptLater = () => {
    setShowBiometricPrompt(false);
    // NO limpiar justLoggedInData para poder preguntar después
    console.log('[LoginScreen] Usuario pospuso decisión de biometría');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="barbell" size={64} color="#74C1E6" />
          <Text style={styles.title}>RitmoFit</Text>
          <Text style={styles.subtitle}>Bienvenido de vuelta</Text>
        </View>

        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading && !isBiometricLoading}
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isLoading && !isBiometricLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          {errors.general && <Text style={styles.errorText}>{errors.general}</Text>}

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, (isLoading || isBiometricLoading) && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading || isBiometricLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          {/* Biometric Login Button */}
          {biometricEnabled && biometricUserEmail === email && (
            <TouchableOpacity
              style={[styles.biometricButton, isBiometricLoading && styles.buttonDisabled]}
              onPress={handleBiometricLogin}
              disabled={isLoading || isBiometricLoading}
            >
              {isBiometricLoading ? (
                <ActivityIndicator color="#74C1E6" />
              ) : (
                <>
                  <Ionicons name="finger-print" size={24} color="#74C1E6" />
                  <Text style={styles.biometricButtonText}>
                    Usar {biometricTypeName}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Regístrate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Biometric Prompt Modal */}
      <BiometricPromptModal
        visible={showBiometricPrompt}
        onAccept={handleBiometricPromptAccept}
        onDecline={handleBiometricPromptDecline}
        onLater={handleBiometricPromptLater}
        biometricType={biometricTypeName}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#74C1E6',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  loginButton: {
    backgroundColor: '#74C1E6',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#74C1E6',
    gap: 8,
    backgroundColor: 'rgba(116, 193, 230, 0.05)',
  },
  biometricButtonText: {
    color: '#74C1E6',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#666',
    fontSize: 14,
  },
  registerLink: {
    color: '#74C1E6',
    fontSize: 14,
    fontWeight: 'bold',
  },
});