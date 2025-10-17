// URL base de la API
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8080';

// Tiempos de expiración
export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos
export const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutos antes de expirar

// Configuración de biometría
export const BIOMETRIC_CONFIG = {
  MAX_DAYS_WITHOUT_USE: 30,
  PROMPT_MESSAGE: 'Autenticación biométrica',
  CANCEL_LABEL: 'Cancelar',
};

// Configuración de registro
export const REGISTRATION_CONFIG = {
  CODE_LENGTH: 4,
  CODE_EXPIRATION: 10 * 60 * 1000, // 10 minutos
  MAX_ATTEMPTS: 3,
};

// Mensajes de error
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Verifica tu internet.',
  AUTH_ERROR: 'Error de autenticación. Inicia sesión nuevamente.',
  SESSION_EXPIRED: 'Tu sesión ha expirado.',
  INVALID_CREDENTIALS: 'Credenciales inválidas.',
  EMAIL_ALREADY_EXISTS: 'El email ya está registrado.',
  PENDING_REGISTRATION: 'Tienes un registro pendiente.',
  INVALID_CODE: 'Código de verificación inválido.',
  CODE_EXPIRED: 'El código ha expirado.',
  BIOMETRIC_NOT_AVAILABLE: 'Biometría no disponible en este dispositivo.',
  BIOMETRIC_NOT_ENROLLED: 'No hay datos biométricos configurados.',
};

// Rutas de navegación
export const ROUTES = {
  LOGIN: 'Login',
  REGISTER: 'Register',
  VERIFICATION: 'Verification',
  RECOVERY: 'Recovery',
  HOME: 'Home',
  PROFILE: 'Perfil',
  ERROR: 'Error',
};

// Validaciones
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  CODE_LENGTH: 4,
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_EMAIL: 'user_email',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  BIOMETRIC_USER_EMAIL: 'biometric_user_email',
};