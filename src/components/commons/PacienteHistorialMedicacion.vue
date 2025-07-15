<template>
  <section class="historial">
    <div class="card">
      <h2>💊 Historial de Medicación</h2>
      <div v-if="historial.length > 0">
        <div v-for="(grupo, key) in historialAgrupado" :key="key" class="grupo-mes">
          <div class="grupo-header" @click="toggleGrupo(key)">
            <span style="font-weight:bold; cursor:pointer;">
              <span v-if="grupoAbierto[key]">▼</span>
              <span v-else>▶</span>
              {{ key }}
            </span>
          </div>
          <div v-show="grupoAbierto[key]">
            <table>
              <thead>
                <tr>
                  <th>Medicamento</th>
                  <th>Dosis</th>
                  <th>Fecha y hora</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in grupoPaginado(key)" :key="idx">
                  <td>{{ item.medicamento }}</td>
                  <td>{{ item.dosis }} mg</td>
                  <td>{{ formatearFecha(item.fechaHora) }}</td>
                </tr>
              </tbody>
            </table>
            <div class="paginacion">
              <button @click="cambiarPagina(key, -1)" :disabled="paginas[key] === 1">Anterior</button>
              <span>Página {{ paginas[key] }} de {{ totalPaginas(key) }}</span>
              <button @click="cambiarPagina(key, 1)" :disabled="paginas[key] === totalPaginas(key)">Siguiente</button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-data">
        <p>No hay medicaciones registradas</p>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: "PacienteHistorialMedicacion",
  props: {
    historial: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      grupoAbierto: {},
      paginas: {},
      porPagina: 10
    };
  },
  computed: {
    historialAgrupado() {
      // Agrupa el historial por mes/año
      const grupos = {};
      this.historial.forEach(item => {
        const fecha = new Date(item.fechaHora);
        if (isNaN(fecha)) return;
        const key = fecha.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
        if (!grupos[key]) grupos[key] = [];
        grupos[key].push(item);
      });
      // Ordenar por mes/año descendente
      return Object.fromEntries(
        Object.entries(grupos).sort((a, b) => {
          const [mesA, anioA] = a[0].split(' ');
          const [mesB, anioB] = b[0].split(' ');
          const fechaA = new Date(`${anioA}-${this.mesANumero(mesA)}-01`);
          const fechaB = new Date(`${anioB}-${this.mesANumero(mesB)}-01`);
          return fechaB - fechaA;
        })
      );
    }
  },
  mounted() {
    // Abrir el grupo del mes actual por defecto
    this.$nextTick(() => {
      const hoy = new Date();
      const key = hoy.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
      this.$set(this.grupoAbierto, key, true);
    });
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
    mesANumero(mes) {
      const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
      return (meses.indexOf(mes.toLowerCase()) + 1).toString().padStart(2, '0');
    },
    toggleGrupo(key) {
      this.$set(this.grupoAbierto, key, !this.grupoAbierto[key]);
      if (!this.paginas[key]) this.$set(this.paginas, key, 1);
    },
    grupoPaginado(key) {
      const grupo = this.historialAgrupado[key] || [];
      const pagina = this.paginas[key] || 1;
      const inicio = (pagina - 1) * this.porPagina;
      return grupo.slice(inicio, inicio + this.porPagina);
    },
    totalPaginas(key) {
      const grupo = this.historialAgrupado[key] || [];
      return Math.ceil(grupo.length / this.porPagina) || 1;
    },
    cambiarPagina(key, delta) {
      const nueva = (this.paginas[key] || 1) + delta;
      if (nueva >= 1 && nueva <= this.totalPaginas(key)) {
        this.$set(this.paginas, key, nueva);
      }
    }
  }
};
</script>

<style scoped>
.historial {
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

.grupo-mes {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.grupo-header {
  background: #f8f9fa;
  padding: 12px 15px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  color: #333;
  border-bottom: 1px solid #eee;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background: #f8f9fa;
  font-weight: bold;
  color: #333;
}

.paginacion {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 15px;
  padding-bottom: 15px;
}

.paginacion button {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
}

.paginacion button:hover:not(:disabled) {
  background: #0056b3;
}

.paginacion button:disabled {
  background: #ccc;
  cursor: not-allowed;
  color: #666;
}

@media (max-width: 768px) {
  table {
    font-size: 14px;
  }
  
  th, td {
    padding: 8px;
  }
}
</style> 