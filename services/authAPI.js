import { API_BASE_URL } from '../../config/constants';
import { handleAPIError } from '../utils/errorUtils';

class AuthAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Helper para hacer requests con fetch
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const finalOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, finalOptions);
      
      // Si la respuesta no es ok, lanzar error
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || `HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      
      // Verificar si la respuesta tiene el formato ApiResponse
      if (data.success === false) {
        throw new Error(data.error || 'Error en la operación');
      }

      return data.data || data;
    } catch (error) {
      console.error(`Error en ${endpoint}:`, error);
      throw handleAPIError(error);
    }
  }

  /**
   * Autenticación
   */
  async authenticate(email, password) {
    return this.request('/auth/authenticate', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  /**
   * Iniciar registro
   */
  async iniciarRegistro(userData) {
    return this.request('/auth/iniciar-registro', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  /**
   * Finalizar registro (verificación)
   */
  async finalizarRegistro(email, code) {
    return this.request('/auth/finalizar-registro', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  /**
   * Verificar email pendiente
   */
  async verificarEmailPendiente(email) {
    return this.request('/auth/verificar-email-pendiente', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  /**
   * Reenviar código
   */
  async reenviarCodigo(email) {
    return this.request('/auth/reenviar-codigo', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  /**
   * Logout
   */
  async logout(token) {
    return this.request('/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }
}

export const authAPI = new AuthAPI();