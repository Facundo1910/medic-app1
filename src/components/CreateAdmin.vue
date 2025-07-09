<template>
  <div class="create-admin">
    <div class="admin-form-container">
      <h2>🔧 Crear Cuenta de Administrador</h2>
      
      <div v-if="adminExists" class="warning">
        <p>⚠️ Ya existe al menos un administrador en el sistema.</p>
        <p>¿Deseas crear otro administrador?</p>
      </div>
      
      <form @submit.prevent="crearAdmin" class="admin-form">
        <div class="form-group">
          <label for="adminNombre">Nombre del Administrador:</label>
          <input 
            v-model="adminData.nombre" 
            @input="validarNombre"
            id="adminNombre" 
            type="text" 
            required 
            placeholder="Ej: JuanPerez (sin espacios)"
            :class="{ 'error-input': nombreError }"
          />
          <div v-if="nombreError" class="error-message">
            {{ nombreError }}
          </div>
        </div>
        
        <div class="form-group">
          <label for="adminClave">Clave:</label>
          <input 
            v-model="adminData.clave" 
            id="adminClave" 
            type="password" 
            required 
            placeholder="Clave segura"
          />
        </div>
        
        <div class="form-group">
          <label for="adminEmail">Email:</label>
          <input 
            v-model="adminData.email" 
            id="adminEmail" 
            type="email" 
            required 
            placeholder="admin@ejemplo.com"
          />
        </div>
        
        <button 
          type="submit" 
          :disabled="procesando || nombreError"
          class="btn-crear"
        >
          {{ procesando ? 'Creando...' : 'Crear Administrador' }}
        </button>
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
          <li><strong>El nombre no puede contener espacios</strong></li>
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
        clave: '',
        email: 'facubas39@gmail.com', // Email por defecto
        rol: 'admin'
      },
      procesando: false,
      mensaje: '',
      mensajeTipo: 'info',
      adminExists: false,
      nombreError: ''
    };
  },
  async mounted() {
    await this.verificarAdminExistente();
  },
  methods: {
    validarNombre() {
      const nombre = this.adminData.nombre;
      
      // Limpiar espacios al inicio y final
      this.adminData.nombre = nombre.trim();
      
      // Verificar si contiene espacios
      if (nombre.includes(' ')) {
        this.nombreError = '❌ El nombre no puede contener espacios. Usa solo letras, números y guiones.';
        return false;
      }
      
      // Verificar si está vacío
      if (nombre.length === 0) {
        this.nombreError = '';
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
      
      this.nombreError = '';
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
        // Validar nombre
        if (!this.validarNombre()) {
          this.mensaje = '❌ Por favor, corrige los errores en el formulario.';
          this.mensajeTipo = 'error';
          return;
        }
        
        // Validar que la clave sea segura
        if (!this.esClaveSegura(this.adminData.clave)) {
          this.mensaje = 'La clave debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.';
          this.mensajeTipo = 'error';
          return;
        }
        
        const result = await createAdminAccount(this.adminData);
        
        if (result.success) {
          this.mensaje = `✅ ${result.message}\nID: ${result.id}`;
          this.mensajeTipo = 'success';
          
          // Limpiar formulario
          this.adminData.nombre = '';
          this.adminData.clave = '';
          this.adminData.email = 'facubas39@gmail.com';
          this.nombreError = '';
          
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
  max-width: 500px;
  width: 100%;
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

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
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

.mensaje {
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-weight: bold;
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
</style> 