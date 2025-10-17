import { VALIDATION } from '../config/constants';

/**
 * Valida un email
 */
export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return { valid: false, error: 'Email requerido' };
  }

  if (!VALIDATION.EMAIL_REGEX.test(email)) {
    return { valid: false, error: 'Email inválido' };
  }

  return { valid: true, error: null };
};

/**
 * Valida una contraseña
 */
export const validatePassword = (password) => {
  if (!password || !password.trim()) {
    return { valid: false, error: 'Contraseña requerida' };
  }

  if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      error: `La contraseña debe tener al menos ${VALIDATION.PASSWORD_MIN_LENGTH} caracteres`,
    };
  }

  return { valid: true, error: null };
};

/**
 * Valida confirmación de contraseña
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    return { valid: false, error: 'Las contraseñas no coinciden' };
  }

  return { valid: true, error: null };
};

/**
 * Valida código de verificación
 */
export const validateVerificationCode = (code) => {
  if (!code || !code.trim()) {
    return { valid: false, error: 'Código requerido' };
  }

  if (code.length !== VALIDATION.CODE_LENGTH) {
    return {
      valid: false,
      error: `El código debe tener ${VALIDATION.CODE_LENGTH} dígitos`,
    };
  }

  if (!/^\d+$/.test(code)) {
    return { valid: false, error: 'El código debe contener solo números' };
  }

  return { valid: true, error: null };
};

/**
 * Valida formulario de login
 */
export const validateLoginForm = (email, password) => {
  const errors = {};

  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    errors.email = emailValidation.error;
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.error;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Valida formulario de registro
 */
export const validateRegisterForm = (email, password, confirmPassword) => {
  const errors = {};

  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    errors.email = emailValidation.error;
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.error;
  }

  const passwordMatchValidation = validatePasswordMatch(password, confirmPassword);
  if (!passwordMatchValidation.valid) {
    errors.confirmPassword = passwordMatchValidation.error;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Sanitiza input de email
 */
export const sanitizeEmail = (email) => {
  return email.trim().toLowerCase();
};

/**
 * Verifica fortaleza de contraseña
 */
export const checkPasswordStrength = (password) => {
  let strength = 0;
  const checks = {
    hasLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  // Calcular fortaleza
  Object.values(checks).forEach((check) => {
    if (check) strength++;
  });

  let level = 'weak';
  if (strength >= 4) level = 'strong';
  else if (strength >= 3) level = 'medium';

  return {
    level,
    score: strength,
    checks,
  };
};