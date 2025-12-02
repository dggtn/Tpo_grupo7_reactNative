import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  enableBiometricForSession,
  authenticateWithBiometric,
  selectBiometricAvailable,
  selectSetupPromptShown,
  markSetupPromptShown,
  checkBiometricAvailability,
} from '../../store/slices/biometricSlice';
import {
  selectJustLoggedIn,
  clearJustLoggedIn,
} from '../../store/slices/authSlice';
import { selectUserEmail } from '../../store/slices/userSlice';
import { getBiometricTypeName } from '../../utils/biometricUtils';
import { showSuccessToast, showErrorToast } from '../../utils/toastUtils';
import { saveBiometricCredentials } from '../../utils/biometricStorageUtils';

/**
 *  Modal que se muestra SOLO después de login exitoso
 * - Se muestra UNA SOLA VEZ después de cada login
 * - Permite activar biometría para la sesión actual
 * - Si el usuario rechaza, puede activarla después desde Perfil
 */
const BiometricSetupManager = () => {
  const dispatch = useDispatch();
  
  // Estados de Redux
  const biometricAvailable = useSelector(selectBiometricAvailable);
  const setupPromptShown = useSelector(selectSetupPromptShown);
  const justLoggedIn = useSelector(selectJustLoggedIn);
  const userEmail = useSelector(selectUserEmail);
  
  // Estados locales
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [biometricTypeName, setBiometricTypeName] = useState('Huella Digital');
  const [password, setPassword] = useState('');

  // Cargar tipo de biometría disponible
  useEffect(() => {
    loadBiometricType();
  }, []);

  // Verificar disponibilidad biométrica al montar
  useEffect(() => {
    const verifyAvailability = async () => {
      try {
        await dispatch(checkBiometricAvailability(true)).unwrap();
      } catch (error) {
        console.log('[BiometricSetupManager] Error verificando disponibilidad:', error);
      }
    };
    
    verifyAvailability();
  }, [dispatch]);

  // LÓGICA PRINCIPAL: Mostrar modal SOLO si:
  // 1. Acaba de loguearse (justLoggedIn = true)
  // 2. Biometría está disponible
  // 3. NO se ha mostrado el prompt en esta sesión
  useEffect(() => {
    console.log('[BiometricSetupManager] Estado:', {
      justLoggedIn,
      biometricAvailable,
      setupPromptShown,
      userEmail
    });

    if (justLoggedIn && biometricAvailable && !setupPromptShown && userEmail) {
      console.log('[BiometricSetupManager] ✅ Mostrando modal de configuración');
      setShowModal(true);
      
      // Marcar que ya se mostró el prompt
      dispatch(markSetupPromptShown());
      
      // Limpiar el flag de justLoggedIn para que no se vuelva a mostrar
      dispatch(clearJustLoggedIn());
    }
  }, [justLoggedIn, biometricAvailable, setupPromptShown, userEmail, dispatch]);

  const loadBiometricType = async () => {
    const typeName = await getBiometricTypeName();
    setBiometricTypeName(typeName);
  };

  //  Manejar activación de biometría
  const handleEnableBiometric = async () => {
    if (!userEmail) {
      showErrorToast('Error', 'No se pudo obtener el email del usuario');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('[BiometricSetupManager] 🔐 Iniciando configuración para:', userEmail);

      // 1. Autenticar con biometría para verificar que funciona
      await dispatch(
        authenticateWithBiometric(`Configurar ${biometricTypeName}`)
      ).unwrap();

      console.log('[BiometricSetupManager] ✅ Autenticación exitosa');

      // 2. Guardar credenciales de forma segura
      // NOTA: Aquí deberías obtener la contraseña del usuario de forma segura
      // Por ahora, las guardamos con un placeholder que deberás manejar en LoginScreen
      const credentials = { email: userEmail, timestamp: Date.now() };
      const saved = await saveBiometricCredentials(userEmail, JSON.stringify(credentials));

      if (!saved) {
        throw new Error('No se pudieron guardar las credenciales');
      }

      // 3. Habilitar biometría SOLO para esta sesión (no persistente)
      await dispatch(enableBiometricForSession(userEmail)).unwrap();

      console.log('[BiometricSetupManager] ✅ Biometría configurada para sesión actual');
      
      showSuccessToast(
        '¡Perfecto!',
        `${biometricTypeName} activada para esta sesión`
      );

      setShowModal(false);
    } catch (error) {
      console.error('[BiometricSetupManager] ❌ Error:', error);
      
      if (error.toString().includes('cancelada') || error.toString().includes('cancel')) {
        console.log('[BiometricSetupManager] Usuario canceló la configuración');
        setShowModal(false);
      } else {
        showErrorToast('Error', 'No se pudo configurar la biometría');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Manejar rechazo (cerrar modal sin activar)
  const handleSkip = () => {
    console.log('[BiometricSetupManager] ⏭️ Usuario omitió configuración');
    setShowModal(false);
  };

  if (!showModal) {
    return null;
  }

  return (
    <Modal
      visible={showModal}
      transparent={true}
      animationType="fade"
      onRequestClose={handleSkip}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Icono */}
          <View style={styles.iconContainer}>
            <Ionicons
              name={
                biometricTypeName === 'PIN del Dispositivo'
                  ? 'keypad'
                  : 'finger-print'
              }
              size={64}
              color="#74C1E6"
            />
          </View>

          {/* Título */}
          <Text style={styles.title}>
            ¿Activar {biometricTypeName}?
          </Text>

          {/* Descripción */}
          <Text style={styles.description}>
            {biometricTypeName === 'PIN del Dispositivo'
              ? 'Usa el PIN de tu dispositivo para acceder más rápido'
              : 'Accede más rápido y seguro usando tu huella digital'}
          </Text>

          {/* Características */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureRow}>
              <Ionicons name="flash" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Acceso instantáneo</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Mayor seguridad</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="time" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Activo solo en esta sesión</Text>
            </View>
          </View>

          {/* Nota informativa */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#FF9800" />
            <Text style={styles.infoText}>
              Si cierras sesión, deberás activarlo nuevamente
            </Text>
          </View>

          {/* Botones */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              disabled={isProcessing}
            >
              <Text style={styles.skipButtonText}>Ahora no</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.enableButton, isProcessing && styles.buttonDisabled]}
              onPress={handleEnableBiometric}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.enableButtonText}>Activar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Texto adicional */}
          <Text style={styles.footerText}>
            Podrás activarlo después desde tu perfil
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
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
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(116, 193, 230, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#121212',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  featureText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
  },
  infoText: {
    fontSize: 13,
    color: '#F57C00',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 12,
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  enableButton: {
    flex: 1,
    backgroundColor: '#74C1E6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  enableButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footerText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default BiometricSetupManager;