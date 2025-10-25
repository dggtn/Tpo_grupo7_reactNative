import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const BIOMETRIC_CREDENTIALS_KEY = 'biometric_credentials';

/**
 * Guarda las credenciales cifradas para uso con biometría
 * NOTA: En producción, usa tokens refresh en lugar de contraseñas
 */
export const saveBiometricCredentials = async (email, password) => {
  try {
    // Cifrar la contraseña (básico, en producción usa mejor encriptación)
    const hashedPassword = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password + email // Salt con email
    );

    const credentials = {
      email,
      hashedPassword,
      timestamp: Date.now(),
    };

    await SecureStore.setItemAsync(
      BIOMETRIC_CREDENTIALS_KEY,
      JSON.stringify(credentials)
    );

    console.log('[BiometricStorage] Credenciales guardadas para:', email);
    return true;
  } catch (error) {
    console.error('[BiometricStorage] Error guardando credenciales:', error);
    return false;
  }
};

/**
 * Recupera las credenciales guardadas
 */
export const getBiometricCredentials = async () => {
  try {
    const data = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    
    if (!data) {
      return null;
    }

    const credentials = JSON.parse(data);
    console.log('[BiometricStorage] Credenciales recuperadas para:', credentials.email);
    return credentials;
  } catch (error) {
    console.error('[BiometricStorage] Error recuperando credenciales:', error);
    return null;
  }
};

/**
 * Elimina las credenciales guardadas
 */
export const deleteBiometricCredentials = async () => {
  try {
    await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    console.log('[BiometricStorage] Credenciales eliminadas');
    return true;
  } catch (error) {
    console.error('[BiometricStorage] Error eliminando credenciales:', error);
    return false;
  }
};

/**
 * Verifica si hay credenciales guardadas
 */
export const hasBiometricCredentials = async () => {
  try {
    const data = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    return !!data;
  } catch (error) {
    return false;
  }
};
