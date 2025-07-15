import { db } from '@/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';

/**
 * Obtiene todos los medicamentos disponibles
 * @returns {Promise<Array>} Lista de medicamentos
 */
export const getMedicamentos = async () => {
  try {
    const medicamentosSnap = await getDocs(collection(db, "medicamentos"));
    return medicamentosSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error al obtener medicamentos:", error);
    throw error;
  }
};

/**
 * Agrega un nuevo medicamento
 * @param {Object} medicamentoData - Datos del medicamento
 * @returns {Promise<Object>} Medicamento creado
 */
export const addMedicamento = async (medicamentoData) => {
  try {
    const docRef = await addDoc(collection(db, "medicamentos"), {
      ...medicamentoData,
      fechaCreacion: new Date().toISOString()
    });
    
    return {
      id: docRef.id,
      ...medicamentoData
    };
  } catch (error) {
    console.error("Error al agregar medicamento:", error);
    throw error;
  }
};

/**
 * Elimina un medicamento
 * @param {string} medicamentoId - ID del medicamento a eliminar
 * @returns {Promise<void>}
 */
export const deleteMedicamento = async (medicamentoId) => {
  try {
    await deleteDoc(doc(db, "medicamentos", medicamentoId));
  } catch (error) {
    console.error("Error al eliminar medicamento:", error);
    throw error;
  }
};

/**
 * Actualiza un medicamento existente
 * @param {string} medicamentoId - ID del medicamento
 * @param {Object} medicamentoData - Nuevos datos del medicamento
 * @returns {Promise<void>}
 */
export const updateMedicamento = async (medicamentoId, medicamentoData) => {
  try {
    await updateDoc(doc(db, "medicamentos", medicamentoId), {
      ...medicamentoData,
      fechaActualizacion: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error al actualizar medicamento:", error);
    throw error;
  }
};

/**
 * Busca medicamentos por nombre
 * @param {string} nombre - Nombre del medicamento a buscar
 * @returns {Promise<Array>} Lista de medicamentos que coinciden
 */
export const searchMedicamentos = async (nombre) => {
  try {
    const q = query(
      collection(db, "medicamentos"),
      where("nombre", ">=", nombre),
      where("nombre", "<=", nombre + "\uf8ff")
    );
    const medicamentosSnap = await getDocs(q);
    return medicamentosSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error al buscar medicamentos:", error);
    throw error;
  }
};

/**
 * Obtiene medicamentos por frecuencia de administración
 * @param {string} frecuencia - Frecuencia a filtrar
 * @returns {Promise<Array>} Lista de medicamentos con esa frecuencia
 */
export const getMedicamentosByFrecuencia = async (frecuencia) => {
  try {
    const q = query(
      collection(db, "medicamentos"),
      where("frecuencia", "==", frecuencia)
    );
    const medicamentosSnap = await getDocs(q);
    return medicamentosSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error al obtener medicamentos por frecuencia:", error);
    throw error;
  }
}; 