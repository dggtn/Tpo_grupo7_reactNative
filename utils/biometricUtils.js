// utils/biometricUtils.js

import * as LocalAuthentication from 'expo-local-authentication';

/**
 * ✅ VERIFICACIÓN MEJORADA: Detecta si el dispositivo puede autenticar
 */
export const isBiometricAvailable = async () => {
  try {
    const hardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    
    console.log('[BiometricUtils] 🔍 Verificación:');
    console.log('  - Hardware disponible:', hardware);
    console.log('  - Seguridad configurada:', enrolled);
    
    // ✅ Si tiene hardware Y seguridad configurada (PIN/biometría), está disponible
    const available = hardware && enrolled;
    
    console.log('  - ✅ Biometría/PIN disponible:', available);
    return available;
    
  } catch (error) {
    console.error('[BiometricUtils] ❌ Error verificando disponibilidad:', error);
    return false;
  }
};

/**
 * ✅ PRUEBA REAL: Intenta autenticar para verificar que funciona
 */
export const testBiometricAuthentication = async () => {
  try {
    console.log('[BiometricUtils] 🧪 Probando autenticación...');
    
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Verificar disponibilidad',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false, // ✅ Permitir PIN como fallback
    });
    
    console.log('[BiometricUtils] Resultado de prueba:', result);
    return result.success;
    
  } catch (error) {
    console.error('[BiometricUtils] ❌ Error en prueba:', error);
    return false;
  }
};

/**
 * Autentica con biometría O PIN del dispositivo
 */
export const authenticate = async (promptMessage = 'Autenticación requerida') => {
  try {
    console.log('[BiometricUtils] 🔐 Iniciando autenticación:', promptMessage);
    
    // ✅ CONFIGURACIÓN CORRECTA PARA EMULADOR ANDROID
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
 * Obtiene nombre del tipo de autenticación disponible
 */
export const getBiometricTypeName = async () => {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    console.log('[BiometricUtils] 📱 Tipos soportados:', types);
    
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }
    
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Huella Digital';
    }
    
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Reconocimiento de Iris';
    }
    
    // ✅ Si no hay biometría real pero está enrolled, es PIN/Patrón
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (enrolled) {
      return 'PIN del Dispositivo';
    }
    
    return 'Autenticación del Dispositivo';
    
  } catch (error) {
    console.error('[BiometricUtils] ❌ Error obteniendo tipo:', error);
    return 'Autenticación del Dispositivo';
  }
};

/**
 * ✅ NUEVA: Obtiene información completa para debugging
 */
export const getBiometricInfo = async () => {
  try {
    const hardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const available = hardware && enrolled;
    const typeName = await getBiometricTypeName();
    
    const hasBiometricData = types.length > 0;
    const hasOnlyPIN = enrolled && !hasBiometricData;
    
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
 * ✅ NUEVA: Verifica si el dispositivo tiene seguridad configurada
 */
export const hasDeviceSecurity = async () => {
  try {
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    console.log('[BiometricUtils] 🔒 Seguridad del dispositivo:', enrolled);
    return enrolled;
  } catch (error) {
    console.error('[BiometricUtils] ❌ Error verificando seguridad:', error);
    return false;
  }
};