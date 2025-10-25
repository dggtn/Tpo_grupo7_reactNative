import * as LocalAuthentication from 'expo-local-authentication';

/**
 * Verifica si el dispositivo tiene hardware biométrico
 */
export const hasHardware = async () => {
  try {
    return await LocalAuthentication.hasHardwareAsync();
  } catch (error) {
    console.error('Error checking biometric hardware:', error);
    return false;
  }
};

/**
 * Verifica si hay datos biométricos o PIN enrollados
 */
export const isEnrolled = async () => {
  try {
    return await LocalAuthentication.isEnrolledAsync();
  } catch (error) {
    console.error('Error checking biometric enrollment:', error);
    return false;
  }
};

/**
 * Obtiene los tipos de autenticación soportados
 */
export const getSupportedAuthTypes = async () => {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    return types;
  } catch (error) {
    console.error('Error getting supported auth types:', error);
    return [];
  }
};

/**
 * Verifica disponibilidad completa de autenticación (biometría O PIN)
 * ✅ MODIFICADO: Ahora acepta PIN como válido
 */
export const isBiometricAvailable = async () => {
  try {
    const hardware = await hasHardware();
    const enrolled = await isEnrolled();
    
    // ✅ Si tiene hardware Y algo enrollado (biometría o PIN), está disponible
    const available = hardware && enrolled;
    
    console.log('[BiometricUtils] Hardware:', hardware, '| Enrolled:', enrolled, '| Available:', available);
    return available;
  } catch (error) {
    console.error('Error checking biometric availability:', error);
    return false;
  }
};

/**
 * Obtiene nombre del tipo de autenticación disponible
 * ✅ MODIFICADO: Detecta si es biometría real o fallback a PIN
 */
export const getBiometricTypeName = async () => {
  try {
    const types = await getSupportedAuthTypes();
    
    console.log('[BiometricUtils] Tipos soportados:', types);
    
    // Si tiene Face ID
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }
    
    // Si tiene huella digital
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Huella Digital';
    }
    
    // Si tiene iris
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Reconocimiento de Iris';
    }
    
    // ✅ Si no tiene biometría real, pero está enrollado, usa PIN/Patrón
    const enrolled = await isEnrolled();
    if (enrolled) {
      return 'PIN del Dispositivo';
    }
    
    return 'Autenticación del Dispositivo';
  } catch (error) {
    console.error('[BiometricUtils] Error getting biometric type:', error);
    return 'Autenticación del Dispositivo';
  }
};

/**
 * Autentica con biometría O PIN del dispositivo
 * ✅ MODIFICADO: Permite fallback a credenciales del dispositivo
 */
export const authenticate = async (promptMessage = 'Autenticación requerida') => {
  try {
    console.log('[BiometricUtils] 🔐 Iniciando autenticación...');
    
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancelar',
      // ✅ CRÍTICO: Permitir fallback a PIN/patrón/contraseña del dispositivo
      disableDeviceFallback: false,
      fallbackLabel: 'Usar PIN del dispositivo',
    });
    
    console.log('[BiometricUtils] Resultado:', result);
    
    return result;
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verifica si debe solicitar biometría basado en última vez usada
 */
export const shouldRequestBiometric = (lastUsed, maxDaysWithoutUse = 30) => {
  if (!lastUsed) return true;
  
  const daysSinceLastUse = (Date.now() - lastUsed) / (1000 * 60 * 60 * 24);
  return daysSinceLastUse <= maxDaysWithoutUse;
};

/**
 * Formatea mensaje de error de biometría
 */
export const formatBiometricError = (errorCode) => {
  const errorMessages = {
    'user_cancel': 'Autenticación cancelada por el usuario',
    'system_cancel': 'Autenticación cancelada por el sistema',
    'authentication_failed': 'Autenticación fallida',
    'user_fallback': 'Usuario eligió usar fallback',
    'biometric_lockout': 'Autenticación bloqueada por demasiados intentos',
    'biometric_lockout_permanent': 'Autenticación bloqueada permanentemente',
    'no_biometrics': 'No hay datos de autenticación configurados',
  };
  
  return errorMessages[errorCode] || 'Error de autenticación';
};

/**
 * Obtiene información detallada de capacidades biométricas
 * ✅ MODIFICADO: Incluye información sobre PIN
 */
export const getBiometricInfo = async () => {
  try {
    const hardware = await hasHardware();
    const enrolled = await isEnrolled();
    const types = await getSupportedAuthTypes();
    const available = hardware && enrolled;
    const typeName = await getBiometricTypeName();
    
    // ✅ Detectar si tiene biometría real o solo PIN
    const hasBiometricData = types.length > 0;
    const hasOnlyPIN = enrolled && !hasBiometricData;
    
    console.log('[BiometricUtils] Info completa:', {
      hardware,
      enrolled,
      types,
      available,
      typeName,
      hasBiometricData,
      hasOnlyPIN
    });
    
    return {
      hardware,
      enrolled,
      types,
      available,
      typeName,
      hasBiometricData,
      hasOnlyPIN,
    };
  } catch (error) {
    console.error('Error getting biometric info:', error);
    return {
      hardware: false,
      enrolled: false,
      types: [],
      available: false,
      typeName: 'No disponible',
      hasBiometricData: false,
      hasOnlyPIN: false,
    };
  }
};

/**
 * ✅ NUEVA FUNCIÓN: Verifica si el dispositivo tiene seguridad configurada
 */
export const hasDeviceSecurity = async () => {
  try {
    // Si está enrollado, significa que tiene PIN, patrón, contraseña o biometría
    const enrolled = await isEnrolled();
    console.log('[BiometricUtils] Seguridad del dispositivo configurada:', enrolled);
    return enrolled;
  } catch (error) {
    console.error('Error checking device security:', error);
    return false;
  }
};

/**
 * ✅ NUEVA FUNCIÓN: Obtiene un mensaje descriptivo sobre el tipo de seguridad
 */
export const getSecurityTypeMessage = async () => {
  const info = await getBiometricInfo();
  
  if (!info.available) {
    return 'No hay seguridad configurada en el dispositivo';
  }
  
  if (info.hasBiometricData) {
    return `Autenticación biométrica disponible: ${info.typeName}`;
  }
  
  if (info.hasOnlyPIN) {
    return 'Autenticación con PIN/Patrón del dispositivo disponible';
  }
  
  return 'Autenticación del dispositivo disponible';
};
