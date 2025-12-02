import * as LocalAuthentication from 'expo-local-authentication';

/**
 * ✅ VERIFICACIÓN MEJORADA: Detecta biometría O PIN/Pattern
 */
export const isBiometricAvailable = async () => {
  try {
    const hardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    console.log('[BiometricUtils] 🔍 Verificación:');
    console.log('  - Hardware disponible:', hardware);
    console.log('  - Biometría enrolled:', enrolled);
    console.log('  - Tipos soportados:', types);
    
    // ✅ LÓGICA MEJORADA:
    // 1. Si enrolled = true → Biometría real configurada
    // 2. Si enrolled = false pero hardware = true y types > 0 → PIN/Pattern disponible
    let available = false;
    
    if (hardware) {
      if (enrolled) {
        console.log('  - ✅ Biometría real configurada');
        available = true;
      } else if (types.length > 0) {
        console.log('  - ✅ PIN/Pattern disponible (sin biometría enrolled)');
        available = true;
      } else {
        console.log('  - ❌ Sin autenticación configurada');
        available = false;
      }
    } else {
      console.log('  - ❌ Sin hardware de seguridad');
      available = false;
    }
    
    console.log('  - 🎯 Resultado final:', available);
    return available;
    
  } catch (error) {
    console.error('[BiometricUtils] ❌ Error verificando disponibilidad:', error);
    return false;
  }
};

/**
 * Autentica con biometría O PIN del dispositivo
 */
export const authenticate = async (promptMessage = 'Autenticación requerida') => {
  try {
    console.log('[BiometricUtils] 🔐 Iniciando autenticación:', promptMessage);
    
    // ✅ CONFIGURACIÓN CORRECTA PARA ACEPTAR PIN/Pattern
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false, // ✅ CRÍTICO: Permitir PIN/patrón
      fallbackLabel: 'Usar PIN', // Texto del botón fallback
    });
    
    console.log('[BiometricUtils] 📊 Resultado:', {
      success: result.success,
      error: result.error,
      warning: result.warning
    });
    
    return result;
    
  } catch (error) {
    console.error('[BiometricUtils] ❌ Error de autenticación:', error);
    return { 
      success: false, 
      error: error.message,
      errorCode: error.code 
    };
  }
};

/**
 * ✅ MEJORADO: Obtiene nombre del tipo de autenticación con detección de PIN
 */
export const getBiometricTypeName = async () => {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    
    console.log('[BiometricUtils] 📱 Tipos soportados:', types);
    console.log('[BiometricUtils] 📱 Enrolled:', enrolled);
    
    // Verificar tipos específicos de biometría
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }
    
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      if (enrolled) {
        return 'Huella Digital';
      } else {
        // Tiene hardware de huella pero no está configurada → debe ser PIN/Pattern
        return 'PIN del Dispositivo';
      }
    }
    
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Reconocimiento de Iris';
    }
    
    // Si tiene hardware pero no biometría enrolled → es PIN/Pattern
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (hasHardware && !enrolled && types.length > 0) {
      return 'PIN del Dispositivo';
    }
    
    return 'Autenticación del Dispositivo';
    
  } catch (error) {
    console.error('[BiometricUtils] ❌ Error obteniendo tipo:', error);
    return 'Autenticación del Dispositivo';
  }
};

/**
 * ✅ MEJORADO: Obtiene información completa con detección de PIN
 */
export const getBiometricInfo = async () => {
  try {
    const hardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const typeName = await getBiometricTypeName();
    
    // Determinar disponibilidad real
    let available = false;
    if (hardware) {
      available = enrolled || types.length > 0;
    }
    
    const hasBiometricData = enrolled; // Solo true si hay biometría real
    const hasOnlyPIN = !enrolled && types.length > 0; // PIN sin biometría
    
    const info = {
      hardware,
      enrolled,
      types,
      available,
      typeName,
      hasBiometricData,
      hasOnlyPIN,
    };
    
    console.log('[BiometricUtils] 📋 Info completa:', JSON.stringify(info, null, 2));
    return info;
    
  } catch (error) {
    console.error('[BiometricUtils] ❌ Error obteniendo info:', error);
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
 * ✅ MEJORADO: Verifica si el dispositivo tiene seguridad configurada (biometría O PIN)
 */
export const hasDeviceSecurity = async () => {
  try {
    const hardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    // Tiene seguridad si:
    // 1. Está enrolled (biometría real), O
    // 2. Tiene hardware y tipos soportados (PIN/Pattern)
    const hasSecurity = enrolled || (hardware && types.length > 0);
    
    console.log('[BiometricUtils] 🔒 Seguridad del dispositivo:', hasSecurity);
    return hasSecurity;
  } catch (error) {
    console.error('[BiometricUtils] ❌ Error verificando seguridad:', error);
    return false;
  }
};

/**
 * ✅ NUEVO: Prueba si la autenticación realmente funciona (versión ligera)
 */
export const canAuthenticate = async () => {
  try {
    const hardware = await LocalAuthentication.hasHardwareAsync();
    if (!hardware) return false;
    
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.length === 0) return false;
    
    // Si llegó aquí, hay hardware y tipos → puede autenticar
    return true;
  } catch (error) {
    console.error('[BiometricUtils] ❌ Error verificando capacidad:', error);
    return false;
  }
};