import { db } from '@/firebase'
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore'

/**
 * Crea la cuenta de administrador verificando que no exista uno con el mismo DNI o email.
 */
export const createAdminAccount = async (adminData) => {
  try {
    console.log('🔍 Verificando DNI duplicado...');
    // Verificar si ya existe un administrador con el mismo DNI
    const dniQuery = query(collection(db, "admins"), where("dni", "==", adminData.dni))
    const dniSnapshot = await getDocs(dniQuery)
    
    if (!dniSnapshot.empty) {
      console.log('❌ DNI duplicado encontrado');
      return {
        success: false,
        message: 'Ya existe un administrador con ese DNI.',
        warning: true
      }
    }
    
    console.log('🔍 Verificando email duplicado...');
    // Verificar si ya existe un administrador con el mismo email
    const emailQuery = query(collection(db, "admins"), where("email", "==", adminData.email))
    const emailSnapshot = await getDocs(emailQuery)
    
    if (!emailSnapshot.empty) {
      console.log('❌ Email duplicado encontrado');
      return {
        success: false,
        message: 'Ya existe un administrador con ese email.',
        warning: true
      }
    }
    
    console.log('✅ No hay duplicados, creando administrador...');
    // Crear la cuenta de administrador
    const docRef = await addDoc(collection(db, "admins"), {
      ...adminData,
      fechaCreacion: new Date().toISOString()
    })
    
    console.log('✅ Administrador creado con ID:', docRef.id);
    
    return {
      success: true,
      message: 'Cuenta de administrador creada exitosamente.',
      id: docRef.id
    }
  } catch (error) {
    console.error('Error al crear administrador:', error)
    return {
      success: false,
      message: 'Error al crear la cuenta de administrador.',
      error: error.message
    }
  }
}

/**
 * Verifica si existe algún administrador en la base de datos
 */
export const checkAdminExists = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "admins"))
    return {
      exists: !querySnapshot.empty,
      count: querySnapshot.size
    }
  } catch (error) {
    console.error('Error al verificar administradores:', error)
    return { exists: false, count: 0 }
  }
} 