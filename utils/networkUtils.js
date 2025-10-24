import { store } from '../store/store';
import { logout } from '../store/slices/authSlice';
import { setAuthError } from '../store/slices/errorSlice';

/**
 * Interceptor para agregar token a las requests
 */
export const applyAuthInterceptor = (url, options = {}) => {
  const state = store.getState();
  const token = state.auth.token;

  // URLs que no requieren autenticación
  const publicEndpoints = [
    '/auth/authenticate',
    '/auth/iniciar-registro',
    '/auth/finalizar-registro',
    '/auth/verificar-email-pendiente',
    '/auth/reenviar-codigo',
  ];

  const isPublicEndpoint = publicEndpoints.some(endpoint => url.includes(endpoint));

  if (!isPublicEndpoint && token) {
    return {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    };
  }

  return options;
};

/**
 * Wrapper de fetch con manejo automático de errores y autenticación
 */
export const authenticatedFetch = async (url, options = {}) => {
  try {
    // Aplicar interceptor de autenticación
    const finalOptions = applyAuthInterceptor(url, options);

    const response = await fetch(url, finalOptions);

    // Manejar errores de autenticación
    if (response.status === 401) {
      // Token expirado o inválido
      store.dispatch(logout());
      store.dispatch(
        setAuthError({
          message: 'Tu sesión ha expirado',
          details: 'Por favor, inicia sesión nuevamente',
          source: 'Network',
        })
      );
      throw new Error('Session expired');
    }

    if (response.status === 403) {
      throw new Error('No tienes permisos para realizar esta acción');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP Error: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error('Authenticated fetch error:', error);
    throw error;
  }
};

/**
 * Verifica si una URL debe usar autenticación
 */
export const shouldAuthenticate = (url) => {
  const publicEndpoints = [
    '/auth/authenticate',
    '/auth/iniciar-registro',
    '/auth/finalizar-registro',
    '/auth/verificar-email-pendiente',
    '/auth/reenviar-codigo',
  ];

  return !publicEndpoints.some(endpoint => url.includes(endpoint));
};

/**
 * Obtiene headers por defecto para las requests
 */
export const getDefaultHeaders = () => {
  return {
    'Content-Type': 'application/json',
  };
};

/**
 * Maneja respuestas de la API
 */
export const handleAPIResponse = async (response) => {
  const data = await response.json();

  // Verificar si la respuesta tiene el formato ApiResponse
  if (data.success === false) {
    throw new Error(data.error || 'Error en la operación');
  }

  return data.data || data;
};