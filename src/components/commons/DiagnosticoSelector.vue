<template>
  <div>
    <label>Diagnóstico(s)</label>
    <div style="position: relative;">
      <input
        v-model="diagnosticoBusqueda"
        @input="buscarDiagnosticos"
        autocomplete="off"
        placeholder="Buscar diagnóstico..."
        class="input-uniforme moderno"
      />
      <ul v-if="sugerenciasDiagnostico.length" class="sugerencias">
        <li v-for="(s, i) in sugerenciasDiagnostico" :key="i" @click="seleccionarDiagnostico(s)">
          {{ s }}
        </li>
      </ul>
    </div>
    <div class="chips-container">
      <span v-for="(diag, i) in diagnosticos" :key="i" class="chip">
        {{ diag }}
        <span class="chip-remove" @click="eliminarDiagnostico(i)">&times;</span>
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: "DiagnosticoSelector",
  props: {
    diagnosticos: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      diagnosticoBusqueda: "",
      sugerenciasDiagnostico: []
    };
  },
  methods: {
    async buscarDiagnosticos() {
      if (this.diagnosticoBusqueda.length < 3) {
        this.sugerenciasDiagnostico = [];
        return;
      }
      const url = `https://clinicaltables.nlm.nih.gov/api/conditions/v3/search?terms=${encodeURIComponent(this.diagnosticoBusqueda)}&maxList=10`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        this.sugerenciasDiagnostico = (data[3] || []).map(arr => arr[0]);
      } catch (e) {
        this.sugerenciasDiagnostico = [];
      }
    },
    seleccionarDiagnostico(nombre) {
      if (!this.diagnosticos.includes(nombre)) {
        const nuevos = [...this.diagnosticos, nombre];
        this.$emit('update:diagnosticos', nuevos);
      }
      this.diagnosticoBusqueda = "";
      this.sugerenciasDiagnostico = [];
    },
    eliminarDiagnostico(idx) {
      const nuevos = this.diagnosticos.slice();
      nuevos.splice(idx, 1);
      this.$emit('update:diagnosticos', nuevos);
    }
  }
};
</script>

<style scoped>
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
.chips-container {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip {
  display: inline-flex;
  align-items: center;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 16px;
  padding: 4px 10px;
  font-size: 13px;
  margin-right: 4px;
  margin-bottom: 4px;
}
.chip-remove {
  margin-left: 6px;
  cursor: pointer;
  font-weight: bold;
  color: #d32f2f;
}
.input-uniforme {
  width: 100%;
  box-sizing: border-box;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.input-uniforme.moderno {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  border: 1.8px solid #b3c6e0;
  border-radius: 18px;
  margin-top: 5px;
  font-size: 17px;
  transition: border 0.2s;
  background: #f6f8fc;
  box-shadow: 0 2px 8px rgba(45,79,255,0.07);
}
.input-uniforme.moderno:focus {
  border: 1.8px solid #2d4fff;
  outline: none;
  background: #fff;
}
</style> 