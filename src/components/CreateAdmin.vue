<template>
  <div class="create-admin">
    <div class="admin-form-container">
      <!-- Botón para volver al login en la esquina superior izquierda -->
      <button
        type="button"
        class="btn-volver-login"
        @click="volverLogin"
      >
        ← Volver al Login
      </button>
      <h2 class="titulo-admin">🔧 Crear Cuenta de Administrador</h2>
      
      <div v-if="adminExists" class="warning">
        <p>⚠️ Ya existe al menos un administrador en el sistema.</p>
        <p>¿Deseas crear otro administrador?</p>
      </div>
      
      <form @submit.prevent="crearAdmin" class="admin-form">
        <div class="form-row">
          <div class="form-group">
            <label for="adminNombre">Nombre:</label>
            <input 
              v-model="adminData.nombre" 
              @input="validarNombre"
              id="adminNombre" 
              type="text" 
              required 
              placeholder="Ej: Juan"
              :class="{ 'error-input': nombreError }"
            />
            <div v-if="nombreError" class="error-message">
              {{ nombreError }}
            </div>
          </div>
          
          <div class="form-group">
            <label for="adminApellido">Apellido:</label>
            <input 
              v-model="adminData.apellido" 
              @input="validarApellido"
              id="adminApellido" 
              type="text" 
              required 
              placeholder="Ej: Pérez"
              :class="{ 'error-input': apellidoError }"
            />
            <div v-if="apellidoError" class="error-message">
              {{ apellidoError }}
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="adminDNI">DNI:</label>
          <input 
            v-model="adminData.dni" 
            @input="validarDNI"
            id="adminDNI" 
            type="text" 
            required 
            placeholder="Ej: 12345678"
            maxlength="8"
            :class="{ 'error-input': dniError }"
          />
          <div v-if="dniError" class="error-message">
            {{ dniError }}
          </div>
        </div>
        
        <div class="form-group">
          <label for="adminEmail">Email:</label>
          <input 
            v-model="adminData.email" 
            @input="validarEmail"
            id="adminEmail" 
            type="email" 
            required 
            placeholder="admin@ejemplo.com"
            :class="{ 'error-input': emailError }"
          />
          <div v-if="emailError" class="error-message">
            {{ emailError }}
          </div>
        </div>
        
        <div class="form-group">
          <label for="adminTelefono">Teléfono: <span class="optional">(opcional)</span></label>
          <input 
            v-model="adminData.telefono" 
            @input="validarTelefono"
            id="adminTelefono" 
            type="tel" 
            placeholder="Ej: 11-1234-5678"
            :class="{ 'error-input': telefonoError }"
          />
          <div v-if="telefonoError" class="error-message">
            {{ telefonoError }}
          </div>
        </div>
        
        <div class="form-group">
          <label for="adminClave">Clave:</label>
          <input 
            v-model="adminData.clave" 
            @input="validarClave"
            id="adminClave" 
            type="password" 
            required 
            placeholder="Clave segura"
            :class="{ 'error-input': claveError }"
          />
          <div v-if="claveError" class="error-message">
            {{ claveError }}
          </div>
        </div>
        
        <div class="form-group">
          <label for="adminConfirmarClave">Confirmar Clave:</label>
          <input 
            v-model="adminData.confirmarClave" 
            @input="validarConfirmarClave"
            id="adminConfirmarClave" 
            type="password" 
            required 
            placeholder="Repite la clave"
            :class="{ 'error-input': confirmarClaveError }"
          />
          <div v-if="confirmarClaveError" class="error-message">
            {{ confirmarClaveError }}
          </div>
        </div>
        
        <!-- Debug: Mostrar errores activos -->
        <div v-if="tieneErrores" class="debug-errors">
          <strong>Errores activos:</strong>
          <ul>
            <li v-if="nombreError">Nombre: {{ nombreError }}</li>
            <li v-if="apellidoError">Apellido: {{ apellidoError }}</li>
            <li v-if="dniError">DNI: {{ dniError }}</li>
            <li v-if="emailError">Email: {{ emailError }}</li>
            <li v-if="telefonoError">Teléfono: {{ telefonoError }}</li>
            <li v-if="claveError">Clave: {{ claveError }}</li>
            <li v-if="confirmarClaveError">Confirmar Clave: {{ confirmarClaveError }}</li>
          </ul>
        </div>
        
        <!-- Botón estilizado sin deshabilitar -->
        <button
          type="button"
          class="btn-crear"
          @click="crearAdmin"
        >
          {{ procesando ? 'Creando...' : 'Crear Administrador' }}
        </button>
        <div v-if="tieneErrores" style="color:#dc3545; margin-top:8px;">
          Corrige los errores antes de continuar.
        </div>
      </form>
      
      <div v-if="mensaje" :class="['mensaje', mensajeTipo]">
        {{ mensaje }}
      </div>
      
      <div class="info">
        <h3>ℹ️ Información:</h3>
        <ul>
          <li>Esta cuenta te permitirá acceder al panel de administración</li>
          <li>Podrás aprobar o rechazar solicitudes de enfermeras</li>
          <li>Recibirás emails cuando las enfermeras se registren</li>
          <li>Accede a <code>/admin</code> después de crear la cuenta</li>
          <li><strong>Todos los campos marcados con * son obligatorios</strong></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { createAdminAccount, checkAdminExists } from '@/services/adminService';

export default {
  name: 'CreateAdmin',
  data() {
    return {
      adminData: {
        nombre: '',
        apellido: '',
        dni: '',
        email: 'facubas39@gmail.com',
        telefono: '',
        clave: '',
        confirmarClave: '',
        rol: 'admin'
      },
      procesando: false,
      mensaje: '',
      mensajeTipo: 'info',
      adminExists: false,
      nombreError: '',
      apellidoError: '',
      dniError: '',
      emailError: '',
      telefonoError: '',
      claveError: '',
      confirmarClaveError: ''
    };
  },
  computed: {
    tieneErrores() {
      const errores = this.nombreError || this.apellidoError || this.dniError || 
             this.emailError || this.telefonoError || this.claveError || 
             this.confirmarClaveError;
      
      return errores;
    }
  },
  async mounted() {
    await this.verificarAdminExistente();
    // Validar campos pre-llenados
    this.$nextTick(() => {
      this.validarTodosLosCampos();
    });
  },
  methods: {
    validarNombre() {
      const nombre = this.adminData.nombre.trim();
      this.adminData.nombre = nombre;
      
      if (nombre.length === 0) {
        this.nombreError = '';
        return false;
      }
      
      if (nombre.length < 2) {
        this.nombreError = '❌ El nombre debe tener al menos 2 caracteres.';
        return false;
      }
      
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
        this.nombreError = '❌ Solo se permiten letras y espacios.';
        return false;
      }
      
      this.nombreError = '';
      return true;
    },
    
    validarApellido() {
      const apellido = this.adminData.apellido.trim();
      this.adminData.apellido = apellido;
      
      if (apellido.length === 0) {
        this.apellidoError = '';
        return false;
      }
      
      if (apellido.length < 2) {
        this.apellidoError = '❌ El apellido debe tener al menos 2 caracteres.';
        return false;
      }
      
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(apellido)) {
        this.apellidoError = '❌ Solo se permiten letras y espacios.';
        return false;
      }
      
      this.apellidoError = '';
      return true;
    },
    
    validarDNI() {
      const dni = this.adminData.dni.replace(/\D/g, '');
      this.adminData.dni = dni;
      
      if (dni.length === 0) {
        this.dniError = '';
        return false;
      }
      
      if (dni.length !== 8) {
        this.dniError = '❌ El DNI debe tener exactamente 8 dígitos.';
        return false;
      }
      
      if (!/^\d{8}$/.test(dni)) {
        this.dniError = '❌ El DNI solo puede contener números.';
        return false;
      }
      
      this.dniError = '';
      return true;
    },
    
    validarEmail() {
      const email = this.adminData.email.trim();
      this.adminData.email = email;
      
      if (email.length === 0) {
        this.emailError = '';
        return false;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        this.emailError = '❌ Ingresa un email válido.';
        return false;
      }
      
      this.emailError = '';
      return true;
    },
    
    validarTelefono() {
      // Teléfono es completamente opcional, no validar nada
      this.telefonoError = '';
      return true;
    },
    
    validarClave() {
      const clave = this.adminData.clave;
      
      if (clave.length === 0) {
        this.claveError = '';
        return false;
      }
      
      if (clave.length < 6) {
        this.claveError = '❌ La clave debe tener al menos 6 caracteres.';
        return false;
      }
      
      this.claveError = '';
      this.validarConfirmarClave(); // Revalidar confirmación
      return true;
    },
    
    validarConfirmarClave() {
      const clave = this.adminData.clave;
      const confirmarClave = this.adminData.confirmarClave;
      
      if (confirmarClave.length === 0) {
        this.confirmarClaveError = '';
        return false;
      }
      
      if (clave !== confirmarClave) {
        this.confirmarClaveError = '❌ Las claves no coinciden.';
        return false;
      }
      
      this.confirmarClaveError = '';
      return true;
    },
    
    async verificarAdminExistente() {
      const result = await checkAdminExists();
      this.adminExists = result.exists;
      
      if (this.adminExists) {
        this.mensaje = `Ya existen ${result.count} administrador(es) en el sistema.`;
        this.mensajeTipo = 'warning';
      }
    },
    
    async crearAdmin() {
      this.procesando = true;
      this.mensaje = '';
      
      try {
        
        // Validar todos los campos
        const validaciones = [
          this.validarNombre(),
          this.validarApellido(),
          this.validarDNI(),
          this.validarEmail(),
          this.validarTelefono(),
          this.validarClave(),
          this.validarConfirmarClave()
        ];
        
        if (validaciones.some(v => !v)) {
          this.mensaje = '❌ Por favor, corrige los errores en el formulario.';
          this.mensajeTipo = 'error';
          return;
        }
        
        // Preparar datos para enviar (sin confirmarClave)
        const datosParaEnviar = {
          nombre: this.adminData.nombre,
          apellido: this.adminData.apellido,
          dni: this.adminData.dni,
          email: this.adminData.email,
          telefono: this.adminData.telefono || '',
          clave: this.adminData.clave,
          rol: 'admin'
        };
        
        const result = await createAdminAccount(datosParaEnviar);
        
        if (result.success) {
          this.mensaje = `✅ ${result.message}\nID: ${result.id}`;
          this.mensajeTipo = 'success';
          
          // Limpiar formulario
          this.adminData = {
            nombre: '',
            apellido: '',
            dni: '',
            email: 'facubas39@gmail.com',
            telefono: '',
            clave: '',
            confirmarClave: '',
            rol: 'admin'
          };
          
          // Limpiar errores
          this.nombreError = '';
          this.apellidoError = '';
          this.dniError = '';
          this.emailError = '';
          this.telefonoError = '';
          this.claveError = '';
          this.confirmarClaveError = '';
          
          // Actualizar estado
          await this.verificarAdminExistente();
          
        } else {
          this.mensaje = `❌ ${result.message}`;
          this.mensajeTipo = 'error';
        }
        
      } catch (error) {
        console.error('Error al crear administrador:', error);
        this.mensaje = '❌ Error inesperado al crear la cuenta de administrador.';
        this.mensajeTipo = 'error';
      } finally {
        this.procesando = false;
      }
    },
    
    esClaveSegura(clave) {
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
      return regex.test(clave);
    },
    
    validarTodosLosCampos() {
      this.validarNombre();
      this.validarApellido();
      this.validarDNI();
      this.validarEmail();
      this.validarTelefono();
      this.validarClave();
      this.validarConfirmarClave();
    },

    volverLogin() {
      this.$router.push('/login');
    }
  }
};
</script>

<style scoped>
.create-admin {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f6f8fc;
  padding: 20px;
}

.admin-form-container {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
  position: relative;
  padding-top: 30px;
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 24px;
}

.warning {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  color: #856404;
}

.admin-form {
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
}

.form-group label::after {
  content: " *";
  color: #dc3545;
}

.form-group label .optional {
  color: #6c757d;
  font-size: 14px;
  font-weight: normal;
}

.form-group label .optional::after {
  content: "";
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #2d4fff;
}

.form-group input.error-input {
  border-color: #dc3545;
  background-color: #fff5f5;
}

.error-message {
  color: #dc3545;
  font-size: 14px;
  margin-top: 5px;
  font-weight: 500;
}

.debug-errors {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  color: #856404;
  font-size: 14px;
}

.debug-errors ul {
  margin: 10px 0 0 0;
  padding-left: 20px;
}

.debug-errors li {
  margin-bottom: 5px;
}

.btn-crear {
  width: 100%;
  padding: 12px;
  background: #2d4fff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-crear:hover:not(:disabled) {
  background: #1e3a8a;
}

.btn-crear:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Ajustar estilos para evitar superposición y quitar borde */
.btn-volver-login {
  position: absolute;
  top: 18px;
  left: 18px;
  background: #e0e7ff;
  color: #2563eb;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
  z-index: 2;
  box-shadow: none;
}
.btn-volver-login:hover {
  background: #c7d2fe;
}
.titulo-admin {
  margin-top: 40px;
  margin-bottom: 30px;
  text-align: center;
  color: #333;
  font-size: 24px;
}

.mensaje {
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-weight: bold;
  white-space: pre-line;
}

.mensaje.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.mensaje.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.mensaje.warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.mensaje.info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.info {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

.info h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
}

.info ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.info li {
  margin-bottom: 8px;
}

.info code {
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .admin-form-container {
    padding: 20px;
  }
}
</style> 