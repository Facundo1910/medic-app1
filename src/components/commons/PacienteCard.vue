<template>
  <div class="card">
    <p><strong>Nombre:</strong> {{ nombre }}</p>
    <p><strong>Diagnóstico(s):</strong>
      <span v-if="diagnosticos.length === 0">Ninguno</span>
      <span v-else class="diagnosticos-lista">{{ diagnosticos.join(', ') }}</span>
    </p>
    <button @click="$emit('guardar-diagnosticos')" class="btn-guardar-diagnosticos azul">Guardar diagnósticos</button>
    <span v-if="exito" class="exito">Diagnósticos guardados ✔️</span>
    <span v-if="error" class="error">Error al guardar</span>
  </div>
</template>

<script>
export default {
  name: "PacienteCard",
  props: {
    nombre: { type: String, required: true },
    diagnosticos: { type: Array, required: true },
    exito: { type: Boolean, default: false },
    error: { type: Boolean, default: false }
  }
};
</script>

<style scoped>
.card {
  background: rgba(255, 255, 255, 0.7);
  color: #222;
  font-weight: bold;
  text-shadow: 1px 1px 4px rgba(0,0,0,0.15);
  padding: 10px;
  border-radius: 6px;
}
.diagnosticos-lista {
  color: #111;
  font-weight: 600;
  font-size: 15px;
}
.btn-guardar-diagnosticos {
  margin-top: 10px;
  background: #43a047;
  color: white;
  border: none;
  padding: 7px 16px;
  border-radius: 18px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: background 0.2s;
}
.btn-guardar-diagnosticos:hover {
  background: #388e3c;
}
.btn-guardar-diagnosticos.azul {
  background: linear-gradient(90deg, #2d4fff 60%, #4f8cff 100%);
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 22px;
  cursor: pointer;
  font-weight: 700;
  font-size: 16px;
  transition: background 0.2s;
  box-shadow: 0 2px 8px rgba(45,79,255,0.10);
}
.btn-guardar-diagnosticos.azul:hover {
  background: linear-gradient(90deg, #1e88e5 60%, #2d4fff 100%);
}
.exito {
  color: #388e3c;
  margin-left: 10px;
  font-weight: 600;
}
.error {
  color: #d32f2f;
  margin-left: 10px;
  font-weight: 600;
}
</style> 