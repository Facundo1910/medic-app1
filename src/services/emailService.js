import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '@/config/emailConfig';

export const sendMedicationNotification = async (medicationData, patientData) => {
  try {
    // Verificar que el paciente tenga email
    if (!patientData.email) {
      console.warn('El paciente no tiene email registrado');
      return { success: false, message: 'El paciente no tiene email registrado' };
    }

    // Formatear la fecha para el email
    const fechaFormateada = new Date(medicationData.fechaHora).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Preparar los datos del template
    const templateParams = {
      to_email: patientData.email,
      to_name: patientData.nombre,
      medicamento: medicationData.medicamento,
      dosis: `${medicationData.dosis} mg`,
      fecha_hora: fechaFormateada,
      enfermera: patientData.enfermera || 'Enfermera del equipo médico'
    };

    // Enviar el email
    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams,
      EMAILJS_CONFIG.PUBLIC_KEY
    );

    console.log('Email enviado exitosamente:', response);
    return { success: true, message: 'Notificación enviada exitosamente' };

  } catch (error) {
    console.error('Error al enviar email:', error);
    return { 
      success: false, 
      message: 'Error al enviar la notificación por email',
      error: error.message 
    };
  }
};

// Función para inicializar EmailJS
export const initEmailJS = () => {
  emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
};

// Función para verificar si EmailJS está configurado
export const isEmailJSConfigured = () => {
  return EMAILJS_CONFIG.SERVICE_ID !== 'YOUR_SERVICE_ID' &&
         EMAILJS_CONFIG.TEMPLATE_ID !== 'YOUR_TEMPLATE_ID' &&
         EMAILJS_CONFIG.PUBLIC_KEY !== 'YOUR_PUBLIC_KEY';
}; 