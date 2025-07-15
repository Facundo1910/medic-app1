<template>
  <div v-if="mostrar" class="modal-dni-overlay" @click="$emit('cerrar')">
    <div class="modal-dni" @click.stop>
      <div class="modal-dni-header">
        <h3>📝 Solicitar Cambio de DNI</h3>
        <button @click="$emit('cerrar')" class="btn-cerrar-modal">✕</button>
      </div>
      
      <div class="modal-dni-content">
        <p>Para cambiar tu DNI, debes solicitar autorización al administrador.</p>
        
        <form @submit.prevent="$emit('enviar-solicitud', solicitudDNI)" class="form-solicitud-dni">
          <div class="form-row">
            <label>DNI Actual:</label>
            <input :value="dniActual" type="text" disabled class="dni-actual" />
          </div>
          
          <div class="form-row">
            <label>Nuevo DNI:</label>
            <input 
              v-model="solicitudDNI.nuevoDNI" 
              type="text" 
              required 
              placeholder="Ingresa el nuevo DNI"
              pattern="[0-9]{8}"
              maxlength="8"
            />
          </div>
          
          <div class="form-row">
            <label>Motivo del cambio:</label>
            <textarea 
              v-model="solicitudDNI.motivo" 
              required 
              placeholder="Explica el motivo del cambio de DNI..."
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-enviar-solicitud">
              📤 Enviar Solicitud
            </button>
            <button type="button" @click="$emit('cerrar')" class="btn-cancelar">
              ❌ Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ModalCambioDNI",
  props: {
    mostrar: {
      type: Boolean,
      default: false
    },
    dniActual: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      solicitudDNI: {
        nuevoDNI: '',
        motivo: ''
      }
    };
  },
  watch: {
    mostrar(nuevoValor) {
      if (nuevoValor) {
        this.solicitudDNI = {
          nuevoDNI: '',
          motivo: ''
        };
      }
    }
  }
};
</script>

<style scoped>
.modal-dni-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.modal-dni {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-dni-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.modal-dni-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.btn-cerrar-modal {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.3s;
}

.btn-cerrar-modal:hover {
  background: #e0e0e0;
}

.modal-dni-content {
  padding: 24px;
  overflow-y: auto;
}

.modal-dni-content p {
  color: #666;
  margin-bottom: 20px;
  line-height: 1.5;
}

.form-solicitud-dni {
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

.dni-actual {
  background: #f5f5f5;
  color: #666;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.btn-enviar-solicitud {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.3s;
}

.btn-enviar-solicitud:hover {
  background: #0056b3;
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

@media (max-width: 768px) {
  .modal-dni {
    max-width: 95vw;
  }
  
  .modal-dni-content {
    padding: 20px;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style> 