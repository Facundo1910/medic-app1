<template>
  <section class="diagnosticos">
    <div class="card">
      <h2>🏥 Diagnósticos</h2>
      <div v-if="diagnosticos.length > 0" class="diagnosticos-list">
        <div v-for="(diagnostico, index) in diagnosticos" :key="index" class="diagnostico-item">
          <span class="diagnostico-text">{{ diagnostico }}</span>
        </div>
      </div>
      <div v-else class="no-data">
        <p>No hay diagnósticos registrados</p>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: "PacienteDiagnosticos",
  props: {
    diagnosticos: {
      type: Array,
      default: () => []
    }
  }
};
</script>

<style scoped>
.diagnosticos {
  margin-bottom: 30px;
}

.card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.diagnosticos-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.diagnostico-item {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #007bff;
}

.diagnostico-text {
  color: #333;
  font-weight: 500;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
}

h2 {
  color: #333;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}
</style> 