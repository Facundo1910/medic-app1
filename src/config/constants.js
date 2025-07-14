// Constantes de la aplicación
export const APP_NAME = 'MedicApp'

// Roles de usuario
export const ROLES = {
  ADMIN: 'admin',
  ENFERMERA: 'enfermera',
  PACIENTE: 'paciente'
}

// Rutas de la aplicación
export const ROUTES = {
  HOME: '/',
  ENFERMERA: '/enfermera',
  PACIENTE: '/paciente',
  ADMIN: '/admin',
  CREATE_ADMIN: '/create-admin',
  LOGIN_ADMIN: '/login-admin',
  REGISTER_ADMIN: '/register-admin'
}

// Configuración de Firebase
export const FIREBASE_COLLECTIONS = {
  ADMINS: 'admins',
  ENFERMERAS: 'enfermeras',
  PACIENTES: 'pacientes',
  MEDICACIONES: 'medicaciones',
  DIAGNOSTICOS: 'diagnosticos',
  NURSE_VALIDATIONS: 'nurse_validations'
}

// Configuración de email
export const EMAIL_CONFIG = {
  SENDER_NAME: 'MedicApp',
  SENDER_EMAIL: 'facubas39@gmail.com',
  BREVO_URL: 'https://api.brevo.com/v3/smtp/email'
}

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Verifica tu internet.',
  AUTH_ERROR: 'Error de autenticación.',
  VALIDATION_ERROR: 'Datos inválidos.',
  GENERIC_ERROR: 'Ha ocurrido un error inesperado.'
}

// Configuración de validación
export const VALIDATION_RULES = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_DNI_LENGTH: 10,
  MIN_YEAR: 1900,
  MAX_YEAR: 2100
} 