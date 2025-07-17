// Script para crear cuenta de administrador
// Ejecuta este script en la consola del navegador en tu aplicación

// Función para crear cuenta de administrador
async function crearAdmin() {
  const adminData = {
    nombre: prompt("Ingresa el nombre del administrador:"),
    clave: prompt("Ingresa la clave del administrador:"),
    email: prompt("Ingresa el email del administrador:"),
    rol: "admin"
  };

  if (!adminData.nombre || !adminData.clave || !adminData.email) {
    alert("Todos los campos son requeridos");
    return;
  }

  try {
    // Importar Firebase (asegúrate de que Firebase esté disponible)
    const { db } = await import('./src/firebase.js');
    const { collection, addDoc } = await import('firebase/firestore');

    // Crear la cuenta de administrador
    const docRef = await addDoc(collection(db, "admins"), adminData);
    
    alert(`✅ Cuenta de administrador creada exitosamente!\nID: ${docRef.id}`);
    console.log("Datos del administrador:", adminData);
    
  } catch (error) {
    console.error("Error al crear administrador:", error);
    alert("❌ Error al crear la cuenta de administrador");
  }
}

// Función para verificar si ya existe un administrador
async function verificarAdmin() {
  try {
    const { db } = await import('./src/firebase.js');
    const { collection, getDocs } = await import('firebase/firestore');

    const querySnapshot = await getDocs(collection(db, "admins"));
    
    if (querySnapshot.empty) {
      console.log("No hay administradores registrados");
      return false;
    } else {
      console.log("Administradores existentes:");
      querySnapshot.forEach((doc) => {
        console.log("-", doc.data().nombre, "(ID:", doc.id + ")");
      });
      return true;
    }
  } catch (error) {
    console.error("Error al verificar administradores:", error);
    return false;
  }
}

// Función principal
async function main() {
  console.log("🔧 Script de creación de administrador");
  console.log("=====================================");
  
  const existeAdmin = await verificarAdmin();
  
  if (existeAdmin) {
    const continuar = confirm("Ya existe al menos un administrador. ¿Deseas crear otro?");
    if (!continuar) {
      console.log("Operación cancelada");
      return;
    }
  }
  
  await crearAdmin();
}

// Ejecutar el script
main();

// También puedes ejecutar estas funciones individualmente:
// - crearAdmin() - Para crear un nuevo administrador
// - verificarAdmin() - Para verificar administradores existentes 