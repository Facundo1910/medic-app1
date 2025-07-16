<template>
  <form @submit.prevent="registrar">
    <label>Temperatura corporal (°C)</label>
    <input
      v-model.number="temperaturaLocal"
      type="number"
      step="0.1"
      min="30"
      max="45"
      required
    />

    <label>Presión arterial (mmHg)</label>
    <input
      v-model="presionLocal"
      type="text"
      pattern="^\d{2,3}/\d{2,3}$"
      placeholder="Ej: 120/80"
      required
    />

    <label>Frecuencia cardíaca (lpm)</label>
    <input
      v-model.number="frecuenciaCardiacaLocal"
      type="number"
      min="30"
      max="200"
      required
    />

    <label>Frecuencia respiratoria (resps/min)</label>
    <input
      v-model.number="frecuenciaRespiratoriaLocal"
      type="number"
      min="5"
      max="40"
      required
    />

    <label>Saturación de oxígeno (% SpO2)</label>
    <input
      v-model.number="saturacionOxigenoLocal"
      type="number"
      min="50"
      max="100"
      required
    />

    <label>Glucemia (mg/dL, opcional)</label>
    <input
      v-model.number="glucemiaLocal"
      type="number"
      min="20"
      max="600"
    />

    <label>Fecha y hora</label>
    <input
      type="datetime-local"
      v-model="fechaHoraLocal"
      required
    />

    <button type="submit">Registrar signos vitales</button>
  </form>
</template>

<script>
export default {
  name: "SignosVitalesForm",
  props: {
    temperatura: { type: [String, Number], default: '' },
    presion: { type: String, default: '' },
    frecuenciaCardiaca: { type: [String, Number], default: '' },
    frecuenciaRespiratoria: { type: [String, Number], default: '' },
    saturacionOxigeno: { type: [String, Number], default: '' },
    glucemia: { type: [String, Number], default: '' },
    fechaHora: { type: String, default: '' }
  },
  data() {
    return {
      temperaturaLocal: this.temperatura,
      presionLocal: this.presion,
      frecuenciaCardiacaLocal: this.frecuenciaCardiaca,
      frecuenciaRespiratoriaLocal: this.frecuenciaRespiratoria,
      saturacionOxigenoLocal: this.saturacionOxigeno,
      glucemiaLocal: this.glucemia,
      fechaHoraLocal: this.fechaHora
    };
  },
  watch: {
    temperatura(val) { this.temperaturaLocal = val; },
    presion(val) { this.presionLocal = val; },
    frecuenciaCardiaca(val) { this.frecuenciaCardiacaLocal = val; },
    frecuenciaRespiratoria(val) { this.frecuenciaRespiratoriaLocal = val; },
    saturacionOxigeno(val) { this.saturacionOxigenoLocal = val; },
    glucemia(val) { this.glucemiaLocal = val; },
    fechaHora(val) { this.fechaHoraLocal = val; }
  },
  methods: {
    registrar() {
      this.$emit('registrar', {
        temperatura: this.temperaturaLocal,
        presion: this.presionLocal,
        frecuenciaCardiaca: this.frecuenciaCardiacaLocal,
        frecuenciaRespiratoria: this.frecuenciaRespiratoriaLocal,
        saturacionOxigeno: this.saturacionOxigenoLocal,
        glucemia: this.glucemiaLocal,
        fechaHora: this.fechaHoraLocal
      });
      
      // Limpiar campos locales
      this.temperaturaLocal = '';
      this.presionLocal = '';
      this.frecuenciaCardiacaLocal = '';
      this.frecuenciaRespiratoriaLocal = '';
      this.saturacionOxigenoLocal = '';
      this.glucemiaLocal = '';
      this.fechaHoraLocal = new Date().toISOString().slice(0,16);
    }
  }
};
</script>

<style scoped>
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
</style> 