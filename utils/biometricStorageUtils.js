import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_CREDENTIALS_KEY = 'biometric_credentials';

export const saveBiometricCredentials = async (email, password) => {
  try {
    console.log('[BiometricStorage] Guardando credenciales para:', email);
    
    const credentials = {
      email,
      password, 
      timestamp: Date.now(),
    };

    await SecureStore.setItemAsync(
      BIOMETRIC_CREDENTIALS_KEY,
      JSON.stringify(credentials)
    );

    // Verificar que se guardó correctamente
    const saved = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    if (!saved) {
      throw new Error('No se pudo verificar el guardado');
    }

    console.log('[BiometricStorage] ✅ Credenciales guardadas exitosamente');
    return true;
  } catch (error) {
    console.error('[BiometricStorage] ❌ Error guardando credenciales:', error);
    return false;
  }
};

export const getBiometricCredentials = async () => {
  try {
    const data = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    
    if (!data) {
      console.log('[BiometricStorage] No hay credenciales guardadas');
      return null;
    }

    const credentials = JSON.parse(data);
    console.log('[BiometricStorage] ✅ Credenciales recuperadas para:', credentials.email);
    return credentials;
  } catch (error) {
    console.error('[BiometricStorage] ❌ Error recuperando credenciales:', error);
    return null;
  }
};

export const deleteBiometricCredentials = async () => {
  try {
    await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    console.log('[BiometricStorage] ✅ Credenciales eliminadas');
    return true;
  } catch (error) {
    console.error('[BiometricStorage] ❌ Error eliminando credenciales:', error);
    return false;
  }
};

export const hasBiometricCredentials = async () => {
  try {
    const data = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    return !!data;
  } catch (error) {
    return false;
  }
};