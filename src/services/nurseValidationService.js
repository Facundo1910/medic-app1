import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '@/config/emailConfig';
import { db } from '@/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

const ADMIN_EMAIL = 'facubas39@gmail.com';

/**
 * Envía una solicitud de validación de enfermera al administrador por email y guarda la solicitud en Firestore.
 * @param {Object} nurseData - Datos de la enfermera.
 * @returns {Promise<{success: boolean, message: string, requestId?: string, error?: string}>}
 */
export const sendNurseValidationRequest = async (nurseData) => {
  try {
    const validationRequest = await addDoc(collection(db, 'nurseValidationRequests'), {
      ...nurseData,
      estado: 'pendiente',
      fechaSolicitud: new Date().toISOString(),
      aprobado: false
    });
    const templateParams = {
      to_email: ADMIN_EMAIL,
      to_name: 'Administrador',
      nurse_name: nurseData.nombre,
      nurse_email: nurseData.email,
      nurse_anio: nurseData.anioNacimiento,
      request_id: validationRequest.id,
      fecha_solicitud: new Date().toLocaleString('es-ES')
    };
    await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID, // TEMPLATE_ID para validación de enfermeras
      templateParams,
      EMAILJS_CONFIG.PUBLIC_KEY
    );
    return { success: true, message: 'Solicitud enviada. Te notificaremos cuando sea aprobada.', requestId: validationRequest.id };
  } catch (error) {
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
 * Verifica si EmailJS está configurado correctamente.
 */
export const isEmailJSConfigured = () => {
  return EMAILJS_CONFIG.SERVICE_ID && EMAILJS_CONFIG.TEMPLATE_ID && EMAILJS_CONFIG.PUBLIC_KEY;
}; 