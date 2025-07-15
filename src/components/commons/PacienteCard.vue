<template>
  <div class="card">
    <div class="paciente-info-grid">
      <div class="info-item">
        <label>Nombre:</label>
        <span>{{ nombre }} {{ apellido }}</span>
      </div>
      <div class="info-item">
        <label>Diagnóstico(s):</label>
        <span v-if="diagnosticos.length === 0" class="no-diagnostico">Ninguno</span>
        <span v-else class="diagnosticos-lista">{{ diagnosticos.join(', ') }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "PacienteCard",
  props: {
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    diagnosticos: { type: Array, required: true },
    exito: { type: Boolean, default: false },
    error: { type: Boolean, default: false }
  }
};
</script>

<style scoped>
.card {
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
}

.paciente-info-grid {
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

.diagnosticos-lista {
  color: #1976d2;
  font-weight: 600;
  font-size: 15px;
}

.no-diagnostico {
  color: #888;
  font-style: italic;
}
</style> 