import NetInfo from '@react-native-community/netinfo';
import { ERROR_TYPES } from '../redux/slices/errorSlice';

/**
 * Verifica si hay conexión a internet
 */
export const checkInternetConnection = async () => {
  const state = await NetInfo.fetch();
  return state.isConnected;
};

/**
 * Determina el tipo de error basado en el error recibido
 */
export const determineErrorType = (error) => {
  const errorMessage = error.message?.toLowerCase() || '';
  
  // Errores de red
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('failed to fetch') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    error.name === 'NetworkError'
  ) {
    return ERROR_TYPES.NETWORK;
  }
  
  // Errores de autenticación
  if (
    errorMessage.includes('401') ||
    errorMessage.includes('403') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('forbidden') ||
    errorMessage.includes('authentication') ||
    errorMessage.includes('token')
  ) {
    return ERROR_TYPES.AUTH;
  }
  
  // Errores funcionales
  if (
    errorMessage.includes('400') ||
    errorMessage.includes('404') ||
    errorMessage.includes('validation') ||
    errorMessage.includes('invalid')
  ) {
    return ERROR_TYPES.FUNCTIONAL;
  }
  
  return ERROR_TYPES.UNKNOWN;
};

/**
 * Maneja errores de API y los formatea
 */
export const handleAPIError = (error) => {
  const errorType = determineErrorType(error);
  
  let message = 'Ha ocurrido un error inesperado';
  let details = error.message || '';
  
  switch (errorType) {
    case ERROR_TYPES.NETWORK:
      message = 'Error de conexión. Verifica tu internet y vuelve a intentar.';
      break;
    case ERROR_TYPES.AUTH:
      message = 'Error de autenticación. Tu sesión puede haber expirado.';
      break;
    case ERROR_TYPES.FUNCTIONAL:
      message = error.message || 'Error en la operación solicitada.';
      break;
    default:
      message = error.message || 'Ha ocurrido un error inesperado.';
  }
  
  return {
    type: errorType,
    message,
    details,
    originalError: error,
  };
};

/**
 * Formatea mensajes de error para mostrar al usuario
 */
export const getErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'Ha ocurrido un error inesperado';
};

/**
 * Determina si el error requiere mostrar pantalla completa de error
 */
export const shouldShowErrorScreen = (errorType) => {
  return errorType === ERROR_TYPES.CRASH || errorType === ERROR_TYPES.AUTH;
};

/**
 * Crea un objeto de error estructurado
 */
export const createError = (type, message, details = null, source = 'Unknown') => {
  return {
    type,
    message,
    details,
    source,
    timestamp: Date.now(),
  };
};

/**
 * Maneja errores de red específicamente
 */
export const handleNetworkError = async (error, source = 'Unknown') => {
  const isConnected = await checkInternetConnection();
  
  let message = 'Error de conexión';
  let details = error.message;
  
  if (!isConnected) {
    message = 'Sin conexión a internet. Verifica tu conexión y vuelve a intentar.';
  } else if (error.message?.includes('timeout')) {
    message = 'La conexión está tardando demasiado. Intenta nuevamente.';
  }
  
  return createError(ERROR_TYPES.NETWORK, message, details, source);
};

/**
 * Maneja errores de autenticación
 */
export const handleAuthError = (error, source = 'Unknown') => {
  let message = 'Error de autenticación';
  const details = error.message;
  
  if (error.message?.includes('401')) {
    message = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
  } else if (error.message?.includes('403')) {
    message = 'No tienes permisos para realizar esta acción.';
  } else if (error.message?.includes('credentials')) {
    message = 'Credenciales inválidas. Verifica tu email y contraseña.';
  }
  
  return createError(ERROR_TYPES.AUTH, message, details, source);
};

/**
 * Maneja errores funcionales (de lógica de negocio)
 */
export const handleFunctionalError = (error, source = 'Unknown') => {
  const message = error.message || 'Error en la operación';
  const details = error.details || null;
  
  return createError(ERROR_TYPES.FUNCTIONAL, message, details, source);
};

/**
 * Logger de errores para desarrollo
 */
export const logError = (source, operation, error) => {
  if (__DEV__) {
    console.group(`🔴 Error en ${source}`);
    console.log('Operación:', operation);
    console.log('Mensaje:', error.message);
    console.log('Tipo:', error.type || 'unknown');
    console.log('Detalles:', error.details || error);
    console.groupEnd();
  }
};

/**
 * Wrapper para ejecutar código de forma segura
 */
export const safeExecute = async (fn, errorSource = 'Unknown') => {
  try {
    return await fn();
  } catch (error) {
    logError(errorSource, 'safeExecute', error);
    throw handleAPIError(error);
  }
};

/**
 * Valida respuestas de API
 */
export const validateAPIResponse = (response) => {
  if (!response) {
    throw new Error('Respuesta vacía del servidor');
  }
  
  if (response.success === false) {
    throw new Error(response.error || 'Error en la operación');
  }
  
  return true;
};

/**
 * Extrae mensaje de error de diferentes formatos
 */
export const extractErrorMessage = (error) => {
  // Si es string
  if (typeof error === 'string') {
    return error;
  }
  
  // Si tiene mensaje directo
  if (error?.message) {
    return error.message;
  }
  
  // Si es error de API con formato específico
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  // Fallback
  return 'Error desconocido';
};