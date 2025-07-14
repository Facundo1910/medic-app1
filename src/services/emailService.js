import { EMAILJS_CONFIG } from '@/config/emailConfig'

/**
 * Envía una notificación por email al paciente cuando se registra una nueva medicación usando Brevo.
 * @param {Object} medicationData - Datos de la medicación (medicamento, dosis, fechaHora).
 * @param {Object} patientData - Datos del paciente (nombre, email, enfermera).
 * @returns {Promise<{success: boolean, message: string, error?: string}>}
 */
export const sendMedicationNotification = async (medicationData, patientData) => {
  try {
    // Validar que el paciente tenga email
    if (!patientData.email) {
      return { success: false, message: 'El paciente no tiene email registrado' }
    }

    // Formatear fecha de la medicación
    const fechaFormateada = formatMedicationDate(medicationData.fechaHora)

    // Configuración de Brevo
    const apiKey = process.env.VUE_APP_BREVO_API_KEY
    const url = "https://api.brevo.com/v3/smtp/email"
    
    const data = {
      sender: {
        name: "MedicApp",
        email: "facubas39@gmail.com"
      },
      to: [{ email: patientData.email, name: patientData.nombre }],
      subject: `Nueva medicación registrada - MedicApp`,
      htmlContent: generateEmailTemplate(medicationData, patientData, fechaFormateada)
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Error de Brevo: ${errorData.message || response.statusText}`)
    }

    return { success: true, message: 'Notificación enviada exitosamente' }
  } catch (error) {
    return { 
      success: false, 
      message: 'Error al enviar la notificación por email', 
      error: error.message 
    }
  }
}

/**
 * Envía una notificación por email al paciente cuando se registran signos vitales.
 * @param {Object} vitalSignsData - Datos de los signos vitales.
 * @param {Object} patientData - Datos del paciente (nombre, email, enfermera).
 * @returns {Promise<{success: boolean, message: string, error?: string}>}
 */
export const sendVitalSignsNotification = async (vitalSignsData, patientData) => {
  try {
    if (!patientData.email) {
      return { success: false, message: 'El paciente no tiene email registrado' }
    }
    const fechaFormateada = formatMedicationDate(vitalSignsData.fechaHora)
    const apiKey = process.env.VUE_APP_BREVO_API_KEY
    const url = "https://api.brevo.com/v3/smtp/email"
    const data = {
      sender: {
        name: "MedicApp",
        email: "facubas39@gmail.com"
      },
      to: [{ email: patientData.email, name: patientData.nombre }],
      subject: `Nuevo control de signos vitales - MedicApp`,
      htmlContent: generateVitalSignsEmailTemplate(vitalSignsData, patientData, fechaFormateada)
    }
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Error de Brevo: ${errorData.message || response.statusText}`)
    }
    return { success: true, message: 'Notificación de signos vitales enviada exitosamente' }
  } catch (error) {
    return {
      success: false,
      message: 'Error al enviar la notificación de signos vitales',
      error: error.message
    }
  }
}

/**
 * Envía un reporte PDF como adjunto al paciente usando Brevo.
 * @param {Object} patientData - Datos del paciente (nombre, email).
 * @param {string} base64pdf - PDF en base64 (sin encabezado data:...)
 * @returns {Promise<{success: boolean, message: string, error?: string}>}
 */
export const sendPatientReportWithAttachment = async (patientData, base64pdf) => {
  try {
    if (!patientData.email) {
      return { success: false, message: 'El paciente no tiene email registrado' }
    }
    const apiKey = process.env.VUE_APP_BREVO_API_KEY;
    const url = "https://api.brevo.com/v3/smtp/email";
    const data = {
      sender: {
        name: "MedicApp",
        email: "facubas39@gmail.com"
      },
      to: [{ email: patientData.email, name: patientData.nombre }],
      subject: `Reporte de signos vitales y medicaciones - MedicApp`,
      htmlContent: `<p>Hola ${patientData.nombre},<br>Adjuntamos tu reporte de signos vitales y medicaciones de los últimos días.<br><br>Este es un mensaje automático de MedicApp.</p>`,
      attachment: [
        {
          name: "reporte_medicapp.pdf",
          content: base64pdf
        }
      ]
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
    return { success: true, message: 'Reporte enviado exitosamente' };
  } catch (error) {
    return {
      success: false,
      message: 'Error al enviar el reporte por email',
      error: error.message
    };
  }
};

/**
 * Formatea la fecha de la medicación
 */
function formatMedicationDate(fechaHora) {
  if (fechaHora && !isNaN(new Date(fechaHora))) {
    return new Date(fechaHora).toLocaleString('es-ES', {
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit'
    })
  }
  return 'Fecha no disponible'
}

/**
 * Genera el template HTML del email
 */
function generateEmailTemplate(medicationData, patientData, fechaFormateada) {
  return `
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
}

function generateVitalSignsEmailTemplate(vital, patientData, fechaFormateada) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1e88e5; text-align: center;">Nuevo Control de Signos Vitales</h2>
      <p>Hola ${patientData.nombre},</p>
      <p>Se ha registrado un nuevo control de signos vitales en tu historial médico:</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Temperatura corporal:</strong> ${vital.temperatura} °C</p>
        <p><strong>Presión arterial:</strong> ${vital.presion} mmHg</p>
        <p><strong>Frecuencia cardíaca:</strong> ${vital.frecuenciaCardiaca} lpm</p>
        <p><strong>Frecuencia respiratoria:</strong> ${vital.frecuenciaRespiratoria} resps/min</p>
        <p><strong>Saturación de oxígeno:</strong> ${vital.saturacionOxigeno} %</p>
        <p><strong>Glucemia:</strong> ${vital.glucemia ? vital.glucemia + ' mg/dL' : 'No registrada'}</p>
        <p><strong>Fecha y hora:</strong> ${fechaFormateada}</p>
        <p><strong>Registrado por:</strong> ${patientData.enfermera || 'Enfermera del equipo médico'}</p>
      </div>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px; text-align: center;">
        Este es un mensaje automático de MedicApp. No respondas a este email.
      </p>
    </div>
  `
}

/**
 * Verifica si EmailJS está configurado
 */
export const isEmailJSConfigured = () => {
  return EMAILJS_CONFIG.SERVICE_ID && EMAILJS_CONFIG.PUBLIC_KEY
} 