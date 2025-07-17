<template>
  <div>
    <img src="./assets/a1e7f095-a7c5-4529-a80f-9befabda94a3.png" alt="Brionia Logo" class="logo-brionia" />
    <router-view />
    <div v-if="mostrarAviso" class="modal-inactividad">
      <div class="modal-content-inactividad">
        <h3>¿Sigues ahí?</h3>
        <div class="circle-timer">
          <svg width="90" height="90">
            <circle
              cx="45" cy="45" r="40"
              stroke="#e0e0e0" stroke-width="8" fill="none"
            />
            <circle
              cx="45" cy="45" r="40"
              :stroke="segundosRestantes > 10 ? '#007bff' : '#dc3545'"
              stroke-width="8" fill="none"
              :stroke-dasharray="circunferencia"
              :stroke-dashoffset="progresoOffset"
              stroke-linecap="round"
              style="transition: stroke-dashoffset 1s linear;"
            />
            <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="2em" fill="#333">
              {{ segundosRestantes }}
            </text>
          </svg>
        </div>
        <p>Por seguridad, tu sesión se cerrará en <b>{{ segundosRestantes }}</b> segundos por inactividad.</p>
        <button @click="cancelarCierreSesion">Seguir conectado</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      inactividadTimeout: null,
      tiempoMaximo: 5 * 60 * 1000, // 5 minutos
      mostrarAviso: false,
      avisoTimeout: null,
      segundosRestantes: 30,
      intervaloSegundos: null,
      circunferencia: 2 * Math.PI * 40 // r=40
    };
  },
  computed: {
    progresoOffset() {
      // Círculo de 30 segundos
      return this.circunferencia * (1 - this.segundosRestantes / 30);
    }
  },
  created() {
    this.$watch('$route', this.verificarRutaInactividad, { immediate: true });
  },
  beforeDestroy() {
    this.removerDeteccionInactividad();
  },
  methods: {
    verificarRutaInactividad() {
      // Rutas públicas donde NO debe haber inactividad
      const rutasPublicas = ['/', '/login-admin', '/create-admin', '/register-admin'];
      if (rutasPublicas.includes(this.$route.path)) {
        this.removerDeteccionInactividad();
      } else {
        this.iniciarDeteccionInactividad();
      }
    },
    iniciarDeteccionInactividad() {
      const eventos = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
      this._eventosInactividad = eventos;
      eventos.forEach(e => window.addEventListener(e, this.reiniciarTemporizador));
      this.reiniciarTemporizador();
    },
    removerDeteccionInactividad() {
      (this._eventosInactividad || []).forEach(e => window.removeEventListener(e, this.reiniciarTemporizador));
      clearTimeout(this.inactividadTimeout);
      clearTimeout(this.avisoTimeout);
      clearInterval(this.intervaloSegundos);
    },
    reiniciarTemporizador() {
      if (this.mostrarAviso) return; // No reiniciar si el modal está abierto
      clearTimeout(this.inactividadTimeout);
      clearTimeout(this.avisoTimeout);
      clearInterval(this.intervaloSegundos);
      this.mostrarAviso = false;
      // Mostrar aviso 30 segundos antes de cerrar sesión
      this.inactividadTimeout = setTimeout(() => {
        this.segundosRestantes = 30;
        this.mostrarAviso = true;
        (this._eventosInactividad || []).forEach(e => window.removeEventListener(e, this.reiniciarTemporizador));
        this.intervaloSegundos = setInterval(() => {
          if (this.segundosRestantes > 0) {
            this.segundosRestantes--;
          }
        }, 1000);
        this.avisoTimeout = setTimeout(() => {
          this.cerrarSesionPorInactividad();
        }, 30000); // 30 segundos para responder
      }, this.tiempoMaximo - 30000);
    },
    cancelarCierreSesion() {
      this.mostrarAviso = false;
      clearInterval(this.intervaloSegundos);
      // Volver a activar la detección de actividad
      (this._eventosInactividad || []).forEach(e => window.addEventListener(e, this.reiniciarTemporizador));
      this.reiniciarTemporizador();
    },
    cerrarSesionPorInactividad() {
      this.mostrarAviso = false;
      clearInterval(this.intervaloSegundos);
      localStorage.removeItem('usuario');
      this.$router.push('/');
    }
  }
};
</script>

<style>
/* Estilos globales de la aplicación */
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
  /* background-image: url('./assets/a1e7f095-a7c5-4529-a80f-9befabda94a3.png'); */
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  min-height: 100vh;
}

#app {
  min-height: 100vh;
}

.modal-inactividad {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.modal-content-inactividad {
  background: #fff;
  padding: 32px 24px;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.18);
  text-align: center;
  min-width: 280px;
}
.circle-timer {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 12px;
}
.modal-content-inactividad h3 {
  margin-top: 0;
  margin-bottom: 12px;
}
.modal-content-inactividad button {
  background: #007bff;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 18px;
  transition: background 0.2s;
}
.modal-content-inactividad button:hover {
  background: #0056b3;
}

.logo-brionia {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 150px;
  height: auto;
  z-index: 10000;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border-radius: 10px;
  background: #fff;
  padding: 10px;
}

@media (max-width: 600px) {
  .logo-brionia {
    display: none;
  }
}

:root {
  --color-principal: #17989c;
  --color-principal-hover: #1fcfcf;
}

button,
.modal-content-inactividad button,
input[type="submit"],
input[type="button"] {
  background: #fff !important;
  color: var(--color-principal) !important;
  border: 2px solid var(--color-principal);
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 18px;
  transition: color 0.2s, border-color 0.2s;
  font-weight: bold;
}
button:hover,
.modal-content-inactividad button:hover,
input[type="submit"]:hover,
input[type="button"]:hover {
  color: var(--color-principal-hover) !important;
  border-color: var(--color-principal-hover);
  background: #fff !important;
}
.btn-principal {
  background: var(--color-principal) !important;
  color: #fff !important;
  border: 2px solid var(--color-principal);
  font-weight: bold;
}
.btn-principal:hover {
  background: var(--color-principal-hover) !important;
  color: #fff !important;
  border-color: var(--color-principal-hover);
}
</style>
