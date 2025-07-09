import { db } from '@/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

/**
 * Crea la cuenta de administrador solo si no existe ningún admin.
 * Si ya existe, retorna un warning y no crea nada.
 */
export const createAdminAccount = async (adminData) => {
  try {
    // Verificar si ya existe algún administrador
    const querySnapshot = await getDocs(collection(db, "admins"));
    if (!querySnapshot.empty) {
      return {
        success: false,
        message: 'Ya existe un administrador registrado. Solo se permite uno.',
        warning: true
      };
    }
    // Crear la cuenta de administrador
    const docRef = await addDoc(collection(db, "admins"), {
      ...adminData,
      fechaCreacion: new Date().toISOString()
    });
    return {
      success: true,
      message: 'Cuenta de administrador creada exitosamente.',
      id: docRef.id
    };
  } catch (error) {
    console.error('Error al crear administrador:', error);
    return {
      success: false,
      message: 'Error al crear la cuenta de administrador.',
      error: error.message
    };
  }
};

export const checkAdminExists = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "admins"));
    return {
      exists: !querySnapshot.empty,
      count: querySnapshot.size
    };
  } catch (error) {
    console.error('Error al verificar administradores:', error);
    return { exists: false, count: 0 };
  }
}; 