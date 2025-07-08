<template>
  <div class="home-paciente">
    <div class="contenedor-central">
      <header class="header">
        <div class="logo">👤 Mi Información Médica</div>
        <div class="usuario">
          <span class="nombre-usuario">{{ paciente.nombre }}</span>
          <button @click="logout" class="btn-logout">
            Cerrar sesión
          </button>
        </div>
      </header>
  
      <!-- Información del paciente -->
      <section class="paciente-info">
        <div class="card">
          <h2>👤 Información Personal</h2>
          <div class="info-grid">
            <div class="info-item">
              <label>Nombre:</label>
              <span>{{ paciente.nombre }}</span>
            </div>
            <div class="info-item">
              <label>Año de nacimiento:</label>
              <span>{{ paciente.anioNacimiento }}</span>
            </div>
            <div class="info-item">
              <label>Email:</label>
              <span>{{ paciente.email }}</span>
            </div>
          </div>
        </div>
      </section>
  
      <!-- Diagnósticos -->
      <section class="diagnosticos">
        <div class="card">
          <h2>🏥 Diagnósticos</h2>
          <div v-if="diagnosticos.length > 0" class="diagnosticos-list">
            <div v-for="(diagnostico, index) in diagnosticos" :key="index" class="diagnostico-item">
              <span class="diagnostico-text">{{ diagnostico }}</span>
            </div>
          </div>
          <div v-else class="no-data">
            <p>No hay diagnósticos registrados</p>
          </div>
        </div>
      </section>
  
      <!-- Historial de medicación -->
      <section class="historial">
        <div class="card">
          <h2>💊 Historial de Medicación</h2>
          <div v-if="historial.length > 0">
            <table>
              <thead>
                <tr>
                  <th>Medicamento</th>
                  <th>Dosis</th>
                  <th>Fecha y hora</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in historial" :key="index">
                  <td>{{ item.medicamento }}</td>
                  <td>{{ item.dosis }} mg</td>
                  <td>{{ formatearFecha(item.fechaHora) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="no-data">
            <p>No hay medicaciones registradas</p>
          </div>
        </div>
      </section>
  
      <!-- Resumen -->
      <section class="resumen">
        <div class="card">
          <h2>📊 Resumen</h2>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number">{{ diagnosticos.length }}</div>
              <div class="stat-label">Diagnósticos</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ historial.length }}</div>
              <div class="stat-label">Medicaciones</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ medicacionesEsteMes }}</div>
              <div class="stat-label">Este mes</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
  
<script>
import { db } from "@/firebase";
import { collection, getDocs, query, where, onSnapshot } from "firebase/firestore";

export default {
  name: "HomePaciente",
  data() {
    return {
      paciente: {
        nombre: "Cargando...",
        anioNacimiento: "",
        email: ""
      },
      historial: [],
      diagnosticos: [],
      unsubscribe: null
    };
  },
  computed: {
    medicacionesEsteMes() {
      const ahora = new Date();
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      
      return this.historial.filter(item => {
        const fechaMedicacion = new Date(item.fechaHora);
        return fechaMedicacion >= inicioMes;
      }).length;
    }
  },
  async mounted() {
    try {
      // Cargar datos del paciente desde localStorage
      const usuarioData = localStorage.getItem('usuario');
      
      if (usuarioData) {
        const usuario = JSON.parse(usuarioData);
        if (usuario.rol === 'paciente') {
          this.paciente = usuario;
        } else {
          // Si no es paciente, redirigir
          this.$router.push('/');
          return;
        }
      } else {
        // Si no hay datos del usuario, redirigir al login
        this.$router.push('/');
        return;
      }

      // Buscar el documento del paciente en Firestore
      const q = query(collection(db, "pacientes"), where("nombre", "==", this.paciente.nombre));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        
        // Suscribirse a cambios en tiempo real
        this.unsubscribe = onSnapshot(docRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            
            // Actualizar diagnósticos
            if (data.diagnosticos && Array.isArray(data.diagnosticos)) {
              this.diagnosticos = data.diagnosticos;
            }
            
            // Actualizar historial de medicaciones
            if (data.medicaciones && Array.isArray(data.medicaciones)) {
              this.historial = data.medicaciones.slice().sort((a, b) => 
                (b.fechaHora || '').localeCompare(a.fechaHora || '')
              );
            }
          }
        });
      }
    } catch (e) {
      console.error("Error al cargar datos:", e);
      alert("Error al cargar los datos del paciente");
    }
  },
  beforeDestroy() {
    // Limpiar suscripción cuando el componente se destruye
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  },
  methods: {
    formatearFecha(fechaString) {
      try {
        const fecha = new Date(fechaString);
        return fecha.toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        return fechaString;
      }
    },
    
    logout() {
      localStorage.removeItem('usuario');
      this.$router.push('/');
    }
  }
};
</script>
  
<style scoped>
.home-paciente {
  min-height: 100vh;
  padding: 32px 0;
}

.contenedor-central {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
  margin-top: 32px;
}

.contenedor-central > .card,
.contenedor-central > section,
.contenedor-central > div {
  margin-top: 32px !important;
  margin-bottom: 32px !important;
  /* border: 1px dashed #007bff; */
}
.contenedor-central > :first-child {
  margin-top: 0 !important;
}
.contenedor-central > :last-child {
  margin-bottom: 0 !important;
}

.contenedor-central .card {
  margin-top: 32px !important;
  margin-bottom: 32px !important;
}
.contenedor-central .card:first-child {
  margin-top: 0 !important;
}
.contenedor-central .card:last-child {
  margin-bottom: 0 !important;
}

.card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
  padding: 20px;
  margin: 0;
  margin-top: 24px !important;
  margin-bottom: 24px !important;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  padding: 15px 25px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.logo {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.usuario {
  display: flex;
  align-items: center;
  gap: 15px;
}

.nombre-usuario {
  font-weight: bold;
  color: #333;
}

.btn-logout {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-logout:hover {
  background: #c82333;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-item label {
  font-weight: bold;
  color: #666;
  font-size: 14px;
}

.info-item span {
  color: #333;
  font-size: 16px;
}

.diagnosticos-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.diagnostico-item {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #007bff;
}

.diagnostico-text {
  color: #333;
  font-weight: 500;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e9ecef;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 5px;
}

.stat-label {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

section {
  margin-bottom: 30px;
}

h2 {
  color: #333;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  table {
    font-size: 14px;
  }
  
  th, td {
    padding: 8px;
  }
}
</style> 