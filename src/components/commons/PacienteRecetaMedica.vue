<template>
  <div class="receta-medica">
    <div class="card">
      <h2>💊 Receta Médica</h2>
      <!-- Mostrar firma si existe -->
      <div v-if="firmaUrl" class="firma-digital-container">
        <img :src="firmaUrl" alt="Firma digital" class="firma-digital-img" />
        <div class="firma-label">Firma digital</div>
      </div>
      <div v-if="recetasVigentes && recetasVigentes.length">
        <ul class="lista-receta">
          <li v-for="med in recetasVigentes" :key="med.id || med.nombre" class="receta-item-flex">
            <div class="receta-info-flex">
              <strong>{{ med.nombre }}</strong>
              <span v-if="med.dosisRecomendada"> - {{ med.dosisRecomendada }} mg</span>
              <span v-if="med.frecuencia"> - {{ med.frecuencia }}</span>
              <span v-if="med.instrucciones"> - {{ med.instrucciones }}</span>
              <span v-if="med.diagnostico && med.diagnostico.length" class="diagnostico-receta">
                📋 Diagnóstico: {{ Array.isArray(med.diagnostico) ? med.diagnostico.join(', ') : med.diagnostico }}
              </span>
              <span v-if="med.fechaAsignacion"> ({{ formatearFecha(med.fechaAsignacion) }})</span>
              <span class="fecha-caducidad" v-if="med.fechaAsignacion">
                ⏰ Caduca: {{ formatearFechaCaducidad(med.fechaAsignacion) }}
              </span>
            </div>
            <button @click="$emit('descargar-receta', med)" class="btn-descargar-receta-individual">
              <span class="icono-descarga">📄</span>
            </button>
          </li>
        </ul>
      </div>
      <div v-else class="no-data">
        <p>No hay medicación vigente</p>
        <p class="info-caducidad">Las recetas caducan automáticamente después de 30 días</p>
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
  data() {
    return {
      firmaUrl: null
    };
  },
  async mounted() {
    // Buscar la firma del admin/médico que asignó la receta
    try {
      // Obtener todos los admins para buscar el que tenga firma
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/firebase');
      
      const adminsRef = collection(db, "admins");
      const querySnapshot = await getDocs(adminsRef);
      
      // Buscar el primer admin que tenga firmaId
      for (const doc of querySnapshot.docs) {
        const adminData = doc.data();
        if (adminData.firmaId) {
          const API_FIRMAS = process.env.VUE_APP_API_FIRMAS || '/api/firmas';
          const res = await fetch(`${API_FIRMAS}/${adminData.firmaId}`);
          if (res.ok) {
            const data = await res.json();
            this.firmaUrl = data.imagen;
            break; // Usar la primera firma encontrada
          }
        }
      }
    } catch (e) {
      console.error('Error al cargar firma del médico:', e);
    }
  },
  computed: {
    recetasVigentes() {
      if (!this.medicamentosIndicados || !Array.isArray(this.medicamentosIndicados)) {
        return [];
      }

      const ahora = new Date();
      const treintaDiasMs = 30 * 24 * 60 * 60 * 1000; // 30 días en milisegundos

      return this.medicamentosIndicados.filter(med => {
        if (!med.fechaAsignacion) {
          return true; // Si no tiene fecha, mantenerlo (por compatibilidad)
        }

        try {
          const fechaAsignacion = new Date(med.fechaAsignacion);
          const tiempoTranscurrido = ahora - fechaAsignacion;
          
          // Solo mostrar recetas que tengan menos de 30 días
          return tiempoTranscurrido < treintaDiasMs;
        } catch (e) {
          console.error('Error al procesar fecha de asignación:', e);
          return true; // En caso de error, mantener la receta
        }
      });
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
    },
    formatearFechaCaducidad(fechaString) {
      try {
        const fechaAsignacion = new Date(fechaString);
        const fechaCaducidad = new Date(fechaAsignacion.getTime() + (30 * 24 * 60 * 60 * 1000));
        
        return fechaCaducidad.toLocaleString('es-ES', {
          year: '2-digit',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        return 'Fecha no disponible';
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
  background: #ffffff;
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

.info-caducidad {
  font-size: 12px;
  color: #888;
  margin-top: 8px;
  font-style: normal;
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

.fecha-caducidad {
  color: #ff9800 !important;
  font-weight: 500;
  font-size: 12px !important;
  background: #fff3cd;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #ffeaa7;
}

.diagnostico-receta {
  color: #1976d2 !important;
  font-weight: 500;
  font-size: 12px !important;
  background: #e3f2fd;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #bbdefb;
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

.firma-digital-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-bottom: 10px;
}
.firma-digital-img {
  max-width: 180px;
  max-height: 60px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
}
.firma-label {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
  text-align: right;
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