import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  View, 
  Text, 
  TextInput,
  Image, 
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

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [biometricTypeName, setBiometricTypeName] = useState('Huella Digital');
  
  const dispatch = useDispatch();
  const isLoading = useSelector(selectAuthLoading);
  const biometricEnabled = useSelector(selectBiometricEnabled);
  const biometricUserEmail = useSelector(selectBiometricUserEmail);
  const biometricAvailable = useSelector(selectBiometricAvailable);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      const typeName = await getBiometricTypeName();
      setBiometricTypeName(typeName);
      console.log('[LoginScreen] ✅ Inicialización completa');
    } catch (error) {
      console.error('[LoginScreen] ❌ Error en inicialización:', error);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      console.log('[LoginScreen] 🔐 Iniciando login biométrico...');
      
      await dispatch(authenticateWithBiometric('Iniciar sesión con ' + biometricTypeName)).unwrap();
      
      const credentials = await getBiometricCredentials();
      
      if (!credentials || !credentials.email || !credentials.password) {
        throw new Error('No se encontraron credenciales guardadas');
      }
      
      console.log('[LoginScreen] 📧 Credenciales recuperadas para:', credentials.email);
      
      await dispatch(login({
        email: credentials.email,
        password: credentials.password
      })).unwrap();
      
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
      const normalizedEmail = email.trim().toLowerCase();
      console.log('[LoginScreen] 🔑 Iniciando login para:', normalizedEmail);
      
      await dispatch(login({ 
        email: normalizedEmail, 
        password 
      })).unwrap();
      
      showSuccessToast('¡Bienvenido!', 'Has iniciado sesión correctamente');
      
    } catch (error) {
      console.error('[LoginScreen] ❌ Error en login:', error);
      showErrorToast('Error', error || 'Credenciales inválidas');
    }
  };

  const handleForgotPassword = () => {
    console.log('[LoginScreen] 🔑 Navegando a ForgotPassword');
    navigation.navigate('ForgotPassword');
  };

  const handleRecoverAccess = () => {
    console.log('[LoginScreen] 🔄 Navegando a Recovery');
    navigation.navigate('Recovery');
  };

  const shouldShowBiometricButton = biometricEnabled && 
                                    biometricAvailable && 
                                    biometricUserEmail;

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
          <Image source={require("../../../assets/ritmo-removebg-preview.png")}
                  style={styles.avatar}
          />
          
          <Text style={styles.title}>Bienvenido de vuelta</Text>
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
                <Ionicons name="arrow-forward" size={20} color="#e3e3efff" />
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

          {/* Botón de Olvidé mi Contraseña */}
          <TouchableOpacity 
            onPress={handleForgotPassword}
            style={styles.forgotPasswordButton}
            disabled={isLoading}
          >
            <Ionicons name="key-outline" size={18} color="#2c2d52ff" />
            <Text style={styles.forgotPasswordText}>Olvidé mi Contraseña</Text>
          </TouchableOpacity>

          {/* Botón de Recuperar Acceso */}
          <TouchableOpacity 
            onPress={handleRecoverAccess}
            style={styles.recoveryButton}
            disabled={isLoading}
          >
            <Ionicons name="help-circle-outline" size={18} color="#2c2d52ff" />
            <Text style={styles.recoveryButtonText}>Recuperar Acceso (Registro Pendiente)</Text>
          </TouchableOpacity>
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
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatar: {
   width: 120,
   height: 120,
   borderRadius: 45,
   borderWidth: 4,
   borderColor: "#ffffff29",
   padding:80
 },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d5f2ffe4',
    marginTop: 10,
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
    backgroundColor: '#2c2d52ea',
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
    color: '#e3e3efff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linksContainer: {
    alignItems: 'center',
    marginTop: 20,
    gap: 15,
  },
  linkText: {
    textAlign: 'center',
    color: '#d5f2ffe4',
    fontSize: 15,
  },
  linkBold: {
    color: '#2c2d52ff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  recoveryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  recoveryButtonText: {
    color: '#2c2d52ff',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  forgotPasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(44, 45, 82, 0.1)',
    borderRadius: 8,
    marginTop: 8,
  },
  forgotPasswordText: {
    color: '#2c2d52ff',
    fontSize: 15,
    fontWeight: '700',
  },

});