<template>
  <section class="paciente-info">
    <div class="card">
      <h2>👤 Información Personal</h2>
      <div class="info-grid">
        <div class="info-item">
          <label>Nombre:</label>
          <span>{{ paciente.nombre }}</span>
        </div>
        <div class="info-item">
          <label>Apellido:</label>
          <span>{{ paciente.apellido }}</span>
        </div>
        <div class="info-item">
          <label>DNI:</label>
          <span>{{ paciente.dni }}</span>
        </div>
        <div class="info-item">
          <label>Fecha de nacimiento:</label>
          <span>{{ paciente.fechaNacimiento ? paciente.fechaNacimiento : '-' }}</span>
        </div>
        <div class="info-item">
          <label>Edad:</label>
          <span>{{ calcularEdad(paciente.fechaNacimiento) }}</span>
        </div>
        <div class="info-item">
          <label>Email:</label>
          <span>{{ paciente.email }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: "PacienteInfo",
  props: {
    paciente: {
      type: Object,
      required: true
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
.paciente-info {
  margin-bottom: 30px;
}

.card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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