<template>
  <section class="receta-medica">
    <div class="card">
      <h2>💊 Receta Médica</h2>
      <div v-if="medicamentosIndicados && medicamentosIndicados.length">
        <ul class="lista-receta">
          <li v-for="med in medicamentosIndicados" :key="med.id" class="receta-item-flex">
            <div class="receta-info-flex">
              <strong>{{ med.nombre }}</strong>
              <span v-if="med.dosisRecomendada"> - {{ med.dosisRecomendada }} mg</span>
              <span v-if="med.frecuencia"> - {{ med.frecuencia }}</span>
              <span v-if="med.instrucciones"> - {{ med.instrucciones }}</span>
              <span v-if="med.fechaAsignacion"> ({{ formatearFecha(med.fechaAsignacion) }})</span>
            </div>
            <button @click="$emit('descargar-receta', med)" class="btn-descargar-receta-individual">
              <span class="icono-descarga">📄</span>
            </button>
          </li>
        </ul>
      </div>
      <div v-else class="no-data">
        <p>No hay medicación vigente</p>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: "PacienteRecetaMedica",
  props: {
    medicamentosIndicados: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    formatearFecha(fechaString) {
      try {
        const fecha = new Date(fechaString);
        return fecha.toLocaleString('es-ES', {
          year: '2-digit',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        return fechaString;
      }
    }
  }
};
</script>

<style scoped>
.receta-medica {
  margin-bottom: 30px;
}

.card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
  padding: 20px;
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

.lista-receta {
  margin: 0;
  padding: 0 0 0 18px;
  list-style: disc;
}

.receta-item-flex {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.receta-info-flex {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.btn-descargar-receta-individual {
  background: #17989c;
  color: #fff;
  border: none;
  padding: 4px 7px;
  border-radius: 6px;
  font-size: 1.1em;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  box-shadow: none;
  display: flex;
  align-items: center;
  gap: 0;
  margin-left: 12px;
  margin-bottom: 0;
  min-width: 28px;
  min-height: 28px;
  justify-content: center;
}

.btn-descargar-receta-individual:hover {
  background: #1fcfcf;
  color: #fff;
}

.btn-descargar-receta-individual .icono-descarga {
  font-size: 1.2em;
  margin: 0;
}
</style> 