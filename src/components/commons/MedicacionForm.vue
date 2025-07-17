<template>
  <form @submit.prevent="registrar">
    <label>Medicamento</label>
    <div style="position: relative;">
      <input
        v-model="medicamentoLocal"
        @input="buscarMedicamentos"
        autocomplete="off"
        required
      />
      <ul v-if="sugerencias.length" class="sugerencias">
        <li v-for="(s, i) in sugerencias" :key="i" @click="seleccionarMedicamento(s)" :class="{ 'medicamento-admin': s.esAdmin }">
          <div class="sugerencia-nombre">{{ s.nombre }}</div>
          <div v-if="s.esAdmin && s.dosis" class="sugerencia-info">
            Dosis: {{ s.dosis }} mg | {{ s.frecuencia }}
          </div>
          <div v-if="s.esAdmin" class="sugerencia-badge">💊 Admin</div>
        </li>
      </ul>
    </div>

    <label>Dosis (mg)</label>
    <input
      type="number"
      v-model="dosisLocal"
      required
      @input="$emit('update:dosis', dosisLocal)"
    />

    <label>Fecha y hora</label>
    <input
      type="datetime-local"
      v-model="fechaHoraLocal"
      required
      @input="onFechaInput"
    />
    <div v-if="errorFecha" class="error-fecha">{{ errorFecha }}</div>

    <button type="submit">Registrar</button>
  </form>
</template>

<script>
export default {
  name: "MedicacionForm",
  props: {
    medicamento: { type: String, required: true },
    dosis: { type: [String, Number], required: true },
    fechaHora: { type: String, required: true },
    errorFecha: { type: String, default: "" },
    medicamentosDisponibles: { type: Array, default: () => [] }
  },
  data() {
    return {
      medicamentoLocal: this.medicamento,
      dosisLocal: this.dosis,
      fechaHoraLocal: this.fechaHora || this.getFechaHoraActual(),
      sugerencias: []
    };
  },
  mounted() {
    // Si no hay fecha establecida, usar la fecha y hora actual
    if (!this.fechaHoraLocal) {
      this.fechaHoraLocal = this.getFechaHoraActual();
      this.$emit('update:fechaHora', this.fechaHoraLocal);
    }
  },
  watch: {
    medicamento(val) { this.medicamentoLocal = val; },
    dosis(val) { this.dosisLocal = val; },
    fechaHora(val) { this.fechaHoraLocal = val; }
  },
  methods: {
    getFechaHoraActual() {
      // Devuelve la fecha y hora actual en formato yyyy-MM-ddTHH:mm (para input type datetime-local)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    },
    async buscarMedicamentos() {
      if (this.medicamentoLocal.length < 3) {
        this.sugerencias = [];
        this.$emit('update:medicamento', this.medicamentoLocal);
        return;
      }

      const query = this.medicamentoLocal.toLowerCase();
      let sugerencias = [];

      // Buscar en medicamentos disponibles del administrador
      const medicamentosAdmin = this.medicamentosDisponibles.filter(m => 
        m.nombre.toLowerCase().includes(query)
      ).map(m => ({
        nombre: m.nombre,
        dosis: m.dosisRecomendada,
        frecuencia: m.frecuencia,
        instrucciones: m.instrucciones,
        esAdmin: true
      }));

      // Buscar en API externa
      try {
        const queryEncoded = encodeURIComponent(this.medicamentoLocal);
        const url = `https://cima.aemps.es/cima/rest/medicamentos?nombre=${queryEncoded}`;
        const res = await fetch(url);
        const data = await res.json();
        const medicamentosAPI = (data.resultados || []).map(m => ({
          nombre: m.nombre,
          esAdmin: false
        }));

        // Combinar resultados, priorizando medicamentos del administrador
        sugerencias = [...medicamentosAdmin, ...medicamentosAPI].slice(0, 10);
      } catch (e) {
        // Si falla la API, usar solo medicamentos del administrador
        sugerencias = medicamentosAdmin.slice(0, 10);
      }

      this.sugerencias = sugerencias;
      this.$emit('update:medicamento', this.medicamentoLocal);
    },
    seleccionarMedicamento(sugerencia) {
      this.medicamentoLocal = sugerencia.nombre;
      
      // Si es un medicamento del administrador, llenar automáticamente la dosis recomendada
      if (sugerencia.esAdmin && sugerencia.dosis) {
        this.dosisLocal = sugerencia.dosis;
        this.$emit('update:dosis', sugerencia.dosis);
      }
      
      this.sugerencias = [];
      this.$emit('update:medicamento', sugerencia.nombre);
    },
    onFechaInput() {
      this.$emit('update:fechaHora', this.fechaHoraLocal);
      this.$emit('update:errorFecha', "");
    },
    registrar() {
      // Validación de fecha (igual que en Home.vue)
      let error = "";
      if (!this.fechaHoraLocal) {
        error = "Debes ingresar la fecha y hora de suministro.";
      } else {
        const fechaSuministro = new Date(this.fechaHoraLocal);
        const ahora = new Date();
        if (fechaSuministro > ahora) {
          error = "La fecha de suministro no puede ser en el futuro.";
        } else {
          const hace30dias = new Date();
          hace30dias.setDate(ahora.getDate() - 30);
          if (fechaSuministro < hace30dias) {
            error = "La fecha de suministro no puede ser anterior a 30 días.";
          }
        }
      }
      if (error) {
        this.$emit('update:errorFecha', error);
        return;
      }
      this.$emit('update:errorFecha', "");
      this.$emit('registrar', {
        medicamento: this.medicamentoLocal,
        dosis: this.dosisLocal,
        fechaHora: this.fechaHoraLocal
      });
      // Limpiar campos locales
      this.medicamentoLocal = "";
      this.dosisLocal = "";
      this.fechaHoraLocal = "";
    }
  }
};
</script>

<style scoped>
.error-fecha {
  color: #d32f2f;
  font-size: 14px;
  margin-top: 4px;
  margin-bottom: 2px;
}
form {
  display: flex;
  flex-direction: column;
}
form label {
  margin-top: 10px;
}
form input {
  width: 100%;
  box-sizing: border-box;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
form button {
  margin-top: 22px;
  background: linear-gradient(90deg, #2d4fff 60%, #4f8cff 100%);
  color: white;
  padding: 12px 28px;
  border: none;
  border-radius: 22px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(45,79,255,0.10);
  transition: background 0.2s;
  letter-spacing: 0.5px;
}
form button:hover {
  background: linear-gradient(90deg, #1e88e5 60%, #2d4fff 100%);
}
.sugerencias {
  list-style: none;
  margin: 0;
  padding: 0;
  background: #fff;
  border: 1px solid #ccc;
  max-height: 120px;
  overflow-y: auto;
  position: absolute;
  z-index: 10;
  width: 90%;
}
.sugerencias li {
  padding: 6px 10px;
  cursor: pointer;
}
.sugerencias li:hover {
  background: #e3e3e3;
}

.sugerencias li {
  padding: 8px 10px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.sugerencias li:last-child {
  border-bottom: none;
}

.medicamento-admin {
  background: #f0f8ff !important;
  border-left: 3px solid #007bff;
}

.medicamento-admin:hover {
  background: #e3f2fd !important;
}

.sugerencia-nombre {
  font-weight: bold;
  color: #333;
}

.sugerencia-info {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.sugerencia-badge {
  font-size: 10px;
  color: #007bff;
  font-weight: bold;
  margin-top: 2px;
}
</style> 