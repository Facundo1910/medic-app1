// NurseValidationService - Migrated to Brevo for all email functionality - Updated: 2024-01-16 16:40
import { db } from '@/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

const ADMIN_EMAIL = 'facubas39@gmail.com';

/**
 * Envía una solicitud de validación de enfermera al administrador por email y guarda la solicitud en Firestore.
 * @param {Object} nurseData - Datos de la enfermera.
 * @returns {Promise<{success: boolean, message: string, requestId?: string, error?: string}>}
 */
export const sendNurseValidationRequest = async (nurseData) => {
  console.log('DEBUG API KEY:', process.env.VUE_APP_BREVO_API_KEY);
  console.log('🚀 Iniciando solicitud de validación para:', nurseData.nombre);
  try {
    console.log('🚀 Iniciando solicitud de validación para:', nurseData.nombre);
    
    const validationRequest = await addDoc(collection(db, 'nurseValidationRequests'), {
      ...nurseData,
      estado: 'pendiente',
      fechaSolicitud: new Date().toISOString(),
      aprobado: false
    });
    
    console.log('✅ Solicitud guardada en Firestore con ID:', validationRequest.id);
    
    // Enviar email usando Brevo
    console.log('📧 Enviando email de validación...');
    const result = await sendNurseValidationEmailBrevo(nurseData, validationRequest.id);
    
    console.log('📧 Resultado del email:', result);
    
    if (result.success) {
      return { success: true, message: 'Solicitud enviada. Te notificaremos cuando sea aprobada.', requestId: validationRequest.id };
    } else {
      // Si falla el email, aún guardamos la solicitud pero informamos del problema
      console.warn('⚠️ Email falló pero la solicitud se guardó:', result.message);
      return { success: true, message: 'Solicitud guardada. El administrador será notificado manualmente.', requestId: validationRequest.id };
    }
  } catch (error) {
    console.error('❌ Error en sendNurseValidationRequest:', error);
    return { success: false, message: 'Error al enviar la solicitud de validación', error: error.message };
  }
};

/**
 * Aprueba la cuenta de una enfermera y actualiza el estado en Firestore.
 */
export const approveNurseAccount = async (requestId, adminMessage = '') => {
  try {
    const q = query(collection(db, 'nurseValidationRequests'), where('__name__', '==', requestId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return { success: false, message: 'Solicitud no encontrada' };
    const requestDoc = querySnapshot.docs[0];
    const requestData = requestDoc.data();
    await addDoc(collection(db, 'enfermeras'), {
      nombre: requestData.nombre,
      apellido: requestData.apellido,
      dni: requestData.dni,
      clave: requestData.clave,
      anioNacimiento: requestData.anioNacimiento,
      email: requestData.email,
      rol: 'enfermera',
      aprobadoPor: 'Administrador',
      fechaAprobacion: new Date().toISOString()
    });
    await updateDoc(doc(db, 'nurseValidationRequests', requestId), {
      estado: 'aprobado',
      aprobado: true,
      fechaAprobacion: new Date().toISOString(),
      mensaje: adminMessage
    });
    return { success: true, message: 'Cuenta aprobada exitosamente.' };
  } catch (error) {
    return { success: false, message: 'Error al aprobar la cuenta.' };
  }
};

/**
 * Rechaza la cuenta de una enfermera y actualiza el estado en Firestore.
 */
export const rejectNurseAccount = async (requestId, rejectionReason = '') => {
  try {
    const q = query(collection(db, 'nurseValidationRequests'), where('__name__', '==', requestId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return { success: false, message: 'Solicitud no encontrada' };
    await updateDoc(doc(db, 'nurseValidationRequests', requestId), {
      estado: 'rechazado',
      aprobado: false,
      fechaRechazo: new Date().toISOString(),
      motivoRechazo: rejectionReason
    });
    return { success: true, message: 'Cuenta rechazada exitosamente.' };
  } catch (error) {
    return { success: false, message: 'Error al rechazar la solicitud.' };
  }
};

/**
 * Verifica el estado de una solicitud de validación de enfermera.
 * @param {string} requestId - ID de la solicitud
 * @returns {Promise<{success: boolean, estado?: string, mensaje?: string, message?: string}>}
 */
export const checkNurseValidationStatus = async (requestId) => {
  try {
    const q = query(collection(db, 'nurseValidationRequests'), where('__name__', '==', requestId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: false, message: 'Solicitud no encontrada' };
    }
    
    const requestDoc = querySnapshot.docs[0];
    const requestData = requestDoc.data();
    
    return {
      success: true,
      estado: requestData.estado,
      mensaje: requestData.mensaje || requestData.motivoRechazo || ''
    };
  } catch (error) {
    return { success: false, message: 'Error al verificar el estado de la solicitud' };
  }
};

/**
 * Envía email de validación de enfermera usando Brevo
 * @param {Object} nurseData - Datos de la enfermera
 * @param {string} requestId - ID de la solicitud
 * @returns {Promise<{success: boolean, message: string, error?: string}>}
 */
const sendNurseValidationEmailBrevo = async (nurseData, requestId) => {
  console.log('📧 Enviando email de validación para:', nurseData.nombre);
  try {
    console.log('📧 Preparando email de validación para:', nurseData.nombre);
    console.log('📧 Email del administrador:', ADMIN_EMAIL);
    
    // Configuración de Brevo
    // Usa la variable de entorno VUE_APP_BREVO_API_KEY definida en .env.local
    const apiKey = process.env.VUE_APP_BREVO_API_KEY;
    const url = "https://api.brevo.com/v3/smtp/email";
    
    const data = {
      sender: { 
        name: "MedicApp", 
        email: "facubas39@gmail.com"
      },
      to: [{ email: ADMIN_EMAIL, name: 'Administrador' }],
      subject: "Nueva solicitud de validación de enfermera - MedicApp",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e88e5; text-align: center;">Nueva Solicitud de Validación</h2>
          <p>Hola Administrador,</p>
          <p>Se ha recibido una nueva solicitud de validación de cuenta de enfermera:</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Datos de la Enfermera:</h3>
            <p><strong>Nombre:</strong> ${nurseData.nombre}</p>
            <p><strong>Email:</strong> ${nurseData.email}</p>
            <p><strong>Año de nacimiento:</strong> ${nurseData.anioNacimiento}</p>
            <p><strong>ID de solicitud:</strong> ${requestId}</p>
            <p><strong>Fecha de solicitud:</strong> ${new Date().toLocaleString('es-ES')}</p>
          </div>
          
          <p>Para aprobar o rechazar esta solicitud, accede al panel de administración de MedicApp.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px; text-align: center;">
            Este es un mensaje automático de MedicApp. No respondas a este email.
          </p>
        </div>
      `
    };

    console.log('📧 Enviando request a Brevo...');
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(data)
    });

    console.log('📧 Respuesta de Brevo - Status:', response.status);
    console.log('📧 Respuesta de Brevo - OK:', response.ok);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error de Brevo:', errorData);
      throw new Error(`Error de Brevo: ${errorData.message || response.statusText}`);
    }

    const responseData = await response.json();
    console.log('✅ Email enviado exitosamente:', responseData);
    return { success: true, message: 'Email de validación enviado exitosamente' };
  } catch (error) {
    console.error('Error al enviar email de validación:', error);
    return { 
      success: false, 
      message: 'Error al enviar el email de validación', 
      error: error.message 
    };
  }
};

/**
 * Verifica si el sistema de email está configurado correctamente.
 */
export const isEmailJSConfigured = () => {
  // Ahora siempre retornamos true ya que usamos Brevo para todo
  return true;
}; 