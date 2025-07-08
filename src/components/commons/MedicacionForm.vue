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
        <li v-for="(s, i) in sugerencias" :key="i" @click="seleccionarMedicamento(s)">
          {{ s }}
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
    errorFecha: { type: String, default: "" }
  },
  data() {
    return {
      medicamentoLocal: this.medicamento,
      dosisLocal: this.dosis,
      fechaHoraLocal: this.fechaHora,
      sugerencias: []
    };
  },
  watch: {
    medicamento(val) { this.medicamentoLocal = val; },
    dosis(val) { this.dosisLocal = val; },
    fechaHora(val) { this.fechaHoraLocal = val; }
  },
  methods: {
    async buscarMedicamentos() {
      if (this.medicamentoLocal.length < 3) {
        this.sugerencias = [];
        this.$emit('update:medicamento', this.medicamentoLocal);
        return;
      }
      const query = encodeURIComponent(this.medicamentoLocal);
      const url = `https://cima.aemps.es/cima/rest/medicamentos?nombre=${query}`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        this.sugerencias = Array.from(new Set((data.resultados || []).map(m => m.nombre))).slice(0, 10);
      } catch (e) {
        this.sugerencias = [];
      }
      this.$emit('update:medicamento', this.medicamentoLocal);
    },
    seleccionarMedicamento(nombre) {
      this.medicamentoLocal = nombre;
      this.sugerencias = [];
      this.$emit('update:medicamento', nombre);
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
</style> 