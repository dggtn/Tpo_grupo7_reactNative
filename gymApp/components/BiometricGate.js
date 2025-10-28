import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  authenticateWithBiometric,
  selectBiometricEnabled,
  updateLastUsed,
} from '../../store/slices/biometricSlice';
import { logout } from '../../store/slices/authSlice';
import { getBiometricTypeName } from '../../utils/biometricUtils';
import { showErrorToast } from '../../utils/toastUtils';

/**
 * ✅ NUEVO COMPONENTE: Pantalla de bloqueo biométrico
 * Se muestra cuando:
 * - El usuario tiene biometría habilitada para esta sesión
 * - La app se vuelve activa (regreso de background)
 * 
 * NO se muestra si:
 * - El usuario acaba de hacer login (justLoggedIn = true)
 * - La biometría no está habilitada
 */
const BiometricGate = ({ onAuthenticated }) => {
  const dispatch = useDispatch();
  const biometricEnabled = useSelector(selectBiometricEnabled);

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricTypeName, setBiometricTypeName] = useState('Huella Digital');
  const [authAttempted, setAuthAttempted] = useState(false);

  useEffect(() => {
    loadBiometricType();
  }, []);

  // ✅ Intentar autenticación automática al montar
  useEffect(() => {
    if (biometricEnabled && !authAttempted) {
      handleAuthenticate();
    }
  }, [biometricEnabled]);

  const loadBiometricType = async () => {
    const typeName = await getBiometricTypeName();
    setBiometricTypeName(typeName);
  };

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    setAuthAttempted(true);

    try {
      console.log('[BiometricGate] 🔐 Solicitando autenticación...');

      await dispatch(
        authenticateWithBiometric('Verificar identidad')
      ).unwrap();

      console.log('[BiometricGate] ✅ Autenticación exitosa');

      // Actualizar último uso
      await dispatch(updateLastUsed());

      // Notificar que se autenticó correctamente
      onAuthenticated();
    } catch (error) {
      console.error('[BiometricGate] ❌ Error de autenticación:', error);

      if (error.toString().includes('cancelada') || error.toString().includes('cancel')) {
        console.log('[BiometricGate] Usuario canceló autenticación');
        showErrorToast('Cancelado', 'Debes autenticarte para continuar');
      } else {
        showErrorToast('Error', 'No se pudo autenticar');
      }

      setIsAuthenticating(false);
      setAuthAttempted(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('[BiometricGate] 🚪 Cerrando sesión por fallo de autenticación');
      await dispatch(logout()).unwrap();
    } catch (error) {
      console.error('[BiometricGate] Error en logout:', error);
    }
  };

  if (!biometricEnabled) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icono */}
        <View style={styles.iconContainer}>
          <Ionicons
            name={
              biometricTypeName === 'PIN del Dispositivo'
                ? 'keypad'
                : 'finger-print'
            }
            size={80}
            color="#74C1E6"
          />
        </View>

        {/* Título */}
        <Text style={styles.title}>Verificación Requerida</Text>
        <Text style={styles.subtitle}>
          Usa tu {biometricTypeName} para continuar
        </Text>

        {/* Botón de autenticación */}
        <TouchableOpacity
          style={[styles.button, isAuthenticating && styles.buttonDisabled]}
          onPress={handleAuthenticate}
          disabled={isAuthenticating}
        >
          {isAuthenticating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={24} color="#fff" />
              <Text style={styles.buttonText}>Autenticar</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Botón de cerrar sesión alternativo */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
        </TouchableOpacity>

        {/* Información */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={18} color="#666" />
          <Text style={styles.infoText}>
            La autenticación biométrica está activa para esta sesión
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#faf7f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(116, 193, 230, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#121212',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#74C1E6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    marginBottom: 16,
    shadowColor: '#74C1E6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  logoutButtonText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});

export default BiometricGate;