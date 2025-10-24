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
 * Verifica si hay datos biométricos enrollados
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
 * Verifica disponibilidad completa de biometría
 */
export const isBiometricAvailable = async () => {
  try {
    const hardware = await hasHardware();
    const enrolled = await isEnrolled();
    return hardware && enrolled;
  } catch (error) {
    console.error('Error checking biometric availability:', error);
    return false;
  }
};

/**
 * Obtiene nombre del tipo de biometría disponible
 */
export const getBiometricTypeName = async () => {
  try {
    const types = await getSupportedAuthTypes();
    
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Touch ID / Huella Digital';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Reconocimiento de Iris';
    }
    
    return 'Autenticación Biométrica';
  } catch (error) {
    return 'Autenticación Biométrica';
  }
};

/**
 * Autentica con biometría
 */
export const authenticate = async (promptMessage = 'Autenticación biométrica') => {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
      fallbackLabel: 'Usar PIN',
    });
    
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
    'biometric_lockout': 'Biometría bloqueada por demasiados intentos',
    'biometric_lockout_permanent': 'Biometría bloqueada permanentemente',
    'no_biometrics': 'No hay datos biométricos configurados',
  };
  
  return errorMessages[errorCode] || 'Error de autenticación biométrica';
};

/**
 * Obtiene información detallada de capacidades biométricas
 */
export const getBiometricInfo = async () => {
  try {
    const hardware = await hasHardware();
    const enrolled = await isEnrolled();
    const types = await getSupportedAuthTypes();
    const available = hardware && enrolled;
    const typeName = await getBiometricTypeName();
    
    return {
      hardware,
      enrolled,
      types,
      available,
      typeName,
    };
  } catch (error) {
    console.error('Error getting biometric info:', error);
    return {
      hardware: false,
      enrolled: false,
      types: [],
      available: false,
      typeName: 'No disponible',
    };
  }
};