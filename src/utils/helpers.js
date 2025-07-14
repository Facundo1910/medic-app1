import { ROLES } from '@/config/constants'
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Formatea una fecha a formato legible
 * @param {string|Date} date - Fecha a formatear
 * @param {string} locale - Locale para el formato (default: 'es-ES')
 * @returns {string} Fecha formateada
 */
export function formatDate(date, locale = 'es-ES') {
  if (!date || isNaN(new Date(date))) {
    return 'Fecha no disponible'
  }
  
  return new Date(date).toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Valida un DNI argentino
 * @param {string} dni - DNI a validar
 * @returns {boolean} true si es válido
 */
export function validateDNI(dni) {
  if (!dni) return false
  const dniStr = dni.toString().trim()
  return /^\d{7,8}$/.test(dniStr)
}

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} true si es válido
 */
export function validateEmail(email) {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida una contraseña
 * @param {string} password - Contraseña a validar
 * @returns {boolean} true si es válida
 */
export function validatePassword(password) {
  return password && password.length >= 8
}

/**
 * Obtiene el usuario del localStorage
 * @returns {Object|null} Usuario o null si no existe
 */
export function getCurrentUser() {
  try {
    const user = localStorage.getItem('usuario')
    return user ? JSON.parse(user) : null
  } catch (error) {
    console.error('Error al obtener usuario:', error)
    return null
  }
}

/**
 * Guarda el usuario en localStorage
 * @param {Object} user - Usuario a guardar
 */
export function setCurrentUser(user) {
  try {
    localStorage.setItem('usuario', JSON.stringify(user))
  } catch (error) {
    console.error('Error al guardar usuario:', error)
  }
}

/**
 * Elimina el usuario del localStorage
 */
export function clearCurrentUser() {
  try {
    localStorage.removeItem('usuario')
  } catch (error) {
    console.error('Error al eliminar usuario:', error)
  }
}

/**
 * Verifica si el usuario tiene un rol específico
 * @param {string} requiredRole - Rol requerido
 * @returns {boolean} true si el usuario tiene el rol
 */
export function hasRole(requiredRole) {
  const user = getCurrentUser()
  return user && user.rol === requiredRole
}

/**
 * Obtiene la ruta según el rol del usuario
 * @param {string} role - Rol del usuario
 * @returns {string} Ruta correspondiente
 */
export function getRouteByRole(role) {
  switch (role) {
    case ROLES.ADMIN:
      return '/admin'
    case ROLES.ENFERMERA:
      return '/enfermera'
    case ROLES.PACIENTE:
      return '/paciente'
    default:
      return '/'
  }
}

/**
 * Capitaliza la primera letra de una cadena
 * @param {string} str - Cadena a capitalizar
 * @returns {string} Cadena capitalizada
 */
export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Genera un ID único simple
 * @returns {string} ID único
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * Debounce function para optimizar llamadas
 * @param {Function} func - Función a debounce
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} Función debounced
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
} 

/**
 * Genera un PDF con los gráficos de signos vitales y una tabla de medicaciones.
 * @param {HTMLElement} chartElement - Elemento DOM del gráfico a capturar.
 * @param {Array} medicaciones - Array de objetos de medicación.
 * @param {Object} paciente - Datos del paciente (nombre, apellido, dni, email).
 * @returns {Promise<Blob>} - Blob del PDF generado.
 */
export async function generarPDFSignosYMedicaciones(chartElement, medicaciones, paciente) {
  const doc = new jsPDF('p', 'mm', 'a4');
  // Título y datos del paciente
  doc.setFontSize(18);
  doc.text('Resumen de Signos Vitales y Medicaciones', 14, 18);
  doc.setFontSize(12);
  doc.text(`Paciente: ${paciente.apellido}, ${paciente.nombre} (DNI: ${paciente.dni})`, 14, 28);
  doc.text(`Email: ${paciente.email || '-'}`, 14, 34);
  doc.text(`Fecha de generación: ${new Date().toLocaleString('es-ES')}`, 14, 40);

  // Capturar el gráfico como imagen
  if (chartElement) {
    const canvas = await html2canvas(chartElement, { backgroundColor: '#fff', scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', 14, 45, 180, 60);
  }

  // Tabla de medicaciones
  let y = 110;
  doc.setFontSize(14);
  doc.text('Historial de Medicaciones', 14, y);
  y += 6;
  doc.setFontSize(11);
  doc.setFillColor(230, 240, 255);
  doc.rect(14, y, 180, 8, 'F');
  doc.text('Medicamento', 16, y + 6);
  doc.text('Dosis', 70, y + 6);
  doc.text('Fecha y hora', 110, y + 6);
  y += 10;
  medicaciones.slice(0, 30).forEach(med => {
    doc.text(med.medicamento || '-', 16, y);
    doc.text((med.dosis ? med.dosis + ' mg' : '-'), 70, y);
    doc.text(med.fechaHora ? new Date(med.fechaHora).toLocaleString('es-ES') : '-', 110, y);
    y += 8;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  return doc.output('blob');
} 