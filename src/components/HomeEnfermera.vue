<template>
  <div class="home-enfermera">
    <div class="contenedor-central">
      <header class="header">
        <div class="logo">🩺 Panel de Enfermera</div>
        <div class="usuario">
          <span class="nombre-usuario">{{ enfermera.apellido }}, {{ enfermera.nombre }}</span>
          <button @click="logout" class="btn-logout">
            Cerrar sesión
          </button>
        </div>
      </header>

      <!-- Menú de pestañas -->
      <nav class="enfermera-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['enfermera-tab', { active: seccionActiva === tab.id }]"
          @click="seccionActiva = tab.id"
        >
          {{ tab.label }}
        </button>
      </nav>
  
      <!-- Sección Pacientes -->
      <section v-if="seccionActiva === 'pacientes'">
        <!-- Selector de paciente -->
        <section class="paciente-selector">
        <div>
          <h2>Seleccionar Paciente</h2>
          <div class="selector-container">
            <select v-model="pacienteSeleccionado" @change="cambiarPaciente" class="paciente-select">
              <option value="">-- Selecciona un paciente --</option>
              <option v-for="paciente in listaPacientes" :key="paciente.id" :value="paciente.id">
                {{ paciente.nombre }} {{ paciente.apellido }} (DNI: {{ paciente.dni }})
              </option>
            </select>
            <button @click="cargarPacientes" class="btn-refresh">🔄</button>
          </div>
        </div>
      </section>
  
      <!-- Información del paciente seleccionado y módulos reutilizables -->
      <div v-if="pacienteActual">
        <PacienteInfo :paciente="pacienteActual" />
        <PacienteDiagnosticos :diagnosticos="pacienteActual.diagnosticos || []" />
        <PacienteHistorialMedicacion :historial="pacienteActual.medicaciones || []" />
        <PacienteResumen :diagnosticos="pacienteActual.diagnosticos || []" :historial="pacienteActual.medicaciones || []" />
        
        <!-- Sección de medicamentos indicados por el administrador -->
        <section class="medicamentos-indicados card">
          <h2>💊 Medicamentos indicados por el administrador</h2>
          <div v-if="medicamentosIndicadosVisibles.length > 0" class="medicamentos-indicados-scroll">
            <div v-for="med in medicamentosIndicadosVisibles" :key="med.id" class="med-indicado-item">
              <div class="med-indicado-nombre">{{ med.nombre }}</div>
              <div v-if="med.descripcion"><strong>Descripción:</strong> {{ med.descripcion }}</div>
              <div v-if="med.dosisRecomendada"><strong>Dosis:</strong> {{ med.dosisRecomendada }} mg</div>
              <div v-if="med.frecuencia"><strong>Frecuencia:</strong> {{ med.frecuencia }}</div>
              <div v-if="med.instrucciones"><strong>Instrucciones:</strong> {{ med.instrucciones }}</div>
              <div><em>Asignado el: {{ formatearFechaCorta(med.fechaAsignacion) }}</em></div>
            </div>
          </div>
          <div v-else class="no-data">
            <p>No hay medicamentos indicados actualmente</p>
          </div>
        </section>
        
        <!-- Formulario de registro de medicación -->
        <section class="medicacion-form card">
          <h2>💊 Cargar nueva medicación</h2>
          <MedicacionForm
            :medicamento="nueva.medicamento"
            @update:medicamento="nueva.medicamento = $event"
            :dosis="nueva.dosis"
            @update:dosis="nueva.dosis = $event"
            :fechaHora="nueva.fechaHora"
            @update:fechaHora="nueva.fechaHora = $event"
            :errorFecha="errorFechaMedicacion"
            @update:errorFecha="errorFechaMedicacion = $event"
            :medicamentosDisponibles="medicamentosDisponibles"
            @registrar="registrarMedicacion"
          />
          <div v-if="emailNotificationStatus" :class="getEmailStatusClass()">
            {{ emailNotificationStatus }}
          </div>
        </section>
        
        <!-- Formulario de registro de signos vitales -->
        <section class="signos-vitales-form card">
          <h2>🩺 Registrar signos vitales</h2>
          <form @submit.prevent="registrarSignosVitales" class="form-signos">
            <div class="form-row">
              <label>Temperatura corporal (°C):</label>
              <input v-model.number="signos.temperatura" type="number" step="0.1" min="30" max="45" required />
            </div>
            
            <div class="form-row">
              <label>Presión arterial (mmHg):</label>
              <input v-model="signos.presion" type="text" pattern="^\d{2,3}/\d{2,3}$" placeholder="Ej: 120/80" required />
            </div>
            
            <div class="form-row">
              <label>Frecuencia cardíaca (lpm):</label>
              <input v-model.number="signos.frecuenciaCardiaca" type="number" min="30" max="200" required />
            </div>
            
            <div class="form-row">
              <label>Frecuencia respiratoria (resps/min):</label>
              <input v-model.number="signos.frecuenciaRespiratoria" type="number" min="5" max="40" required />
            </div>
            
            <div class="form-row">
              <label>Saturación de oxígeno (% SpO2):</label>
              <input v-model.number="signos.saturacionOxigeno" type="number" min="50" max="100" required />
            </div>
            
            <div class="form-row">
              <label>Glucemia (mg/dL, opcional):</label>
              <input v-model.number="signos.glucemia" type="number" min="20" max="600" />
            </div>
            
            <div class="form-row">
              <label>Fecha y hora:</label>
              <input v-model="signos.fechaHora" type="datetime-local" required />
            </div>
            
            <button type="submit" class="btn-registrar-signos">Registrar signos vitales</button>
            <span v-if="signosExito" class="exito">Signos vitales registrados ✔️</span>
            <span v-if="signosError" class="error">Error al registrar signos vitales</span>
          </form>
        </section>
        
        <!-- Gráficos de signos vitales (al final) -->
        <SignosVitalesCharts :signosVitales="pacienteActual.signosVitales || []" />
      </div>
  
      <!-- Mensaje cuando no hay paciente seleccionado -->
      <div v-else class="no-paciente">
        <div class="card">
          <h2>👋 Bienvenido/a, {{ enfermera.apellido }}, {{ enfermera.nombre }}</h2>
          <p>Selecciona un paciente de la lista para comenzar a gestionar su información médica.</p>
        </div>
      </div>
      </section>

      <!-- Sección Configuración -->
      <section v-if="seccionActiva === 'configuracion'">
        <div class="card">
          <h2>⚙️ Configuración de Mi Cuenta</h2>
          
          <!-- Formulario de edición de datos personales -->
          <div class="configuracion-datos">
            <h3>📝 Editar Datos Personales</h3>
            <form @submit.prevent="guardarDatosPersonales" class="form-datos-personales">
              <div class="form-row">
                <label>Nombre:</label>
                <input 
                  v-model="datosEditables.nombre" 
                  type="text" 
                  required 
                  placeholder="Tu nombre"
                />
              </div>
              
              <div class="form-row">
                <label>Apellido:</label>
                <input 
                  v-model="datosEditables.apellido" 
                  type="text" 
                  required 
                  placeholder="Tu apellido"
                />
              </div>
              
              <div class="form-row">
                <label>Email:</label>
                <input 
                  v-model="datosEditables.email" 
                  type="email" 
                  required 
                  placeholder="tu@email.com"
                />
              </div>
              
              <div class="form-row">
                <label>DNI:</label>
                <div class="dni-container">
                  <input 
                    :value="enfermera.dni" 
                    type="text" 
                    disabled 
                    class="dni-disabled"
                    placeholder="DNI actual"
                  />
                  <button 
                    type="button" 
                    @click="solicitarCambioDNI" 
                    class="btn-solicitar-dni"
                  >
                    📝 Solicitar cambio
                  </button>
                </div>
              </div>
              
              <div class="form-actions">
                <button type="submit" class="btn-guardar-datos">
                  💾 Guardar Cambios
                </button>
                <button type="button" @click="cancelarEdicion" class="btn-cancelar">
                  ❌ Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>

    <!-- Modal para solicitar cambio de DNI -->
    <div v-if="mostrarModalDNI" class="modal-dni-overlay" @click="cerrarModalDNI">
      <div class="modal-dni" @click.stop>
        <div class="modal-dni-header">
          <h3>📝 Solicitar Cambio de DNI</h3>
          <button @click="cerrarModalDNI" class="btn-cerrar-modal">✕</button>
        </div>
        
        <div class="modal-dni-content">
          <p>Para cambiar tu DNI, debes solicitar autorización al administrador.</p>
          
          <form @submit.prevent="enviarSolicitudDNI" class="form-solicitud-dni">
            <div class="form-row">
              <label>DNI Actual:</label>
              <input :value="enfermera.dni" type="text" disabled class="dni-actual" />
            </div>
            
            <div class="form-row">
              <label>Nuevo DNI:</label>
              <input 
                v-model="solicitudDNI.nuevoDNI" 
                type="text" 
                required 
                placeholder="Ingresa el nuevo DNI"
                pattern="[0-9]{8}"
                maxlength="8"
              />
            </div>
            
            <div class="form-row">
              <label>Motivo del cambio:</label>
              <textarea 
                v-model="solicitudDNI.motivo" 
                required 
                placeholder="Explica el motivo del cambio de DNI..."
                rows="3"
              ></textarea>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn-enviar-solicitud">
                📤 Enviar Solicitud
              </button>
              <button type="button" @click="cerrarModalDNI" class="btn-cancelar">
                ❌ Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script>
import { db } from "@/firebase";
import { collection, getDocs, updateDoc, arrayUnion, arrayRemove, doc, addDoc } from "firebase/firestore";
import { sendMedicationNotification, isEmailJSConfigured, sendVitalSignsNotification } from "@/services/emailService";
import { getMedicamentos } from "@/services/medicamentoService";
import SignosVitalesCharts from "@/components/commons/SignosVitalesCharts.vue";
import { generarPDFSignosYMedicaciones } from '../utils/helpers';
import { sendPatientReportWithAttachment } from '@/services/emailService';
import PacienteInfo from './commons/PacienteInfo.vue';
import PacienteDiagnosticos from './commons/PacienteDiagnosticos.vue';
import PacienteHistorialMedicacion from './commons/PacienteHistorialMedicacion.vue';
import PacienteResumen from './commons/PacienteResumen.vue';
import MedicacionForm from './commons/MedicacionForm.vue';

export default {
  name: "HomeEnfermera",
  components: { SignosVitalesCharts, PacienteInfo, PacienteDiagnosticos, PacienteHistorialMedicacion, PacienteResumen, MedicacionForm },
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
      errorFechaMedicacion: "",
      emailNotificationStatus: "", // Para mostrar el estado del envío de email
      grupoAbierto: {},
      paginas: {},
      porPagina: 10,
      signos: {
        temperatura: '',
        presion: '',
        frecuenciaCardiaca: '',
        frecuenciaRespiratoria: '',
        saturacionOxigeno: '',
        glucemia: '',
        fechaHora: new Date().toISOString().slice(0,16)
      },
      signosExito: false,
      signosError: false,
      medicamentosDisponibles: [],
      medicamentosIndicadosVisibles: [],
      // Variables para configuración
      seccionActiva: 'pacientes',
      tabs: [
        { id: 'pacientes', label: 'Pacientes' },
        { id: 'configuracion', label: 'Configuración' }
      ],
      datosEditables: {
        nombre: '',
        apellido: '',
        email: ''
      },
      mostrarModalDNI: false,
      solicitudDNI: {
        nuevoDNI: '',
        motivo: ''
      }
    };
  },
  watch: {
    pacienteActual: {
      immediate: true,
      handler(nuevo) {
        if (nuevo && Array.isArray(nuevo.medicamentosIndicados)) {
          this.filtrarYLimpiarMedicamentosIndicados(nuevo);
        } else {
          this.medicamentosIndicadosVisibles = [];
        }
      }
    },
    seccionActiva(nuevaSeccion) {
      if (nuevaSeccion === 'configuracion') {
        this.cargarDatosEditables();
      }
    }
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
      // Cargar medicamentos disponibles
      await this.cargarMedicamentosDisponibles();
    } catch (e) {
      console.error("Error al cargar datos:", e);
      alert("Error al cargar los datos");
    }
    // Abrir el grupo del mes actual por defecto
    this.$nextTick(() => {
      const hoy = new Date();
      const key = hoy.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
      this.$set(this.grupoAbierto, key, true);
    });
  },
  methods: {
    async cargarPacientes() {
      try {
        const querySnapshot = await getDocs(collection(db, "pacientes"));
        const todosLosPacientes = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Filtrar solo los pacientes asignados a la enfermera logueada
        if (this.enfermera.pacientesAsignados && Array.isArray(this.enfermera.pacientesAsignados)) {
          this.listaPacientes = todosLosPacientes.filter(p => this.enfermera.pacientesAsignados.includes(p.id));
        } else {
          this.listaPacientes = [];
        }
      } catch (e) {
        console.error("Error al cargar pacientes:", e);
      }
    },

    async cargarMedicamentosDisponibles() {
      try {
        this.medicamentosDisponibles = await getMedicamentos();
      } catch (e) {
        console.error("Error al cargar medicamentos:", e);
      }
    },
    
    async borrarSignosVitalesViejosPaciente(paciente) {
      if (!paciente || !paciente.id) return;
      const ahora = new Date();
      const tresDiasMs = 3 * 24 * 60 * 60 * 1000;
      let signosNuevos = [];
      let huboCambios = false;

      if (Array.isArray(paciente.signosVitales)) {
        signosNuevos = paciente.signosVitales.filter(sv => {
          const fecha = new Date(sv.fechaHora);
          return ahora - fecha <= tresDiasMs;
        });
        if (signosNuevos.length !== paciente.signosVitales.length) huboCambios = true;
      }
      if (huboCambios) {
        // 1. Generar y enviar PDF antes de borrar
        try {
          // Buscar el canvas del gráfico combinado
          await this.$nextTick();
          const chartCanvas = document.querySelector('.grafico-combinado canvas');
          const pdfBlob = await generarPDFSignosYMedicaciones(
            chartCanvas,
            paciente.medicaciones || [],
            paciente
          );
          // Convertir Blob a base64
          const base64pdf = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = reader.result.split(',')[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(pdfBlob);
          });
          await sendPatientReportWithAttachment(paciente, base64pdf);
        } catch (e) {
          console.error('Error generando o enviando el PDF:', e);
        }
        // 2. Borrar signos vitales viejos
        const docRef = doc(db, "pacientes", paciente.id);
        await updateDoc(docRef, {
          signosVitales: signosNuevos
        });
        // Actualizar arrays locales también
        if (this.pacienteActual && this.pacienteActual.id === paciente.id) {
          this.pacienteActual.signosVitales = signosNuevos;
        }
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
          // Borrar signos vitales viejos antes de asignar
          await this.borrarSignosVitalesViejosPaciente(paciente);
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
          if (paciente.signosVitales && Array.isArray(paciente.signosVitales)) {
            // Ordenar por fecha ascendente
            this.pacienteActual.signosVitales = paciente.signosVitales.slice().sort((a, b) => {
              return new Date(a.fechaHora) - new Date(b.fechaHora);
            });
          } else {
            this.pacienteActual.signosVitales = [];
          }
        }
      } catch (e) {
        console.error("Error al cambiar paciente:", e);
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

    async registrarSignosVitales() {
      if (!this.pacienteActual) return;
      this.signosExito = false;
      this.signosError = false;
      try {
        const docRef = doc(db, "pacientes", this.pacienteActual.id);
        const nuevoRegistro = { ...this.signos };
        await updateDoc(docRef, {
          signosVitales: arrayUnion(nuevoRegistro)
        });
        this.signosExito = true;
        this.signosError = false;
        // Notificar por email si está configurado
        if (isEmailJSConfigured()) {
          try {
            await sendVitalSignsNotification(nuevoRegistro, this.pacienteActual);
          } catch (e) {
            console.error("Error al enviar notificación de signos vitales:", e);
          }
        }
        // Limpiar formulario
        this.signos = {
          temperatura: '',
          presion: '',
          frecuenciaCardiaca: '',
          frecuenciaRespiratoria: '',
          saturacionOxigeno: '',
          glucemia: '',
          fechaHora: new Date().toISOString().slice(0,16)
        };
        setTimeout(() => { this.signosExito = false; }, 3000);
      } catch (e) {
        this.signosError = true;
        this.signosExito = false;
        setTimeout(() => { this.signosError = false; }, 3000);
        console.error("Error al registrar signos vitales:", e);
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
    },
    eliminarMedicacionPorGrupo(key, idx) {
      const grupo = this.historialAgrupado[key] || [];
      const pagina = this.paginas[key] || 1;
      const inicio = (pagina - 1) * this.porPagina;
      const indexGlobal = this.historial.findIndex(item => item === grupo[inicio + idx]);
      if (indexGlobal !== -1) {
        this.eliminarMedicacion(indexGlobal);
      }
    },
    formatearFechaCorta(fecha) {
      if (!fecha) return '';
      const d = new Date(fecha);
      return d.toLocaleDateString();
    },
    async filtrarYLimpiarMedicamentosIndicados(paciente) {
      const hoy = new Date();
      hoy.setHours(0,0,0,0);
      const visibles = [];
      const historicos = Array.isArray(paciente.medicamentosHistoricos) ? paciente.medicamentosHistoricos.slice() : [];
      let huboCambios = false;
      for (const med of paciente.medicamentosIndicados || []) {
        const fecha = new Date(med.fechaAsignacion);
        fecha.setHours(0,0,0,0);
        if (fecha < hoy) {
          // Mover a historicos
          historicos.push(med);
          huboCambios = true;
        } else {
          visibles.push(med);
        }
      }
      this.medicamentosIndicadosVisibles = visibles;
      if (huboCambios) {
        // Actualizar en Firestore
        const docRef = doc(db, "pacientes", paciente.id);
        await updateDoc(docRef, {
          medicamentosIndicados: visibles,
          medicamentosHistoricos: historicos
        });
        // Refrescar local
        this.pacienteActual.medicamentosIndicados = visibles;
        this.pacienteActual.medicamentosHistoricos = historicos;
      }
    },

    // Métodos para configuración
    cargarDatosEditables() {
      this.datosEditables = {
        nombre: this.enfermera.nombre || '',
        apellido: this.enfermera.apellido || '',
        email: this.enfermera.email || ''
      };
    },

    async guardarDatosPersonales() {
      try {
        // Actualizar en localStorage
        const usuarioActual = JSON.parse(localStorage.getItem('usuario'));
        const usuarioActualizado = {
          ...usuarioActual,
          nombre: this.datosEditables.nombre,
          apellido: this.datosEditables.apellido,
          email: this.datosEditables.email
        };
        localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
        
        // Actualizar datos locales
        this.enfermera = usuarioActualizado;
        
        // Actualizar en Firestore
        const enfermerasRef = collection(db, "enfermeras");
        const querySnapshot = await getDocs(enfermerasRef);
        const enfermeraDoc = querySnapshot.docs.find(doc => doc.data().dni === this.enfermera.dni);
        
        if (enfermeraDoc) {
          await updateDoc(doc(db, "enfermeras", enfermeraDoc.id), {
            nombre: this.datosEditables.nombre,
            apellido: this.datosEditables.apellido,
            email: this.datosEditables.email
          });
        }
        
        alert('✅ Datos personales actualizados correctamente');
      } catch (error) {
        console.error('Error al guardar datos personales:', error);
        alert('❌ Error al guardar los datos personales');
      }
    },

    cancelarEdicion() {
      this.cargarDatosEditables();
    },

    solicitarCambioDNI() {
      this.mostrarModalDNI = true;
      this.solicitudDNI = {
        nuevoDNI: '',
        motivo: ''
      };
    },

    cerrarModalDNI() {
      this.mostrarModalDNI = false;
      this.solicitudDNI = {
        nuevoDNI: '',
        motivo: ''
      };
    },

    async enviarSolicitudDNI() {
      try {
        // Validar DNI
        if (!/^\d{8}$/.test(this.solicitudDNI.nuevoDNI)) {
          alert('❌ El DNI debe tener exactamente 8 dígitos numéricos');
          return;
        }

        // Verificar que no sea el mismo DNI
        if (this.solicitudDNI.nuevoDNI === this.enfermera.dni) {
          alert('❌ El nuevo DNI no puede ser igual al actual');
          return;
        }

        // Crear solicitud en Firestore
        await addDoc(collection(db, "solicitudesDNI"), {
          dniActual: this.enfermera.dni,
          nuevoDNI: this.solicitudDNI.nuevoDNI,
          motivo: this.solicitudDNI.motivo,
          usuarioId: this.enfermera.id || this.enfermera.dni,
          rol: 'enfermera',
          nombre: this.enfermera.nombre,
          apellido: this.enfermera.apellido,
          email: this.enfermera.email,
          fechaSolicitud: new Date().toISOString(),
          estado: 'pendiente'
        });

        alert('✅ Solicitud de cambio de DNI enviada correctamente. Será revisada por el administrador.');
        this.cerrarModalDNI();
      } catch (error) {
        console.error('Error al enviar solicitud de DNI:', error);
        alert('❌ Error al enviar la solicitud de cambio de DNI');
      }
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

.signos-vitales-form {
  margin-top: 32px;
  margin-bottom: 32px;
  background: #f8f9fa;
  border-radius: 10px;
  padding: 24px 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
}
.signos-vitales-form h2 {
  margin-bottom: 18px;
}
.form-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}
.form-row label {
  font-weight: 600;
  margin-bottom: 4px;
}
.btn-registrar-signos {
  background: #007bff;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;
  transition: background 0.2s;
}
.btn-registrar-signos:hover {
  background: #0056b3;
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

.medicamentos-indicados-scroll {
  max-height: 220px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px;
  background: #fafcff;
  margin-bottom: 8px;
}
.med-indicado-item {
  padding: 10px 0;
  border-bottom: 1px solid #e0e0e0;
}
.med-indicado-item:last-child {
  border-bottom: none;
}
.med-indicado-nombre {
  font-weight: bold;
  font-size: 16px;
  color: #2d4fff;
  margin-bottom: 2px;
}

/* Estilos para las pestañas */
.enfermera-tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  padding: 8px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
  gap: 4px;
}

.enfermera-tab {
  flex: 1;
  padding: 12px 20px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  color: #666;
  transition: all 0.3s ease;
}

.enfermera-tab:hover {
  background: rgba(0, 123, 255, 0.1);
  color: #007bff;
}

.enfermera-tab.active {
  background: #007bff;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.3);
}

/* Estilos para la sección de configuración */
.configuracion-datos {
  max-width: 600px;
  margin: 0 auto;
}

.configuracion-datos h3 {
  color: #333;
  margin-bottom: 20px;
  font-size: 18px;
}

.form-datos-personales {
  background: #f8f9fa;
  padding: 24px;
  border-radius: 10px;
  border: 1px solid #e9ecef;
}

.form-datos-personales .form-row {
  margin-bottom: 20px;
}

.form-datos-personales label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.form-datos-personales input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-datos-personales input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.dni-container {
  display: flex;
  gap: 10px;
  align-items: center;
}

.dni-disabled {
  background: #f8f9fa;
  color: #666;
  cursor: not-allowed;
}

.btn-solicitar-dni {
  background: #ffc107;
  color: #212529;
  border: none;
  padding: 12px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.3s;
  white-space: nowrap;
}

.btn-solicitar-dni:hover {
  background: #e0a800;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  justify-content: flex-end;
}

.btn-guardar-datos {
  background: #28a745;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background 0.3s;
}

.btn-guardar-datos:hover {
  background: #218838;
}

.btn-cancelar {
  background: #6c757d;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background 0.3s;
}

.btn-cancelar:hover {
  background: #5a6268;
}

/* Estilos para el modal de DNI */
.modal-dni-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-dni {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-dni-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
}

.modal-dni-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.btn-cerrar-modal {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.3s;
}

.btn-cerrar-modal:hover {
  background: #f8f9fa;
}

.modal-dni-content {
  padding: 24px;
}

.modal-dni-content p {
  color: #666;
  margin-bottom: 20px;
  line-height: 1.5;
}

.form-solicitud-dni .form-row {
  margin-bottom: 20px;
}

.form-solicitud-dni label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.form-solicitud-dni input,
.form-solicitud-dni textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-solicitud-dni input:focus,
.form-solicitud-dni textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.dni-actual {
  background: #f8f9fa;
  color: #666;
  cursor: not-allowed;
}

.btn-enviar-solicitud {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background 0.3s;
}

.btn-enviar-solicitud:hover {
  background: #0056b3;
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

  .enfermera-tabs {
    flex-direction: column;
  }

  .enfermera-tab {
    text-align: center;
  }

  .dni-container {
    flex-direction: column;
    align-items: stretch;
  }

  .form-actions {
    flex-direction: column;
  }

  .modal-dni {
    width: 95%;
    margin: 20px;
  }
}
</style> 