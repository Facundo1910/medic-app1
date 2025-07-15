<template>
  <div class="receta-medica">
    <div class="card">
      <h2>💊 Receta Médica</h2>
      <div v-if="medicamentosIndicados && medicamentosIndicados.length">
        <ul class="lista-receta">
          <li v-for="med in medicamentosIndicados" :key="med.id || med.nombre" class="receta-item-flex">
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
  </div>
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
  width: 100%;
}

.card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
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
  font-size: 18px;
}

.lista-receta {
  margin: 0;
  padding: 0;
  list-style: none;
}

.receta-item-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #007bff;
}

.receta-info-flex {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  flex: 1;
  gap: 8px;
}

.receta-info-flex strong {
  color: #333;
  font-size: 16px;
}

.receta-info-flex span {
  color: #666;
  font-size: 14px;
}

.btn-descargar-receta-individual {
  background: #17989c;
  color: #fff;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  box-shadow: none;
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 40px;
  min-height: 32px;
  justify-content: center;
  white-space: nowrap;
}

.btn-descargar-receta-individual:hover {
  background: #1fcfcf;
  color: #fff;
}

.btn-descargar-receta-individual .icono-descarga {
  font-size: 16px;
  margin: 0;
}

@media (max-width: 768px) {
  .receta-item-flex {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .receta-info-flex {
    width: 100%;
  }
  
  .btn-descargar-receta-individual {
    align-self: flex-end;
  }
}
</style> 