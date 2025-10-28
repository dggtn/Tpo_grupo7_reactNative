import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const BIOMETRIC_MODAL_SHOWN_THIS_LOGIN = 'biometric_modal_shown_this_login';

/**
 * Componente que gestiona el modal de configuración biométrica
 * - SIEMPRE se muestra después de cada login (configuración OPCIONAL)
 * - Si el usuario acepta, el desbloqueo es OBLIGATORIO hasta que cierre sesión
 * - Si el usuario cierra sesión, se desactiva y vuelve a preguntar en próximo login
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
    if (!currentUserEmail) {
      console.log('[BiometricSetupManager] ⏭️ No hay usuario autenticado');
      return;
    }

    if (!biometricAvailable) {
      console.log('[BiometricSetupManager] ⏭️ Biometría no disponible en dispositivo');
      return;
    }

    // Verificar si ya se mostró el modal en ESTE login
    const modalShownKey = `${BIOMETRIC_MODAL_SHOWN_THIS_LOGIN}_${currentUserEmail}`;
    const alreadyShownThisLogin = await AsyncStorage.getItem(modalShownKey);
    
    if (alreadyShownThisLogin === 'true') {
      console.log('[BiometricSetupManager] ⏭️ Modal ya mostrado en este login');
      return;
    }

    // LÓGICA PRINCIPAL: Mostrar solo si NO está habilitada actualmente
    // (Si está habilitada, significa que ya la configuró en este login)
    if (!biometricEnabled) {
      console.log('[BiometricSetupManager] 🔔 Mostrando modal de configuración OPCIONAL');
      const typeName = await getBiometricTypeName();
      setBiometricTypeName(typeName);
      setShowModal(true);
    } else {
      console.log('[BiometricSetupManager] ✅ Biometría ya configurada en este login');
    }
  };

  const handleAccept = async () => {
    setShowModal(false);
    setIsProcessing(true);
    
    try {
      console.log('[BiometricSetupManager] 🔐 Usuario aceptó configurar biometría');
      
      // 1. Probar autenticación biométrica
      await dispatch(authenticateWithBiometric(`Configurar ${biometricTypeName}`)).unwrap();
      
      // 2. Guardar email (temporal hasta implementar refresh tokens)
      const saved = await saveBiometricCredentials(currentUserEmail, 'USE_REFRESH_TOKEN');
      
      if (!saved) {
        throw new Error('No se pudieron guardar las credenciales');
      }
      
      // 3. Habilitar en el estado
      await dispatch(enableBiometric(currentUserEmail)).unwrap();
      
      showSuccessToast('¡Listo!', 'Biometría activada. Será requerida al reingresar.');
      
      // ✅ Marcar que se mostró en esta sesión (para no volver a mostrar)
      const shownKey = `${BIOMETRIC_SETUP_SHOWN_KEY}_${currentUserEmail}`;
      await AsyncStorage.setItem(shownKey, 'true');
      
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
    console.log('[BiometricSetupManager] ❌ Usuario rechazó biometría');
    
    // ✅ CAMBIO: Solo marcar que se mostró en esta sesión (no permanentemente)
    const shownKey = `${BIOMETRIC_SETUP_SHOWN_KEY}_${currentUserEmail}`;
    await AsyncStorage.setItem(shownKey, 'true');
    
    showErrorToast(
      'Biometría no activada',
      'Podrás activarla después desde tu perfil'
    );
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