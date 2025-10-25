import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import BiometricPromptModal from './BiometricPromptModal';
import {
  selectBiometricEnabled,
  selectBiometricUserEmail,
  selectBiometricAvailable,
  enableBiometric,
  authenticateWithBiometric,
} from '../../store/slices/biometricSlice';
import { selectUserEmail } from '../../store/slices/userSlice';
import { getBiometricTypeName } from '../../utils/biometricUtils';
import { saveBiometricCredentials } from '../../utils/biometricStorageUtils';
import { showSuccessToast, showErrorToast } from '../../utils/toastUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_PROMPT_SHOWN_KEY = 'biometric_prompt_shown';

/**
 * ✅ Componente que gestiona el modal de configuración biométrica
 * Se monta DESPUÉS de autenticación exitosa
 */
export default function BiometricSetupManager() {
  const dispatch = useDispatch();
  
  const biometricEnabled = useSelector(selectBiometricEnabled);
  const biometricUserEmail = useSelector(selectBiometricUserEmail);
  const biometricAvailable = useSelector(selectBiometricAvailable);
  const currentUserEmail = useSelector(selectUserEmail);
  
  const [showModal, setShowModal] = useState(false);
  const [biometricTypeName, setBiometricTypeName] = useState('Huella Digital');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    checkAndShowModal();
  }, [currentUserEmail, biometricEnabled, biometricAvailable]);

  const checkAndShowModal = async () => {
    if (!currentUserEmail || !biometricAvailable) {
      console.log('[BiometricSetupManager] ⏭️ Condiciones no cumplidas');
      return;
    }

    // ✅ Verificar si ya se mostró el modal para este usuario
    const shownKey = `${BIOMETRIC_PROMPT_SHOWN_KEY}_${currentUserEmail}`;
    const alreadyShown = await AsyncStorage.getItem(shownKey);
    
    if (alreadyShown === 'declined') {
      console.log('[BiometricSetupManager] ⏭️ Usuario rechazó anteriormente');
      return;
    }

    // ✅ Mostrar si NO está habilitada O si es otro usuario
    const shouldShow = !biometricEnabled || 
                      (biometricUserEmail && biometricUserEmail !== currentUserEmail.toLowerCase());
    
    if (shouldShow) {
      console.log('[BiometricSetupManager] 🔔 Mostrando modal de configuración');
      const typeName = await getBiometricTypeName();
      setBiometricTypeName(typeName);
      setShowModal(true);
    }
  };

  const handleAccept = async () => {
    setShowModal(false);
    setIsProcessing(true);
    
    try {
      console.log('[BiometricSetupManager] 🔐 Usuario aceptó configurar biometría');
      
      // 1. Probar autenticación biométrica
      await dispatch(authenticateWithBiometric(`Configurar ${biometricTypeName}`)).unwrap();
      
      // 2. ⚠️ TEMPORAL: Guardar email (NO contraseña) hasta implementar refresh tokens
      const saved = await saveBiometricCredentials(currentUserEmail, 'USE_REFRESH_TOKEN');
      
      if (!saved) {
        throw new Error('No se pudieron guardar las credenciales');
      }
      
      // 3. Habilitar en el estado
      await dispatch(enableBiometric(currentUserEmail)).unwrap();
      
      showSuccessToast('¡Listo!', 'Biometría activada correctamente');
      
      // Marcar como mostrado
      const shownKey = `${BIOMETRIC_PROMPT_SHOWN_KEY}_${currentUserEmail}`;
      await AsyncStorage.setItem(shownKey, 'accepted');
      
    } catch (error) {
      console.error('[BiometricSetupManager] ❌ Error:', error);
      if (!error.toString().includes('cancelada')) {
        showErrorToast('Error', 'No se pudo activar la biometría');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    setShowModal(false);
    console.log('[BiometricSetupManager] ❌ Usuario rechazó biometría permanentemente');
    
    // Guardar preferencia para no volver a preguntar
    const shownKey = `${BIOMETRIC_PROMPT_SHOWN_KEY}_${currentUserEmail}`;
    await AsyncStorage.setItem(shownKey, 'declined');
  };

  const handleLater = () => {
    setShowModal(false);
    console.log('[BiometricSetupManager] ⏰ Usuario pospuso biometría');
    // NO guardamos nada, se volverá a preguntar en el próximo login
  };

  if (!showModal) return null;

  return (
    <BiometricPromptModal
      visible={showModal && !isProcessing}
      onAccept={handleAccept}
      onDecline={handleDecline}
      onLater={handleLater}
      biometricType={biometricTypeName}
    />
  );
}