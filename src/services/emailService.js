import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '@/config/emailConfig';

/**
 * Envía una notificación por email al paciente cuando se registra una nueva medicación.
 * @param {Object} medicationData - Datos de la medicación (medicamento, dosis, fechaHora).
 * @param {Object} patientData - Datos del paciente (nombre, email, enfermera).
 * @returns {Promise<{success: boolean, message: string, error?: string}>}
 */
export const sendMedicationNotification = async (medicationData, patientData) => {
  try {
    if (!patientData.email) {
      return { success: false, message: 'El paciente no tiene email registrado' };
    }
    const fechaFormateada = new Date(medicationData.fechaHora).toLocaleString('es-ES', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
    const templateParams = {
      to_email: patientData.email,
      to_name: patientData.nombre,
      medicamento: medicationData.medicamento,
      dosis: `${medicationData.dosis} mg`,
      fecha_hora: fechaFormateada,
      enfermera: patientData.enfermera || 'Enfermera del equipo médico'
    };
    await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      'template_z6hdnq9', // TEMPLATE_ID fijo para medicación
      templateParams,
      EMAILJS_CONFIG.PUBLIC_KEY
    );
    return { success: true, message: 'Notificación enviada exitosamente' };
  } catch (error) {
    return { success: false, message: 'Error al enviar la notificación por email', error: error.message };
  }
};

export const isEmailJSConfigured = () => {
  return EMAILJS_CONFIG.SERVICE_ID && EMAILJS_CONFIG.PUBLIC_KEY;
}; 