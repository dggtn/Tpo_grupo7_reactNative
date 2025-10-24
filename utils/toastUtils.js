import Toast from 'react-native-toast-message';

/**
 * Muestra un toast de éxito
 */
export const showSuccessToast = (title, message = '') => {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 3000,
    topOffset: 50,
  });
};

/**
 * Muestra un toast de error
 */
export const showErrorToast = (title, message = '') => {
  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 4000,
    topOffset: 50,
  });
};

/**
 * Muestra un toast de información
 */
export const showInfoToast = (title, message = '') => {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 3000,
    topOffset: 50,
  });
};

/**
 * Muestra un toast de advertencia
 */
export const showWarningToast = (title, message = '') => {
  Toast.show({
    type: 'warning',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 3500,
    topOffset: 50,
  });
};

/**
 * Oculta el toast actual
 */
export const hideToast = () => {
  Toast.hide();
};

/**
 * Helper para mostrar toast de error de red
 */
export const showNetworkErrorToast = () => {
  showErrorToast(
    'Error de Conexión',
    'Verifica tu conexión a internet'
  );
};

/**
 * Helper para mostrar toast de sesión expirada
 */
export const showSessionExpiredToast = () => {
  showWarningToast(
    'Sesión Expirada',
    'Por favor, inicia sesión nuevamente'
  );
};

/**
 * Helper para mostrar toast de operación exitosa
 */
export const showOperationSuccessToast = (operation = 'Operación') => {
  showSuccessToast(
    'Éxito',
    `${operation} completada correctamente`
  );
};

/**
 * Toast personalizado con duración específica
 */
export const showCustomToast = (type, title, message, duration = 3000) => {
  Toast.show({
    type,
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: duration,
    topOffset: 50,
  });
};