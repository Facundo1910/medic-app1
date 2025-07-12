import { db } from '@/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

function generateToken(length = 6) {
  const chars = '0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Solicita recuperación de contraseña: genera token y lo envía por email
 */
export const requestPasswordReset = async (email) => {
  try {
    let userDoc = null;
    let userType = null;
    for (const col of ['pacientes', 'enfermeras']) {
      const q = query(collection(db, col), where('email', '==', email));
      const snap = await getDocs(q);
      if (!snap.empty) {
        userDoc = snap.docs[0];
        userType = col;
        break;
      }
    }
    if (!userDoc) {
      return { success: false, message: 'No se encontró un usuario con ese email.' };
    }
    const token = generateToken(6);
    const expires = Date.now() + 60 * 60 * 1000;
    await updateDoc(doc(db, userType, userDoc.id), {
      passwordResetToken: token,
      passwordResetExpires: expires
    });
    // Enviar email con Brevo
    const apiKey = process.env.VUE_APP_BREVO_API_KEY;
    const url = "https://api.brevo.com/v3/smtp/email";
    const data = {
      sender: {
        name: "MedicApp",
        email: "facubas39@gmail.com"
      },
      to: [{ email, name: userDoc.data().nombre || 'Usuario' }],
      subject: "Código de recuperación de contraseña - MedicApp",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e88e5; text-align: center;">Recuperación de Contraseña</h2>
          <p>Hola ${userDoc.data().nombre || ''},</p>
          <p>Tu código de recuperación es:</p>
          <div style="font-size: 2rem; font-weight: bold; color: #1e88e5; text-align: center; margin: 20px 0;">${token}</div>
          <p>Este código es válido por 1 hora. Si no solicitaste este cambio, ignora este mensaje.</p>
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
    return { success: true, message: 'Se envió el código de recuperación. Revisa tu email.' };
  } catch (error) {
    return { success: false, message: 'Error al solicitar recuperación de contraseña', error: error.message };
  }
};

/**
 * Cambia la contraseña usando el token recibido por email
 */
export const resetPasswordWithToken = async (email, token, newPassword) => {
  try {
    let userDoc = null;
    let userType = null;
    for (const col of ['pacientes', 'enfermeras']) {
      const q = query(collection(db, col), where('email', '==', email), where('passwordResetToken', '==', token));
      const snap = await getDocs(q);
      if (!snap.empty) {
        userDoc = snap.docs[0];
        userType = col;
        break;
      }
    }
    if (!userDoc) {
      return { success: false, message: 'Código inválido o expirado.' };
    }
    const data = userDoc.data();
    if (!data.passwordResetExpires || data.passwordResetExpires < Date.now()) {
      return { success: false, message: 'El código expiró. Solicita uno nuevo.' };
    }
    await updateDoc(doc(db, userType, userDoc.id), {
      clave: newPassword,
      passwordResetToken: null,
      passwordResetExpires: null
    });
    return { success: true, message: 'Contraseña actualizada correctamente.' };
  } catch (error) {
    return { success: false, message: 'Error al actualizar la contraseña.' };
  }
}; 