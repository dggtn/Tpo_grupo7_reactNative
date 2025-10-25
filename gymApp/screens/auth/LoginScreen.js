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
  ScrollView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { login, selectAuthLoading } from '../../../store/slices/authSlice';
import {
  authenticateWithBiometric,
  selectBiometricEnabled,
  selectBiometricUserEmail,
  selectBiometricAvailable,
  checkBiometricAvailability,
} from '../../../store/slices/biometricSlice';
import { showSuccessToast, showErrorToast } from '../../../utils/toastUtils';
import { getBiometricCredentials } from '../../../utils/biometricStorageUtils';
import { getBiometricTypeName } from '../../../utils/biometricUtils';
import BiometricPromptModal from '../../components/BiometricPromptModal';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [biometricTypeName, setBiometricTypeName] = useState('Huella Digital');
  const [showBiometricSetupModal, setShowBiometricSetupModal] = useState(false);
  
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);
  const biometricEnabled = useSelector(selectBiometricEnabled);
  const biometricUserEmail = useSelector(selectBiometricUserEmail);
  const biometricAvailable = useSelector(selectBiometricAvailable);

  useEffect(() => {
    console.log('[LoginScreen] 🚀 Inicializando...');
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      await dispatch(checkBiometricAvailability()).unwrap();
      const typeName = await getBiometricTypeName();
      setBiometricTypeName(typeName);
      console.log('[LoginScreen] ✅ Inicialización completa. Tipo:', typeName);
    } catch (error) {
      console.error('[LoginScreen] ❌ Error en inicialización:', error);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      console.log('[LoginScreen] 🔐 Iniciando login biométrico...');
      
      // 1. Autenticar con biometría/PIN
      await dispatch(authenticateWithBiometric('Iniciar sesión con ' + biometricTypeName)).unwrap();
      console.log('[LoginScreen] ✅ Autenticación biométrica exitosa');
      
      // 2. Recuperar credenciales guardadas
      const credentials = await getBiometricCredentials();
      
      if (!credentials || !credentials.email || !credentials.password) {
        throw new Error('No se encontraron credenciales guardadas');
      }
      
      console.log('[LoginScreen] 📧 Credenciales recuperadas para:', credentials.email);
      
      // 3. Login normal con credenciales
      await dispatch(login({
        email: credentials.email,
        password: credentials.password
      })).unwrap();
      
      console.log('[LoginScreen] ✅ Login biométrico completado');
      showSuccessToast('¡Bienvenido!', 'Login exitoso con ' + biometricTypeName);
      
    } catch (error) {
      console.error('[LoginScreen] ❌ Error en login biométrico:', error);
      
      const errorMsg = error.toString().toLowerCase();
      
      if (errorMsg.includes('cancelada') || errorMsg.includes('cancel')) {
        showErrorToast('Cancelado', 'Autenticación cancelada');
      } else if (errorMsg.includes('credenciales')) {
        showErrorToast('Error', 'Credenciales no disponibles. Inicia sesión normalmente.');
      } else {
        showErrorToast('Error', 'No se pudo iniciar sesión con biometría');
      }
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showErrorToast('Error', 'Por favor completa todos los campos');
      return;
    }

    try {
      console.log('[LoginScreen] 🔑 Iniciando login normal para:', email);
      
      await dispatch(login({ 
        email: email.trim().toLowerCase(), 
        password 
      })).unwrap();
      
      console.log('[LoginScreen] ✅ Login exitoso');
      showSuccessToast('¡Bienvenido!', 'Has iniciado sesión correctamente');
      
      // ✅ CRÍTICO: Verificar si debe mostrar modal biométrico
      // Solo mostrar si:
      // 1. Biometría disponible en dispositivo
      // 2. Usuario NO tiene biometría habilitada
      // 3. El email del login NO es el mismo que el de biometría guardada
      if (biometricAvailable && 
          (!biometricEnabled || biometricUserEmail !== email.trim().toLowerCase())) {
        console.log('[LoginScreen] 🔔 Mostrando modal de configuración biométrica');
        // Esperar un poco para que el login se complete
        setTimeout(() => {
          setShowBiometricSetupModal(true);
        }, 500);
      }
      
    } catch (error) {
      console.error('[LoginScreen] ❌ Error en login:', error);
      showErrorToast('Error', error || 'Credenciales inválidas');
    }
  };

  const handleBiometricSetupAccept = () => {
    console.log('[LoginScreen] ✅ Usuario aceptó configurar biometría');
    setShowBiometricSetupModal(false);
    // Navegar al perfil para configurar
    // La navegación se hace automáticamente al estar autenticado
  };

  const handleBiometricSetupDecline = () => {
    console.log('[LoginScreen] ❌ Usuario rechazó biometría');
    setShowBiometricSetupModal(false);
  };

  const handleBiometricSetupLater = () => {
    console.log('[LoginScreen] ⏰ Usuario pospuso biometría');
    setShowBiometricSetupModal(false);
  };

  const shouldShowBiometricButton = biometricEnabled && 
                                    biometricAvailable && 
                                    biometricUserEmail;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Ionicons name="barbell" size={64} color="#3a8f98ff" />
          <Text style={styles.title}>RitmoFit</Text>
          <Text style={styles.subtitle}>Bienvenido de vuelta</Text>
        </View>

        {/* Botón de Login Biométrico */}
        {shouldShowBiometricButton && (
          <>
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricLogin}
              disabled={isLoading}
            >
              <Ionicons 
                name={biometricTypeName === 'PIN del Dispositivo' ? 'keypad' : 'finger-print'} 
                size={32} 
                color="#74C1E6" 
              />
              <View style={styles.biometricTextContainer}>
                <Text style={styles.biometricButtonText}>
                  Iniciar con {biometricTypeName}
                </Text>
                <Text style={styles.biometricEmailText}>
                  {biometricUserEmail}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#74C1E6" />
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o continúa con email</Text>
              <View style={styles.dividerLine} />
            </View>
          </>
        )}

        {/* Formulario de Login */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isLoading}
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

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Links */}
        <View style={styles.linksContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>
              ¿No tienes cuenta? <Text style={styles.linkBold}>Regístrate</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Modal de Configuración Biométrica */}
        <BiometricPromptModal
          visible={showBiometricSetupModal}
          onAccept={handleBiometricSetupAccept}
          onDecline={handleBiometricSetupDecline}
          onLater={handleBiometricSetupLater}
          biometricType={biometricTypeName}
        />
      </ScrollView>
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
    padding: 20,
    justifyContent: 'center',
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
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(116, 193, 230, 0.1)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#74C1E6',
    gap: 12,
  },
  biometricTextContainer: {
    flex: 1,
  },
  biometricButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#74C1E6',
  },
  biometricEmailText: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666',
    fontSize: 14,
  },
  formContainer: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 5,
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: '#74C1E6',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linksContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  linkBold: {
    color: '#74C1E6',
    fontWeight: 'bold',
  },
});