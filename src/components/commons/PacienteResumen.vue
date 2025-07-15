<template>
  <section class="resumen">
    <div class="card">
      <h2>📊 Resumen</h2>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-number">{{ diagnosticos.length }}</div>
          <div class="stat-label">Diagnósticos</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ historial.length }}</div>
          <div class="stat-label">Medicaciones</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ medicacionesEsteMes }}</div>
          <div class="stat-label">Este mes</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: "PacienteResumen",
  props: {
    diagnosticos: {
      type: Array,
      default: () => []
    },
    historial: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    medicacionesEsteMes() {
      const ahora = new Date();
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      
      return this.historial.filter(item => {
        const fechaMedicacion = new Date(item.fechaHora);
        return fechaMedicacion >= inicioMes;
      }).length;
    }
  }
};
</script>

<style scoped>
.resumen {
  margin-bottom: 30px;
}

.card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e9ecef;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 5px;
}

.stat-label {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

h2 {
  color: #333;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style> 