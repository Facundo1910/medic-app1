import { EMAILJS_CONFIG } from '@/config/emailConfig';

/**
 * Envía una notificación por email al paciente cuando se registra una nueva medicación usando Brevo.
 * @param {Object} medicationData - Datos de la medicación (medicamento, dosis, fechaHora).
 * @param {Object} patientData - Datos del paciente (nombre, email, enfermera).
 * @returns {Promise<{success: boolean, message: string, error?: string}>}
 */
export const sendMedicationNotification = async (medicationData, patientData) => {
  try {
    if (!patientData.email) {
      return { success: false, message: 'El paciente no tiene email registrado' };
    }
    let fechaFormateada = '';
    if (medicationData.fechaHora && !isNaN(new Date(medicationData.fechaHora))) {
      fechaFormateada = new Date(medicationData.fechaHora).toLocaleString('es-ES', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      });
    } else {
      fechaFormateada = 'Fecha no disponible';
    }
    // Configuración de Brevo
    const apiKey = process.env.VUE_APP_BREVO_API_KEY;
    const url = "https://api.brevo.com/v3/smtp/email";
    const data = {
      sender: {
        name: "MedicApp",
        email: "facubas39@gmail.com"
      },
      to: [{ email: patientData.email, name: patientData.nombre }],
      subject: `Nueva medicación registrada - MedicApp`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e88e5; text-align: center;">Nueva Medicación Registrada</h2>
          <p>Hola ${patientData.nombre},</p>
          <p>Se ha registrado una nueva medicación en tu historial médico:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Medicamento:</strong> ${medicationData.medicamento}</p>
            <p><strong>Dosis:</strong> ${medicationData.dosis} mg</p>
            <p><strong>Fecha y hora:</strong> ${fechaFormateada}</p>
            <p><strong>Administrado por:</strong> ${patientData.enfermera || 'Enfermera del equipo médico'}</p>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px; text-align: center;">
            Este es un mensaje automático de MedicApp. No respondas a este email.
          </p>
        </div>
      `
    };
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error de Brevo: ${errorData.message || response.statusText}`);
    }
    return { success: true, message: 'Notificación enviada exitosamente' };
  } catch (error) {
    return { success: false, message: 'Error al enviar la notificación por email', error: error.message };
  }
};

export const isEmailJSConfigured = () => {
  return EMAILJS_CONFIG.SERVICE_ID && EMAILJS_CONFIG.PUBLIC_KEY;
}; 