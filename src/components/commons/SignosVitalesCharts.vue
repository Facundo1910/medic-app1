<template>
  <div class="signos-vitales-charts">
    <div class="signos-header">
      <h2 v-if="titulo">{{ titulo }}</h2>
      <div class="grafico-selector">
        <button 
          v-for="opcion in opcionesGrafico" 
          :key="opcion.key"
          @click="seleccionarGrafico(opcion.key)"
          :class="['btn-grafico', { 'activo': graficoSeleccionado === opcion.key }]"
        >
          {{ opcion.icon }} {{ opcion.title }}
        </button>
      </div>
    </div>
    <div v-if="graficoSeleccionado !== 'todos' && signosVitales.length > 0" class="grafico-individual">
      <VitalChart 
        :labels="labelsSignos"
        :data="parametroSeleccionado.data(signosVitales)"
        :label="parametroSeleccionado.label"
        :color="parametroSeleccionado.color"
        :min="parametroSeleccionado.min"
        :max="parametroSeleccionado.max"
      />
    </div>
    <div v-if="graficoSeleccionado === 'todos' && signosVitales.length > 0" class="grafico-combinado">
      <VitalChartCombinado 
        :labels="labelsSignos"
        :datasets="datasetsCombinados"
      />
    </div>
    <div v-if="signosVitales.length === 0" class="no-data">
      <p>No hay registros de signos vitales</p>
    </div>
  </div>
</template>

<script>
import { Line } from 'vue-chartjs';

const VitalChart = {
  extends: Line,
  props: ['labels', 'data', 'label', 'color', 'min', 'max'],
  mounted() {
    this.renderChart({
      labels: this.labels,
      datasets: [
        {
          label: this.label,
          backgroundColor: this.color + '22',
          borderColor: this.color,
          data: this.data,
          fill: false,
          pointBackgroundColor: this.color,
          pointRadius: 4,
          lineTension: 0.1
        }
      ]
    }, {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        yAxes: [{
          ticks: {
            suggestedMin: this.min,
            suggestedMax: this.max
          }
        }]
      }
    });
  },
  watch: {
    data() {
      this.renderChart({
        labels: this.labels,
        datasets: [
          {
            label: this.label,
            backgroundColor: this.color + '22',
            borderColor: this.color,
            data: this.data,
            fill: false,
            pointBackgroundColor: this.color,
            pointRadius: 4,
            lineTension: 0.1
          }
        ]
      }, {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          yAxes: [{
            ticks: {
              suggestedMin: this.min,
              suggestedMax: this.max
            }
          }]
        }
      });
    }
  }
};

const VitalChartCombinado = {
  extends: Line,
  props: ['labels', 'datasets'],
  mounted() {
    this.renderChart({
      labels: this.labels,
      datasets: this.datasets
    }, {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: false
          }
        }]
      },
      legend: {
        display: true,
        position: 'top'
      }
    });
  },
  watch: {
    datasets: {
      handler() {
        this.renderChart({
          labels: this.labels,
          datasets: this.datasets
        }, {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            yAxes: [{
              ticks: {
                beginAtZero: false
              }
            }]
          },
          legend: {
            display: true,
            position: 'top'
          }
        });
      },
      deep: true
    }
  }
};

export default {
  name: 'SignosVitalesCharts',
  components: { VitalChart, VitalChartCombinado },
  props: {
    signosVitales: {
      type: Array,
      required: true
    },
    titulo: {
      type: String,
      default: 'Signos Vitales'
    }
  },
  data() {
    return {
      graficoSeleccionado: 'todos',
      parametroSeleccionado: null,
      vitalParams: [
        {
          key: 'temperatura',
          title: 'Evolución de Temperatura',
          label: 'Temperatura (°C)',
          color: '#2196f3',
          min: 34, max: 41,
          icon: '🌡️',
          data: (arr) => arr.map(s => s.temperatura)
        },
        {
          key: 'frecuenciaCardiaca',
          title: 'Evolución de Frecuencia Cardíaca',
          label: 'Frecuencia cardíaca (lpm)',
          color: '#e53935',
          min: 40, max: 180,
          icon: '❤️',
          data: (arr) => arr.map(s => s.frecuenciaCardiaca)
        },
        {
          key: 'frecuenciaRespiratoria',
          title: 'Evolución de Frecuencia Respiratoria',
          label: 'Frecuencia respiratoria (resps/min)',
          color: '#43a047',
          min: 5, max: 40,
          icon: '🫁',
          data: (arr) => arr.map(s => s.frecuenciaRespiratoria)
        },
        {
          key: 'saturacionOxigeno',
          title: 'Evolución de Saturación de Oxígeno',
          label: 'Saturación de oxígeno (%)',
          color: '#00bcd4',
          min: 70, max: 100,
          icon: '🩸',
          data: (arr) => arr.map(s => s.saturacionOxigeno)
        },
        {
          key: 'glucemia',
          title: 'Evolución de Glucemia',
          label: 'Glucemia (mg/dL)',
          color: '#ff9800',
          min: 40, max: 300,
          icon: '🧃',
          data: (arr) => arr.map(s => s.glucemia)
        }
      ]
    };
  },
  computed: {
    labelsSignos() {
      return this.signosVitales.map(s => this.formatearFecha(s.fechaHora));
    },
    opcionesGrafico() {
      return [
        { key: 'todos', title: 'Todos', icon: '📊' },
        ...this.vitalParams.map(param => ({
          key: param.key,
          title: `${param.icon} ${param.title}`,
          icon: param.icon
        }))
      ];
    },
    datasetsCombinados() {
      if (this.graficoSeleccionado === 'todos') {
        return this.vitalParams.map(param => ({
          label: param.title,
          backgroundColor: param.color + '22',
          borderColor: param.color,
          data: param.data(this.signosVitales),
          fill: false,
          pointBackgroundColor: param.color,
          pointRadius: 4,
          lineTension: 0.1
        }));
      } else {
        const param = this.vitalParams.find(p => p.key === this.graficoSeleccionado);
        if (param) {
          return [
            {
              label: param.title,
              backgroundColor: param.color + '22',
              borderColor: param.color,
              data: param.data(this.signosVitales),
              fill: false,
              pointBackgroundColor: param.color,
              pointRadius: 4,
              lineTension: 0.1
            }
          ];
        }
        return [];
      }
    }
  },
  watch: {
    signosVitales() {
      // Resetear selección si cambian los datos
      this.graficoSeleccionado = 'todos';
      this.parametroSeleccionado = this.vitalParams[0];
    }
  },
  mounted() {
    this.parametroSeleccionado = this.vitalParams[0];
  },
  methods: {
    seleccionarGrafico(key) {
      this.graficoSeleccionado = key;
      if (key !== 'todos') {
        this.parametroSeleccionado = this.vitalParams.find(p => p.key === key);
      } else {
        this.parametroSeleccionado = null;
      }
    },
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
.signos-vitales-charts {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0;
  background: none;
  border-radius: 0;
  box-shadow: none;
  transition: none;
}
.signos-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
  text-align: center;
}
.signos-header h2 {
  font-size: 1.7rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0;
  letter-spacing: 0.2px;
  text-shadow: none;
}
.grafico-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}
.btn-grafico {
  background: #f8f9fa;
  color: #007bff;
  border: 1.5px solid #e0e7ef;
  padding: 7px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1em;
  transition: background 0.2s, color 0.2s, border 0.2s;
  outline: none;
  display: flex;
  align-items: center;
  gap: 5px;
}
.btn-grafico:hover:not(.activo) {
  background: #e3f0fc;
  color: #0056b3;
  border-color: #b6d4fa;
}
.btn-grafico.activo {
  background: #007bff;
  color: #fff;
  border-color: #007bff;
}
.grafico-individual,
.grafico-combinado {
  width: 100%;
  height: 380px;
  padding-left: 24px;
  padding-bottom: 32px;
  margin-bottom: 0;
  background: transparent;
}
.grafico-individual canvas,
.grafico-combinado canvas {
  border-radius: 0 0 8px 8px;
  box-shadow: none;
}
.no-data {
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
}
/* Mejorar leyenda de Chart.js */
::v-deep .chartjs-render-monitor + .chartjs-legend {
  margin-top: 18px !important;
  text-align: center;
}
::v-deep .chartjs-legend li span {
  border-radius: 4px !important;
  margin-right: 6px !important;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
@media (max-width: 900px) {
  .grafico-individual,
  .grafico-combinado {
    height: 300px;
    padding-left: 4px;
    padding-bottom: 18px;
  }
}
</style> 