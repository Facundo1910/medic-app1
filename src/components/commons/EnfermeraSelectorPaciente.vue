<template>
  <section class="selector-paciente">
    <div class="card">
      <h2>👥 Seleccionar Paciente</h2>
      <div class="selector-container">
        <label for="paciente-select">Paciente:</label>
        <select 
          id="paciente-select"
          v-model="pacienteSeleccionado" 
          @change="$emit('cambiar-paciente', pacienteSeleccionado)"
          class="select-paciente"
        >
          <option value="">Selecciona un paciente</option>
          <option 
            v-for="paciente in listaPacientes" 
            :key="paciente.id" 
            :value="paciente.id"
          >
            {{ paciente.nombre }} {{ paciente.apellido }} ({{ paciente.dni }})
          </option>
        </select>
      </div>
      
      <div v-if="pacienteActual" class="paciente-info">
        <h3>📋 Información del Paciente Seleccionado</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>Nombre:</label>
            <span>{{ pacienteActual.nombre }} {{ pacienteActual.apellido }}</span>
          </div>
          <div class="info-item">
            <label>DNI:</label>
            <span>{{ pacienteActual.dni }}</span>
          </div>
          <div class="info-item">
            <label>Email:</label>
            <span>{{ pacienteActual.email }}</span>
          </div>
          <div class="info-item">
            <label>Edad:</label>
            <span>{{ calcularEdad(pacienteActual.fechaNacimiento) }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: "EnfermeraSelectorPaciente",
  props: {
    listaPacientes: {
      type: Array,
      default: () => []
    },
    pacienteSeleccionado: {
      type: String,
      default: ''
    },
    pacienteActual: {
      type: Object,
      default: null
    }
  },
  methods: {
    calcularEdad(fecha) {
      if (!fecha) return '-';
      const hoy = new Date();
      const nacimiento = new Date(fecha);
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const m = hoy.getMonth() - nacimiento.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
      }
      return edad;
    }
  }
};
</script>

<style scoped>
.selector-paciente {
  margin-bottom: 30px;
}

.card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.selector-container {
  margin-bottom: 20px;
}

.selector-container label {
  display: block;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.select-paciente {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  background: white;
  cursor: pointer;
}

.select-paciente:focus {
  outline: none;
  border-color: #007bff;
}

.paciente-info {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.paciente-info h3 {
  color: #333;
  margin-bottom: 15px;
  font-size: 18px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-item label {
  font-weight: bold;
  color: #666;
  font-size: 14px;
}

.info-item span {
  color: #333;
  font-size: 16px;
}

h2 {
  color: #333;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style> 