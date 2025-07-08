<template>
  <div class="home-enfermera">
    <div class="contenedor-central">
      <header class="header">
        <div class="logo">🩺 Panel de Enfermera</div>
        <div class="usuario">
          <span class="nombre-usuario">{{ enfermera.nombre }}</span>
          <button @click="logout" class="btn-logout">
            Cerrar sesión
          </button>
        </div>
      </header>
  
      <!-- Selector de paciente -->
      <section class="paciente-selector">
        <div>
          <h2>Seleccionar Paciente</h2>
          <div class="selector-container">
            <select v-model="pacienteSeleccionado" @change="cambiarPaciente" class="paciente-select">
              <option value="">-- Selecciona un paciente --</option>
              <option v-for="paciente in listaPacientes" :key="paciente.id" :value="paciente.id">
                {{ paciente.nombre }}
              </option>
            </select>
            <button @click="cargarPacientes" class="btn-refresh">🔄</button>
          </div>
        </div>
      </section>
  
      <!-- Información del paciente seleccionado -->
      <section v-if="pacienteActual" class="paciente-info">
        <h2>Paciente: {{ pacienteActual.nombre }}</h2>
        <PacienteCard
          :nombre="pacienteActual.nombre"
          :diagnosticos="diagnosticosSeleccionados || []"
          :exito="guardadoDiagnosticoExito"
          :error="guardadoDiagnosticoError"
          @guardar-diagnosticos="guardarDiagnosticos"
        />
      </section>
  
      <!-- Formularios de edición (solo visibles si hay paciente seleccionado) -->
      <div v-if="pacienteActual">
        <section class="diagnostico-form card">
          <h2 style="margin-top:0;">Cargar nuevo diagnóstico</h2>
          <DiagnosticoSelector
            :diagnosticos="diagnosticosSeleccionados || []"
            @update:diagnosticos="diagnosticosSeleccionados = $event"
          />
        </section>
      
        <section class="medicacion-form card">
          <h2 style="margin-top:0;">Cargar nueva medicación</h2>
          <MedicacionForm
            :medicamento="nueva.medicamento"
            @update:medicamento="nueva.medicamento = $event"
            :dosis="nueva.dosis"
            @update:dosis="nueva.dosis = $event"
            :fechaHora="nueva.fechaHora"
            @update:fechaHora="nueva.fechaHora = $event"
            :errorFecha="errorFechaMedicacion"
            @update:errorFecha="errorFechaMedicacion = $event"
            @registrar="registrarMedicacion"
          />
          <div v-if="emailNotificationStatus" :class="getEmailStatusClass()">
            {{ emailNotificationStatus }}
          </div>
        </section>
      
        <section class="historial card">
          <h2>Historial de medicación</h2>
          <table>
            <thead>
              <tr>
                <th>Medicamento</th>
                <th>Dosis</th>
                <th>Fecha y hora</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in historial" :key="index">
                <td>{{ item.medicamento }}</td>
                <td>{{ item.dosis }} mg</td>
                <td>{{ item.fechaHora }}</td>
                <td>
                  <button @click="eliminarMedicacion(index)" class="btn-eliminar">
                    🗑️ Eliminar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
  
      <!-- Mensaje cuando no hay paciente seleccionado -->
      <div v-else class="no-paciente">
        <div class="card">
          <h2>👋 Bienvenida, {{ enfermera.nombre }}</h2>
          <p>Selecciona un paciente de la lista para comenzar a gestionar su información médica.</p>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script>
import { db } from "@/firebase";
import { collection, getDocs, updateDoc, arrayUnion, arrayRemove, doc } from "firebase/firestore";
import PacienteCard from "@/components/commons/PacienteCard.vue";
import DiagnosticoSelector from "@/components/commons/DiagnosticoSelector.vue";
import MedicacionForm from "@/components/commons/MedicacionForm.vue";
import { sendMedicationNotification, isEmailJSConfigured } from "@/services/emailService";

export default {
  name: "HomeEnfermera",
  components: { PacienteCard, DiagnosticoSelector, MedicacionForm },
  data() {
    return {
      enfermera: {
        nombre: "Cargando...",
      },
      pacienteSeleccionado: "",
      pacienteActual: null,
      listaPacientes: [],
      nueva: {
        medicamento: "",
        dosis: "",
        fechaHora: "",
      },
      historial: [],
      sugerencias: [],
      diagnosticosSeleccionados: [],
      guardadoDiagnosticoExito: false,
      guardadoDiagnosticoError: false,
      errorFechaMedicacion: "",
      emailNotificationStatus: "", // Para mostrar el estado del envío de email
    };
  },
  async mounted() {
    try {
      // Cargar datos de la enfermera desde localStorage
      const usuarioData = localStorage.getItem('usuario');
      
      if (usuarioData) {
        const usuario = JSON.parse(usuarioData);
        if (usuario.rol === 'enfermera') {
          this.enfermera = usuario;
        } else {
          // Si no es enfermera, redirigir
          this.$router.push('/');
          return;
        }
      } else {
        // Si no hay datos del usuario, redirigir al login
        this.$router.push('/');
        return;
      }

      // Cargar lista de pacientes
      await this.cargarPacientes();
    } catch (e) {
      console.error("Error al cargar datos:", e);
      alert("Error al cargar los datos");
    }
  },
  methods: {
    async cargarPacientes() {
      try {
        const querySnapshot = await getDocs(collection(db, "pacientes"));
        this.listaPacientes = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (e) {
        console.error("Error al cargar pacientes:", e);
      }
    },
    
    async cambiarPaciente() {
      if (!this.pacienteSeleccionado) {
        this.pacienteActual = null;
        this.diagnosticosSeleccionados = [];
        this.historial = [];
        return;
      }

      try {
        const paciente = this.listaPacientes.find(p => p.id === this.pacienteSeleccionado);
        if (paciente) {
          this.pacienteActual = paciente;
          
          // Cargar diagnósticos y medicaciones del paciente
          if (paciente.diagnosticos && Array.isArray(paciente.diagnosticos)) {
            this.diagnosticosSeleccionados = paciente.diagnosticos;
          } else {
            this.diagnosticosSeleccionados = [];
          }
          
          if (paciente.medicaciones && Array.isArray(paciente.medicaciones)) {
            this.historial = paciente.medicaciones.slice().sort((a, b) => 
              (b.fechaHora || '').localeCompare(a.fechaHora || '')
            );
          } else {
            this.historial = [];
          }
        }
      } catch (e) {
        console.error("Error al cambiar paciente:", e);
      }
    },

    async guardarDiagnosticos(diagnosticos) {
      if (!this.pacienteActual) return;
      // Si no recibe argumento, usa el array actual
      if (!Array.isArray(diagnosticos)) {
        diagnosticos = this.diagnosticosSeleccionados;
      }
      try {
        const docRef = doc(db, "pacientes", this.pacienteActual.id);
        // Asegurarse de que nunca se guarde undefined
        await updateDoc(docRef, {
          diagnosticos: Array.isArray(diagnosticos) ? diagnosticos : []
        });
        
        this.diagnosticosSeleccionados = diagnosticos;
        this.guardadoDiagnosticoExito = true;
        this.guardadoDiagnosticoError = false;
        
        setTimeout(() => {
          this.guardadoDiagnosticoExito = false;
        }, 3000);
      } catch (e) {
        this.guardadoDiagnosticoError = true;
        this.guardadoDiagnosticoExito = false;
        console.error("Error al guardar diagnósticos:", e);
      }
    },

    async registrarMedicacion(medicacion) {
      if (!this.pacienteActual) return;
      
      this.errorFechaMedicacion = "";
      this.emailNotificationStatus = "";
      
      // Validar fecha
      if (!medicacion.fechaHora) {
        this.errorFechaMedicacion = "Debes ingresar la fecha y hora de suministro.";
        return;
      }
      
      const fechaSuministro = new Date(medicacion.fechaHora);
      const ahora = new Date();

      // No permitir fechas en el futuro
      if (fechaSuministro > ahora) {
        this.errorFechaMedicacion = "La fecha de suministro no puede ser en el futuro.";
        return;
      }

      // No permitir fechas muy antiguas (más de 30 días atrás)
      const hace30dias = new Date();
      hace30dias.setDate(ahora.getDate() - 30);
      if (fechaSuministro < hace30dias) {
        this.errorFechaMedicacion = "La fecha de suministro no puede ser anterior a 30 días.";
        return;
      }

      // Agregar al historial local
      this.historial.unshift(medicacion);

      // Guardar en Firestore
      try {
        const docRef = doc(db, "pacientes", this.pacienteActual.id);
        await updateDoc(docRef, {
          medicaciones: arrayUnion({
            medicamento: medicacion.medicamento,
            dosis: medicacion.dosis,
            fechaHora: medicacion.fechaHora,
          })
        });

        // Enviar notificación por email
        if (isEmailJSConfigured()) {
          try {
            const emailResult = await sendMedicationNotification(medicacion, {
              ...this.pacienteActual,
              enfermera: this.enfermera.nombre
            });
            
            if (emailResult.success) {
              this.emailNotificationStatus = "✅ Notificación enviada al paciente";
            } else {
              this.emailNotificationStatus = `⚠️ ${emailResult.message}`;
            }
          } catch (emailError) {
            console.error("Error al enviar email:", emailError);
            this.emailNotificationStatus = "⚠️ Error al enviar notificación";
          }
        } else {
          this.emailNotificationStatus = "ℹ️ EmailJS no configurado";
        }

        // Limpiar el mensaje de email después de 5 segundos
        setTimeout(() => {
          this.emailNotificationStatus = "";
        }, 5000);

      } catch (e) {
        console.error("Error al guardar medicación en Firestore", e);
      }

      // Limpiar formulario
      this.nueva.medicamento = "";
      this.nueva.dosis = "";
      this.nueva.fechaHora = "";
      this.sugerencias = [];
      this.errorFechaMedicacion = "";
    },

    async eliminarMedicacion(index) {
      if (!this.pacienteActual || !confirm('¿Estás seguro de que quieres eliminar esta medicación?')) {
        return;
      }

      const medicacionAEliminar = this.historial[index];
      
      try {
        const docRef = doc(db, "pacientes", this.pacienteActual.id);
        await updateDoc(docRef, {
          medicaciones: arrayRemove(medicacionAEliminar)
        });
        
        // Remover del historial local
        this.historial.splice(index, 1);
      } catch (e) {
        console.error("Error al eliminar medicación:", e);
        alert("Error al eliminar la medicación");
      }
    },

    logout() {
      localStorage.removeItem('usuario');
      this.$router.push('/');
    },

    getEmailStatusClass() {
      if (this.emailNotificationStatus.includes('✅')) {
        return 'email-status email-success';
      } else if (this.emailNotificationStatus.includes('⚠️')) {
        return 'email-status email-warning';
      } else if (this.emailNotificationStatus.includes('ℹ️')) {
        return 'email-status email-info';
      }
      return 'email-status';
    }
  }
};
</script>
  
<style scoped>
.home-enfermera {
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
  margin-top: -32px !important;
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

.card, .header, .paciente-selector, .paciente-info, .diagnostico-form, .medicacion-form, .historial {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
  padding: 20px;
  margin: 0;
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

.paciente-selector {
  margin-bottom: 20px;
}

.selector-container {
  display: flex;
  gap: 10px;
  align-items: center;
}

.paciente-select {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
}

.btn-refresh {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.btn-refresh:hover {
  background: #218838;
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

.no-paciente {
  text-align: center;
  padding: 40px;
}

.no-paciente h2 {
  color: #333;
  margin-bottom: 15px;
}

.no-paciente p {
  color: #666;
  font-size: 18px;
}

section {
  margin-bottom: 30px;
}

h2 {
  color: #333;
  margin-bottom: 15px;
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

.btn-eliminar {
  background: #dc3545;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-eliminar:hover {
  background: #c82333;
}

.email-status {
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

.email-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.email-warning {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.email-info {
  background-color: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.diagnostico-form.card,
.medicacion-form.card,
.historial.card {
  margin-top: 32px !important;
  margin-bottom: 32px !important;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .selector-container {
    flex-direction: column;
  }
  
  .paciente-select {
    width: 100%;
  }
}
</style> 