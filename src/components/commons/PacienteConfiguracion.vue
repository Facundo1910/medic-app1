<template>
  <section class="configuracion">
    <div class="card">
      <h2>⚙️ Configuración de Mi Cuenta</h2>
      
      <!-- Formulario de edición de datos personales -->
      <div class="configuracion-datos">
        <h3>📝 Editar Datos Personales</h3>
        <form @submit.prevent="emitirGuardar" class="form-datos-personales">
          <div class="form-row">
            <label>Nombre:</label>
            <input 
              v-model="datosLocales.nombre" 
              type="text" 
              required 
              placeholder="Tu nombre"
            />
          </div>
          
          <div class="form-row">
            <label>Apellido:</label>
            <input 
              v-model="datosLocales.apellido" 
              type="text" 
              required 
              placeholder="Tu apellido"
            />
          </div>
          
          <div class="form-row">
            <label>Email:</label>
            <input 
              v-model="datosLocales.email" 
              type="email" 
              required 
              placeholder="tu@email.com"
            />
          </div>
          
          <div class="form-row">
            <label>DNI:</label>
            <div class="dni-container">
              <input 
                :value="paciente.dni" 
                type="text" 
                disabled 
                class="dni-disabled"
                placeholder="DNI actual"
              />
              <button 
                type="button" 
                @click="emitirSolicitarCambioDNI" 
                class="btn-solicitar-dni"
              >
                📝 Solicitar cambio
              </button>
            </div>
          </div>
          
          <div class="form-row">
            <label>Fecha de nacimiento:</label>
            <input 
              v-model="datosLocales.fechaNacimiento" 
              type="date" 
              placeholder="Fecha de nacimiento"
            />
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-guardar-datos">
              💾 Guardar Cambios
            </button>
            <button type="button" @click="emitirCancelar" class="btn-cancelar">
              ❌ Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: "PacienteConfiguracion",
  props: {
    paciente: {
      type: Object,
      required: true
    },
    datosEditables: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      datosLocales: { ...this.datosEditables }
    };
  },
  watch: {
    datosEditables: {
      handler(nuevos) {
        this.datosLocales = { ...nuevos };
      },
      deep: true
    }
  },
  methods: {
    emitirGuardar() {
      this.$emit('guardar-datos', { ...this.datosLocales });
    },
    emitirCancelar() {
      this.$emit('cancelar-edicion');
    },
    emitirSolicitarCambioDNI() {
      this.$emit('solicitar-cambio-dni');
    }
  }
};
</script>

<style scoped>
.configuracion {
  margin-bottom: 30px;
}

.card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.configuracion-datos {
  margin-top: 20px;
}

.configuracion-datos h3 {
  color: #333;
  margin-bottom: 20px;
  font-size: 18px;
}

.form-datos-personales {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-row label {
  font-weight: bold;
  color: #333;
  font-size: 14px;
}

.form-row input,
.form-row textarea {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-row input:focus,
.form-row textarea:focus {
  outline: none;
  border-color: #007bff;
}

.dni-container {
  display: flex;
  gap: 10px;
  align-items: center;
}

.dni-disabled {
  background: #f5f5f5;
  color: #666;
  cursor: not-allowed;
  flex: 1;
}

.btn-solicitar-dni {
  background: #ff9800;
  color: white;
  border: none;
  padding: 12px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.3s;
  white-space: nowrap;
}

.btn-solicitar-dni:hover {
  background: #f57c00;
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.btn-guardar-datos {
  background: #28a745;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.3s;
}

.btn-guardar-datos:hover {
  background: #218838;
}

.btn-cancelar {
  background: #6c757d;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.3s;
}

.btn-cancelar:hover {
  background: #5a6268;
}

h2 {
  color: #333;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

@media (max-width: 768px) {
  .dni-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style> 