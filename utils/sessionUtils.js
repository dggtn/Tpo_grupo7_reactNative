import { SESSION_TIMEOUT } from '../config/constants';

/**
 * Verifica si una sesión ha expirado
 */
export const isSessionExpired = (loginTime, maxSessionTime = SESSION_TIMEOUT) => {
  if (!loginTime) return true;
  
  const currentTime = Date.now();
  const sessionDuration = currentTime - loginTime;
  
  return sessionDuration > maxSessionTime;
};

/**
 * Calcula tiempo restante de sesión
 */
export const getSessionTimeRemaining = (loginTime, maxSessionTime = SESSION_TIMEOUT) => {
  if (!loginTime) return 0;
  
  const currentTime = Date.now();
  const sessionDuration = currentTime - loginTime;
  const remaining = maxSessionTime - sessionDuration;
  
  return remaining > 0 ? remaining : 0;
};

/**
 * Formatea tiempo restante en formato legible
 */
export const formatSessionTime = (milliseconds) => {
  const minutes = Math.floor(milliseconds / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  
  return `${minutes}m`;
};

/**
 * Verifica si el token JWT ha expirado
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    // Decodificar el payload del JWT
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const payload = JSON.parse(jsonPayload);
    
    if (!payload.exp) return false;
    
    // Verificar si ha expirado
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error parsing token:', error);
    return true;
  }
};

/**
 * Obtiene información del token JWT
 */
export const getTokenInfo = (token) => {
  if (!token) return null;
  
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
};

/**
 * Calcula tiempo hasta expiración del token
 */
export const getTokenTimeToExpiration = (token) => {
  const tokenInfo = getTokenInfo(token);
  
  if (!tokenInfo || !tokenInfo.exp) return 0;
  
  const currentTime = Date.now() / 1000;
  const timeRemaining = (tokenInfo.exp - currentTime) * 1000;
  
  return timeRemaining > 0 ? timeRemaining : 0;
};

/**
 * Verifica si necesita refrescar el token
 */
export const shouldRefreshToken = (token, threshold = 5 * 60 * 1000) => {
  const timeToExpiration = getTokenTimeToExpiration(token);
  return timeToExpiration > 0 && timeToExpiration < threshold;
};

/**
 * Genera un ID único para la sesión
 */
export const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calcula duración de la sesión actual
 */
export const getSessionDuration = (loginTime) => {
  if (!loginTime) return 0;
  return Date.now() - loginTime;
};

/**
 * Formatea duración de sesión
 */
export const formatSessionDuration = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};