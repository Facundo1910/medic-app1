<template>
  <div class="centrar-login">
    <div class="login-container">
      <h2>Iniciar Sesión</h2>
      
      <!-- Selector de rol -->
      <div class="rol-selector">
        <label>Selecciona tu rol:</label>
        <div class="rol-buttons">
          <button 
            @click="rolSeleccionado = 'enfermera'" 
            :class="{ active: rolSeleccionado === 'enfermera' }"
            class="rol-btn"
          >
            🩺 Enfermera
          </button>
          <button 
            @click="rolSeleccionado = 'paciente'" 
            :class="{ active: rolSeleccionado === 'paciente' }"
            class="rol-btn"
          >
            👤 Paciente/Familia
          </button>
          <button 
            @click="rolSeleccionado = 'admin'" 
            :class="{ active: rolSeleccionado === 'admin' }"
            class="rol-btn"
          >
            🔧 Administrador
          </button>
        </div>
      </div>

      <form @submit.prevent="login">
        <label for="usuario">Usuario</label>
        <input v-model="usuario" id="usuario" required />
  
        <label for="clave">Clave</label>
        <div class="input-contraseña">
          <input
            v-model="clave"
            :type="mostrarClave ? 'text' : 'password'"
            id="clave"
            required
          />
          <span
            @click="mostrarClave = !mostrarClave"
            :title="mostrarClave ? 'Ocultar clave' : 'Mostrar clave'"
            class="icono-ojo"
          >
            {{ mostrarClave ? '🙈' : '👁️' }}
          </span>
        </div>
  
        <button type="submit">Ingresar</button>
      </form>
      <p v-if="error" class="error">{{ error }}</p>

      <div style="margin-top: 18px;">
        <button @click="abrirModalRegistro" type="button" style="background: none; color: #1e88e5; border: none; cursor: pointer; text-decoration: underline; font-size: 15px;">
          ¿No tienes cuenta? Registrate
        </button>
      </div>
      
      <div style="margin-top: 10px; text-align: center;">
        <router-link to="/create-admin" style="color: #666; text-decoration: none; font-size: 13px;">
          🔧 Crear cuenta de administrador
        </router-link>
      </div>

      <!-- Modal de registro -->
      <div v-if="mostrarModalRegistro" class="modal-overlay">
        <div class="modal-content">
          <button class="modal-close" @click="cerrarModalRegistro">&times;</button>
          <h3 style="margin-bottom: 10px;">Registro de Usuario</h3>
          
          <!-- Selector de rol en registro -->
          <div class="rol-selector">
            <label>Registrarse como:</label>
            <div class="rol-buttons">
              <button 
                @click="rolRegistro = 'enfermera'" 
                :class="{ active: rolRegistro === 'enfermera' }"
                class="rol-btn"
              >
                🩺 Enfermera
              </button>
              <button 
                @click="rolRegistro = 'paciente'" 
                :class="{ active: rolRegistro === 'paciente' }"
                class="rol-btn"
              >
                👤 Paciente
              </button>
            </div>
          </div>

          <form @submit.prevent>
            <label for="nuevoNombre">Nombre</label>
            <input 
              v-model="nuevoNombre" 
              @input="validarNombre"
              id="nuevoNombre" 
              required 
              placeholder="Ej: JuanPerez (sin espacios)"
              :class="{ 'error-input': nombreError }"
            />
            <div v-if="nombreError" class="error-message">
              {{ nombreError }}
            </div>
            
            <label for="nuevaClave">Clave</label>
            <input v-model="nuevaClave" id="nuevaClave" type="password" required />
            <label for="nuevoAnio">Año de nacimiento</label>
            <input v-model="nuevoAnio" id="nuevoAnio" type="number" min="1900" max="2100" required />
            <label for="nuevoEmail">Email</label>
            <input v-model="nuevoEmail" id="nuevoEmail" type="email" required />
            <button type="button" style="margin-top: 10px;" @click="registrarUsuario">Registrarse</button>
          </form>
          
          <!-- Botón para verificar estado de validación (solo para enfermeras) -->
          <div v-if="validacionRequestId && rolRegistro === 'enfermera'" style="margin-top: 15px; text-align: center;">
            <button 
              @click="verificarEstadoValidacion" 
              :disabled="verificandoValidacion"
              style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;"
            >
              {{ verificandoValidacion ? 'Verificando...' : 'Verificar Estado de Validación' }}
            </button>
          </div>
          
          <p v-if="registroError" class="error">{{ registroError }}</p>
          <p v-if="registroExito" style="color: green; margin-top: 8px;">{{ registroExito }}</p>
          
          <!-- Botón para cerrar modal después del registro exitoso -->
          <div v-if="registroExito" style="margin-top: 15px; text-align: center;">
            <button 
              @click="cerrarModalRegistro"
              style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script>
import { db } from "@/firebase";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { sendNurseValidationRequest, checkNurseValidationStatus, isEmailJSConfigured } from "@/services/nurseValidationService";
  
export default {
  name: "LoginPaciente",
  data() {
    return {
      usuario: "",
      clave: "",
      mostrarClave: false,
      error: "",
      rolSeleccionado: "paciente", // Por defecto paciente
      rolRegistro: "paciente", // Para el registro
      mostrarModalRegistro: false,
      nuevoNombre: "",
      nuevaClave: "",
      nuevoAnio: "",
      nuevoEmail: "",
      registroError: "",
      registroExito: "",
      validacionRequestId: null,
      verificandoValidacion: false,
      nombreError: "" // Nuevo campo para el error de nombre
    };
  },
  methods: {
    abrirModalRegistro() {
      this.mostrarModalRegistro = true;
      this.registroError = "";
      this.registroExito = "";
      this.nuevoNombre = "";
      this.nuevaClave = "";
      this.nuevoAnio = "";
      this.nuevoEmail = "";
      this.rolRegistro = "paciente";
      this.nombreError = ""; // Limpiar error de nombre al abrir modal
    },
    cerrarModalRegistro() {
      this.mostrarModalRegistro = false;
      this.registroError = "";
      this.registroExito = "";
      this.validacionRequestId = null;
      this.verificandoValidacion = false;
      this.nombreError = "";
    },
    async login() {
      this.error = "";
      try {
        // Primero verificar si es un administrador
        const qAdmin = query(
          collection(db, "admins"),
          where("nombre", "==", this.usuario),
          where("clave", "==", this.clave)
        );
        const adminSnapshot = await getDocs(qAdmin);
        
        if (!adminSnapshot.empty) {
          // Es un administrador
          const admin = adminSnapshot.docs[0].data();
          admin.rol = 'admin';
          admin.id = adminSnapshot.docs[0].id;
          
          localStorage.setItem('usuario', JSON.stringify(admin));
          this.$router.push("/admin");
          return;
        }
        
        // Si no es admin, verificar según el rol seleccionado
        const coleccion = this.rolSeleccionado === 'enfermera' ? 'enfermeras' : 'pacientes';
        
        const q = query(
          collection(db, coleccion),
          where("nombre", "==", this.usuario),
          where("clave", "==", this.clave)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const usuario = querySnapshot.docs[0].data();
          // Agregar el rol al objeto del usuario
          usuario.rol = this.rolSeleccionado;
          usuario.id = querySnapshot.docs[0].id;
          
          // Para enfermeras, verificar que estén aprobadas
          if (this.rolSeleccionado === 'enfermera') {
            if (!usuario.aprobadoPor) {
              this.error = "Tu cuenta de enfermera aún no ha sido aprobada. Te notificaremos por email cuando sea aprobada.";
              return;
            }
          }
          
          localStorage.setItem('usuario', JSON.stringify(usuario));
          
          // Redirigir según el rol
          if (this.rolSeleccionado === 'enfermera') {
            this.$router.push("/enfermera");
          } else {
            this.$router.push("/paciente");
          }
        } else {
          this.error = "Usuario o clave incorrectos";
        }
      } catch (e) {
        this.error = "Error al conectar con la base de datos";
      }
    },
    async registrarUsuario() {
      try {
        console.log('🚀 INICIO: registrarUsuario ejecutado');
        alert('registrarUsuario ejecutado');
        console.log('🔍 Método registrarUsuario ejecutado');
        console.log('📝 Datos del formulario:', {
          nombre: this.nuevoNombre,
          clave: this.nuevaClave,
          anio: this.nuevoAnio,
          email: this.nuevoEmail,
          rol: this.rolRegistro
        });
      
        this.registroError = "";
        this.registroExito = "";
        this.nombreError = ""; // Limpiar error de nombre al intentar registrar
        
        // Validar que la clave sea segura
        console.log('🔍 Validando clave...');
        if (!this.esClaveSegura(this.nuevaClave)) {
          console.log('❌ Clave no válida');
          this.registroError = "La clave debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.";
          return;
        }
        console.log('✅ Clave válida');
        
        // Validar que el email sea válido
        console.log('🔍 Validando email...');
        if (!this.esEmailValido(this.nuevoEmail)) {
          console.log('❌ Email no válido');
          this.registroError = "El email ingresado no es válido.";
          return;
        }
        console.log('✅ Email válido');

        // Validar nombre
        console.log('🔍 Validando nombre...');
        if (!this.validarNombre()) {
          console.log('❌ Nombre no válido');
          this.registroError = '❌ Por favor, corrige los errores en el formulario.';
          return;
        }
        console.log('✅ Nombre válido');
        
        // Determinar la colección según el rol
        const coleccion = this.rolRegistro === 'enfermera' ? 'enfermeras' : 'pacientes';
        
        // Validar que no exista ya un usuario con ese nombre en la colección correspondiente
        const q = query(
          collection(db, coleccion),
          where("nombre", "==", this.nuevoNombre)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          this.registroError = `Ya existe un ${this.rolRegistro} con ese nombre.`;
          return;
        }
        
        // Si es enfermera, usar el sistema de validación
        if (this.rolRegistro === 'enfermera') {
          if (!isEmailJSConfigured()) {
            this.registroError = "El sistema de validación no está configurado. Contacta al administrador.";
            return;
          }
          
          const nurseData = {
            nombre: this.nuevoNombre,
            clave: this.nuevaClave,
            anioNacimiento: this.nuevoAnio,
            email: this.nuevoEmail,
            rol: this.rolRegistro
          };
          
          const result = await sendNurseValidationRequest(nurseData);
          
          if (result.success) {
            this.registroExito = result.message;
            this.validacionRequestId = result.requestId;
            this.nuevoNombre = "";
            this.nuevaClave = "";
            this.nuevoAnio = "";
            this.nuevoEmail = "";
            
            // Cerrar modal después de 3 segundos
            setTimeout(() => {
              this.cerrarModalRegistro();
            }, 3000);
          } else {
            this.registroError = result.message;
          }
        } else {
          // Para pacientes, registro directo
          await addDoc(collection(db, coleccion), {
            nombre: this.nuevoNombre,
            clave: this.nuevaClave,
            anioNacimiento: this.nuevoAnio,
            email: this.nuevoEmail,
            rol: this.rolRegistro
          });
          
          this.registroExito = "¡Registro exitoso! Ya puedes iniciar sesión.";
          this.nuevoNombre = "";
          this.nuevaClave = "";
          this.nuevoAnio = "";
          this.nuevoEmail = "";
          
          // Cerrar modal después de 2 segundos para pacientes
          setTimeout(() => {
            this.cerrarModalRegistro();
          }, 2000);
        }
      } catch (e) {
        console.log('❌ Error en el registro:', e);
        this.registroError = "Error al registrar usuario.";
      }
      console.log('🏁 Fin del método registrarUsuario');
    },
    esClaveSegura(clave) {
      // Al menos una minúscula, una mayúscula, un número y un carácter especial, mínimo 8 caracteres
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
      return regex.test(clave);
    },
    esEmailValido(email) {
      // Validación básica de email
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    },
    validarNombre() {
      const nombre = this.nuevoNombre;
      
      // Limpiar espacios al inicio y final
      this.nuevoNombre = nombre.trim();
      
      // Si está vacío, no mostrar error
      if (nombre.length === 0) {
        this.nombreError = '';
        return false;
      }
      
      // Verificar si contiene espacios
      if (nombre.includes(' ')) {
        this.nombreError = '❌ El nombre no puede contener espacios. Usa solo letras, números y guiones.';
        return false;
      }
      
      // Verificar longitud mínima
      if (nombre.length < 3) {
        this.nombreError = '❌ El nombre debe tener al menos 3 caracteres.';
        return false;
      }
      
      // Verificar caracteres válidos (solo letras, números, guiones y guiones bajos)
      const regex = /^[a-zA-Z0-9_-]+$/;
      if (!regex.test(nombre)) {
        this.nombreError = '❌ Solo se permiten letras, números, guiones (-) y guiones bajos (_).';
        return false;
      }
      
      // Si pasa todas las validaciones, limpiar error
      this.nombreError = '';
      return true;
    },
    
    async verificarEstadoValidacion() {
      if (!this.validacionRequestId) return;
      
      this.verificandoValidacion = true;
      try {
        const result = await checkNurseValidationStatus(this.validacionRequestId);
        
        if (result.success) {
          if (result.estado === 'aprobado') {
            this.registroExito = "¡Tu cuenta ha sido aprobada! Ya puedes iniciar sesión.";
            this.validacionRequestId = null;
          } else if (result.estado === 'rechazado') {
            this.registroError = `Tu solicitud fue rechazada: ${result.mensaje}`;
            this.validacionRequestId = null;
          } else {
            this.registroExito = "Tu solicitud está siendo revisada. Te notificaremos cuando sea aprobada.";
          }
        } else {
          this.registroError = result.message;
        }
      } catch (error) {
        this.registroError = "Error al verificar el estado de validación";
      } finally {
        this.verificandoValidacion = false;
      }
    }
  }
};
</script>
  
<style scoped>
.login-container {
  max-width: 400px;
  width: 100%;
  padding: 24px;
  background: rgba(255,255,255,0.98);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
  text-align: center;
}
form {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
}
.rol-selector {
  margin-bottom: 22px;
}
.rol-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 18px;
}
.rol-btn {
  width: 100%;
  min-width: 0;
  margin-bottom: 0;
}
label {
  margin-bottom: 6px;
  margin-top: 8px;
  text-align: left;
}
input {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  margin-bottom: 18px;
  margin-top: 0;
}
.input-contraseña {
  margin-bottom: 18px;
}
button[type="submit"],
button[type="button"] {
  width: 100%;
  margin-bottom: 18px;
  margin-top: 0;
}
.error,
.error-message {
  margin-bottom: 14px;
}
h2 {
  color: #111;
  font-size: 2.1rem;
  font-weight: bold;
  margin-bottom: 18px;
  letter-spacing: 0.5px;
}
.rol-selector label,
label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #181818;
  font-size: 1.08rem;
  letter-spacing: 0.2px;
}
.rol-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}
.rol-btn {
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 15px;
  color: #181818;
  font-weight: 600;
}
.rol-btn:hover {
  border-color: #1e88e5;
  background: #f5f9ff;
}
.rol-btn.active {
  border-color: #1e88e5;
  background: #1e88e5;
  color: white;
}
label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}
input {
  width: 100%;
  padding: 10px;
  margin-bottom: 16px;
  border-radius: 4px;
  border: 1.5px solid #888;
  background: #fff;
  color: #181818;
  font-size: 1.08rem;
  font-weight: 500;
}
input::placeholder {
  color: #444;
  opacity: 1;
}
input:focus {
  border-color: #1e88e5;
  outline: none;
  background: #f5f9ff;
}
.input-contraseña {
  display: flex;
  align-items: center;
  position: relative;
}
.input-contraseña input {
  flex: 1;
  padding-right: 36px;
  margin-bottom: 16px;
}
.icono-ojo {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  font-size: 18px;
  color: #888;
  user-select: none;
}
button {
  width: 100%;
  padding: 11px;
  background: #1e88e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 17px;
  font-weight: bold;
  letter-spacing: 0.5px;
}
.error {
  color: #c00;
  margin-top: 10px;
  font-weight: bold;
  font-size: 1.05rem;
}
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: #fff;
  padding: 28px 22px 18px 22px;
  border-radius: 10px;
  min-width: 320px;
  max-width: 95vw;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
  position: relative;
  text-align: left;
}
.modal-close {
  position: absolute;
  top: 8px;
  right: 0;
  margin-right: -142px;
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: #e53935;
  font-weight: bold;
  transition: color 0.2s;
  z-index: 10;
}
.modal-close:hover {
  color: #b71c1c;
}
.centrar-login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  /* No background aquí, solo centrado */
}
.error-input {
  border-color: #dc3545 !important;
  background-color: #fff5f5;
  color: #c00;
}
.error-message {
  color: #dc3545;
  font-size: 14px;
  margin-top: 5px;
  font-weight: 600;
  margin-bottom: 10px;
}
</style>