<template>
  <div class="admin-panel">
    <div class="contenedor-central">
      <header class="header">
        <div class="logo">🔧 Panel de Administración</div>
        <div class="usuario">
          <span class="nombre-usuario">{{ admin.nombre }}</span>
          <button @click="logout" class="btn-logout">
            Cerrar sesión
          </button>
        </div>
      </header>

      <section class="solicitudes-pendientes">
        <div class="card">
          <h2>📋 Solicitudes de Validación de Enfermeras</h2>
          
          <div v-if="cargando" class="cargando">
            <p>Cargando solicitudes...</p>
          </div>
          
          <div v-else-if="solicitudes.length === 0" class="no-solicitudes">
            <p>No hay solicitudes pendientes de validación</p>
          </div>
          
          <div v-else class="solicitudes-lista">
            <div v-for="solicitud in solicitudes" :key="solicitud.id" class="solicitud-item">
              <div class="solicitud-info">
                <h3>{{ solicitud.nombre }}</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Email:</label>
                    <span>{{ solicitud.email }}</span>
                  </div>
                  <div class="info-item">
                    <label>Año de nacimiento:</label>
                    <span>{{ solicitud.anioNacimiento }}</span>
                  </div>
                  <div class="info-item">
                    <label>Fecha de solicitud:</label>
                    <span>{{ formatearFecha(solicitud.fechaSolicitud) }}</span>
                  </div>
                  <div class="info-item">
                    <label>Estado:</label>
                    <span :class="getEstadoClass(solicitud.estado)">{{ solicitud.estado }}</span>
                  </div>
                </div>
              </div>
              
              <div v-if="solicitud.estado === 'pendiente'" class="acciones">
                <div class="accion-grupo">
                  <label for="mensaje-aprobacion">Mensaje (opcional):</label>
                  <textarea 
                    v-model="mensajes[solicitud.id]" 
                    id="mensaje-aprobacion"
                    placeholder="Mensaje personalizado para la enfermera..."
                    rows="2"
                  ></textarea>
                </div>
                
                <div class="botones-accion">
                  <button 
                    @click="aprobarEnfermera(solicitud.id, mensajes[solicitud.id])"
                    :disabled="procesando[solicitud.id]"
                    class="btn-aprobar"
                  >
                    {{ procesando[solicitud.id] ? 'Aprobando...' : '✅ Aprobar' }}
                  </button>
                  
                  <button 
                    @click="rechazarEnfermera(solicitud.id, mensajes[solicitud.id])"
                    :disabled="procesando[solicitud.id]"
                    class="btn-rechazar"
                  >
                    {{ procesando[solicitud.id] ? 'Rechazando...' : '❌ Rechazar' }}
                  </button>
                </div>
              </div>
              
              <div v-else-if="solicitud.estado === 'aprobado'" class="estado-finalizado">
                <p class="aprobado">✅ Cuenta aprobada el {{ formatearFecha(solicitud.fechaAprobacion) }}</p>
                <p v-if="solicitud.mensaje" class="mensaje-admin">Mensaje: {{ solicitud.mensaje }}</p>
              </div>
              
              <div v-else-if="solicitud.estado === 'rechazado'" class="estado-finalizado">
                <p class="rechazado">❌ Cuenta rechazada el {{ formatearFecha(solicitud.fechaRechazo) }}</p>
                <p v-if="solicitud.motivoRechazo" class="mensaje-admin">Motivo: {{ solicitud.motivoRechazo }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="asignacion-pacientes">
        <div class="card">
          <h2>👩‍⚕️ Asignar Pacientes a Enfermeras</h2>
          <div v-if="cargandoAsignacion">Cargando enfermeras y pacientes...</div>
          <div v-else>
            <label for="enfermeraSelect">Selecciona una enfermera:</label>
            <select v-model="enfermeraSeleccionadaId" id="enfermeraSelect">
              <option value="">-- Selecciona --</option>
              <option v-for="enf in enfermeras" :key="enf.id" :value="enf.id">{{ enf.nombre }} ({{ enf.email }})</option>
            </select>
            <div v-if="enfermeraSeleccionada">
              <h3>Pacientes asignados:</h3>
              <multiselect
                v-model="pacientesAsignadosTemp"
                :options="pacientes"
                :multiple="true"
                :close-on-select="false"
                :clear-on-select="false"
                :preserve-search="true"
                :searchable="true"
                :custom-label="customLabelPaciente"
                placeholder="Buscar y seleccionar pacientes..."
                label="nombre"
                track-by="id"
                :max-height="250"
              />
              <button @click="guardarAsignacion" class="btn-guardar-asignacion">Guardar asignación</button>
              <span v-if="asignacionGuardada" class="asignacion-ok">¡Asignación guardada!</span>
            </div>
          </div>
        </div>
      </section>
      <section class="tabla-pacientes card">
        <h2>📋 Reportes de Pacientes</h2>
        <input v-model="busquedaPaciente" placeholder="Buscar paciente por nombre, apellido o email..." class="input-busqueda-paciente" />
        <table class="tabla-pacientes-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Enfermera(s) asignada(s)</th>
              <th>Reporte</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pac in pacientesFiltrados" :key="pac.id">
              <td>{{ pac.nombre }} {{ pac.apellido }}</td>
              <td>{{ pac.email }}</td>
              <td>
                <span v-if="pac.enfermeras && pac.enfermeras.length">
                  <span v-for="(enf, idx) in pac.enfermeras" :key="enf.id">
                    {{ enf.nombre }}<span v-if="idx < pac.enfermeras.length - 1">, </span>
                  </span>
                </span>
                <span v-else style="color:#888;">Sin enfermera asignada</span>
              </td>
              <td>
                <button @click="descargarReportePaciente(pac)" class="btn-reporte-paciente">
                  <span class="icono-reporte">📄</span> Reporte
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </div>
</template>

<script>
import { db } from "@/firebase";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { approveNurseAccount, rejectNurseAccount } from "@/services/nurseValidationService";
// Importar vue-multiselect
import Multiselect from 'vue-multiselect';
import 'vue-multiselect/dist/vue-multiselect.min.css';
import { generarPDFSignosYMedicaciones } from '@/utils/helpers';

export default {
  name: "AdminPanel",
  components: {
    Multiselect
  },
  data() {
    return {
      admin: {
        nombre: "Administrador"
      },
      solicitudes: [],
      cargando: true,
      mensajes: {},
      procesando: {},
      enfermeras: [],
      pacientes: [
        { id: '1', nombre: 'Juan', apellido: 'Pérez', dni: '123' },
        { id: '2', nombre: 'Ana', apellido: 'García', dni: '456' },
        { id: '3', nombre: 'Carlos', apellido: 'López', dni: '789' }
      ],
      cargandoAsignacion: true,
      enfermeraSeleccionadaId: "",
      pacientesAsignadosTemp: [],
      asignacionGuardada: false,
      busquedaPaciente: '',
    };
  },
  computed: {
    enfermeraSeleccionada() {
      return this.enfermeras.find(e => e.id === this.enfermeraSeleccionadaId) || null;
    },
    pacientesFiltrados() {
      if (!this.pacientes || !this.busquedaPaciente) return this.pacientes;
      const q = this.busquedaPaciente.toLowerCase();
      return this.pacientes.filter(pac =>
        (pac.nombre && pac.nombre.toLowerCase().includes(q)) ||
        (pac.apellido && pac.apellido.toLowerCase().includes(q)) ||
        (pac.email && pac.email.toLowerCase().includes(q))
      );
    }
  },
  watch: {
    enfermeraSeleccionadaId(newId) {
      const enf = this.enfermeras.find(e => e.id === newId);
      this.pacientesAsignadosTemp = enf && enf.pacientesAsignados
        ? this.pacientes.filter(p => enf.pacientesAsignados.includes(p.id))
        : [];
      this.asignacionGuardada = false;
    }
  },
  async mounted() {
    try {
      // Verificar que el usuario sea administrador
      const usuarioData = localStorage.getItem('usuario');
      
      if (usuarioData) {
        const usuario = JSON.parse(usuarioData);
        if (usuario.rol === 'admin') {
          this.admin = usuario;
        } else {
          // Si no es admin, redirigir
          this.$router.push('/');
          return;
        }
      } else {
        // Si no hay datos del usuario, redirigir al login
        this.$router.push('/');
        return;
      }

      await this.cargarSolicitudes();
      await this.cargarEnfermerasYPacientes();
    } catch (e) {
      console.error("Error al cargar datos:", e);
      alert("Error al cargar los datos");
    }
  },
  methods: {
    async cargarSolicitudes() {
      try {
        this.cargando = true;
        const q = query(
          collection(db, "nurseValidationRequests"),
          orderBy("fechaSolicitud", "desc")
        );
        const querySnapshot = await getDocs(q);
        const now = Date.now();
        const unDiaMs = 24 * 60 * 60 * 1000;
        const batchDeletes = [];
        this.solicitudes = [];
        for (const doc of querySnapshot.docs) {
          const data = doc.data();
          let fechaEstado = null;
          if (data.estado === 'aprobado' && data.fechaAprobacion) {
            fechaEstado = new Date(data.fechaAprobacion).getTime();
          } else if (data.estado === 'rechazado' && data.fechaRechazo) {
            fechaEstado = new Date(data.fechaRechazo).getTime();
          }
          if (fechaEstado && (now - fechaEstado > unDiaMs)) {
            // Eliminar solicitud vieja
            batchDeletes.push(doc.ref.delete());
          } else {
            this.solicitudes.push({ id: doc.id, ...data });
          }
        }
        if (batchDeletes.length > 0) {
          await Promise.all(batchDeletes);
        }
      } catch (e) {
        console.error("Error al cargar solicitudes:", e);
        alert("Error al cargar las solicitudes");
      } finally {
        this.cargando = false;
      }
    },
    
    async aprobarEnfermera(requestId, mensaje = '') {
      this.procesando[requestId] = true;
      try {
        const result = await approveNurseAccount(requestId, mensaje);
        
        if (result.success) {
          alert("Cuenta aprobada exitosamente");
          await this.cargarSolicitudes(); // Recargar la lista
        } else {
          alert(`Error: ${result.message}`);
        }
      } catch (error) {
        console.error("Error al aprobar enfermera:", error);
        alert("Error al aprobar la cuenta");
      } finally {
        this.procesando[requestId] = false;
      }
    },
    
    async rechazarEnfermera(requestId, motivo = '') {
      this.procesando[requestId] = true;
      try {
        const result = await rejectNurseAccount(requestId, motivo);
        
        if (result.success) {
          alert("Solicitud rechazada exitosamente");
          await this.cargarSolicitudes(); // Recargar la lista
        } else {
          alert(`Error: ${result.message}`);
        }
      } catch (error) {
        console.error("Error al rechazar enfermera:", error);
        alert("Error al rechazar la solicitud");
      } finally {
        this.procesando[requestId] = false;
      }
    },
    
    formatearFecha(fechaString) {
      if (!fechaString) return 'N/A';
      return new Date(fechaString).toLocaleString('es-ES');
    },
    
    getEstadoClass(estado) {
      switch (estado) {
        case 'pendiente':
          return 'estado-pendiente';
        case 'aprobado':
          return 'estado-aprobado';
        case 'rechazado':
          return 'estado-rechazado';
        default:
          return '';
      }
    },
    
    logout() {
      localStorage.removeItem('usuario');
      this.$router.push('/');
    },

    async cargarEnfermerasYPacientes() {
      this.cargandoAsignacion = true;
      try {
        const enfermerasSnap = await getDocs(collection(db, "enfermeras"));
        this.enfermeras = enfermerasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const pacientesSnap = await getDocs(collection(db, "pacientes"));
        this.pacientes = pacientesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) {
        alert("Error al cargar enfermeras o pacientes");
      } finally {
        this.cargandoAsignacion = false;
      }
    },
    async guardarAsignacion() {
      if (!this.enfermeraSeleccionadaId) return;
      try {
        // Actualizar la enfermera con los pacientes asignados
        const enfRef = doc(db, 'enfermeras', this.enfermeraSeleccionadaId);
        const pacientesIds = this.pacientesAsignadosTemp.map(p => p.id);
        await updateDoc(enfRef, { pacientesAsignados: pacientesIds });

        // Obtener pacientes que estaban previamente asignados a la enfermera
        const enfermeraObj = this.enfermeras.find(e => e.id === this.enfermeraSeleccionadaId);
        const pacientesAntes = Array.isArray(enfermeraObj.pacientesAsignados) ? enfermeraObj.pacientesAsignados : [];
        const pacientesAhora = pacientesIds;

        // Pacientes que fueron desasignados (estaban antes y ya no están)
        const pacientesDesasignados = pacientesAntes.filter(id => !pacientesAhora.includes(id));
        // Pacientes que siguen o se asignaron (para actualizar/crear array de enfermeras)
        const pacientesAsignados = this.pacientesAsignadosTemp;

        // Desasignar enfermera de los pacientes que fueron quitados
        for (const pacienteId of pacientesDesasignados) {
          const pacRef = doc(db, 'pacientes', pacienteId);
          // Obtener el paciente actual de this.pacientes
          const paciente = this.pacientes.find(p => p.id === pacienteId);
          let nuevasEnfermeras = Array.isArray(paciente?.enfermeras) ? paciente.enfermeras.filter(e => e.id !== this.enfermeraSeleccionadaId) : [];
          await updateDoc(pacRef, { enfermeras: nuevasEnfermeras });
        }

        // Asignar enfermera a los pacientes seleccionados
        for (const paciente of pacientesAsignados) {
          const pacRef = doc(db, 'pacientes', paciente.id);
          // Buscar el objeto enfermera
          // Si el paciente ya tiene un array de enfermeras, agrego si no está, si no, lo creo
          let nuevasEnfermeras = Array.isArray(paciente.enfermeras) ? paciente.enfermeras.slice() : [];
          // Evitar duplicados
          if (!nuevasEnfermeras.some(e => e.id === enfermeraObj.id)) {
            nuevasEnfermeras.push({ id: enfermeraObj.id, nombre: enfermeraObj.nombre });
          }
          await updateDoc(pacRef, { enfermeras: nuevasEnfermeras });
        }
        this.asignacionGuardada = true;
        // Refrescar la tabla de pacientes automáticamente
        await this.cargarEnfermerasYPacientes();
      } catch (e) {
        alert('Error al guardar la asignación');
      }
    },
    nombrePaciente(pid) {
      const pac = this.pacientes.find(p => p.id === pid);
      return pac ? `${pac.nombre} ${pac.apellido}` : pid;
    },
    esUltimoPaciente(arr, pid) {
      return arr.indexOf(pid) === arr.length - 1;
    },
    customLabelPaciente(p) {
      return `${p.nombre} ${p.apellido} (${p.dni})`;
    },
    async descargarReportePaciente(paciente) {
      // Renderizar un gráfico temporal oculto si es necesario, o usar el canvas si está visible
      // Por simplicidad, solo tabla de medicaciones si no hay gráfico visible
      const chartCanvas = document.querySelector('.grafico-combinado canvas');
      const pdfBlob = await generarPDFSignosYMedicaciones(
        chartCanvas,
        paciente.medicaciones || [],
        paciente
      );
      // Descargar el PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${paciente.nombre}_${paciente.apellido}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    },
  }
};
</script>

<style scoped>
.admin-panel {
  min-height: 100vh;
  padding: 32px 0;
  background: #f6f8fc;
}

.contenedor-central {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
  margin-top: 32px;
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

.card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.cargando, .no-solicitudes {
  text-align: center;
  padding: 40px;
  color: #666;
}

.solicitudes-lista {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.solicitud-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  background: #fafafa;
}

.solicitud-info h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  margin-bottom: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item label {
  font-weight: bold;
  color: #666;
  font-size: 12px;
  margin-bottom: 2px;
}

.info-item span {
  color: #333;
}

.estado-pendiente {
  color: #f39c12;
  font-weight: bold;
}

.estado-aprobado {
  color: #27ae60;
  font-weight: bold;
}

.estado-rechazado {
  color: #e74c3c;
  font-weight: bold;
}

.acciones {
  border-top: 1px solid #e0e0e0;
  padding-top: 15px;
}

.accion-grupo {
  margin-bottom: 15px;
}

.accion-grupo label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

.accion-grupo textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
}

.botones-accion {
  display: flex;
  gap: 10px;
}

.btn-aprobar, .btn-rechazar {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.3s;
}

.btn-aprobar {
  background: #28a745;
  color: white;
}

.btn-aprobar:hover:not(:disabled) {
  background: #218838;
}

.btn-rechazar {
  background: #dc3545;
  color: white;
}

.btn-rechazar:hover:not(:disabled) {
  background: #c82333;
}

.btn-aprobar:disabled, .btn-rechazar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.estado-finalizado {
  border-top: 1px solid #e0e0e0;
  padding-top: 15px;
}

.aprobado {
  color: #27ae60;
  font-weight: bold;
  margin: 0;
}

.rechazado {
  color: #e74c3c;
  font-weight: bold;
  margin: 0;
}

.mensaje-admin {
  color: #666;
  font-style: italic;
  margin: 5px 0 0 0;
  font-size: 14px;
}

.asignacion-pacientes .card {
  margin-top: 32px;
  padding: 24px 18px;
}
.pacientes-lista {
  display: none;
}
.pacientes-multiselect {
  width: 100%;
  min-width: 220px;
  max-width: 400px;
  margin: 12px 0 18px 0;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #b3c6e0;
  font-size: 15px;
  background: #f6f8fc;
  box-shadow: 0 2px 8px rgba(30,136,229,0.07);
}
.btn-guardar-asignacion {
  background: #1e88e5;
  color: white;
  border: none;
  padding: 8px 18px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.2s;
}
.btn-guardar-asignacion:hover {
  background: #1565c0;
}
.asignacion-ok {
  color: #28a745;
  margin-left: 16px;
  font-weight: bold;
}
.resumen-asignaciones .card {
  margin-top: 32px;
  padding: 24px 18px;
}
.tabla-asignaciones {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
}
.tabla-asignaciones th, .tabla-asignaciones td {
  border: 1px solid #e0e0e0;
  padding: 8px 12px;
  text-align: left;
}
.tabla-asignaciones th {
  background: #f6f8fc;
  font-weight: bold;
}
.input-busqueda-paciente {
  width: 100%;
  max-width: 350px;
  margin-bottom: 14px;
  padding: 7px 12px;
  border: 1.5px solid #bbb;
  border-radius: 6px;
  font-size: 1em;
}
.tabla-pacientes-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
}
.tabla-pacientes-table th, .tabla-pacientes-table td {
  padding: 10px 8px;
  border: 1px solid #eee;
  text-align: left;
}
.btn-reporte-paciente {
  background: #f4f4f4;
  color: #333;
  border: 1.5px solid #bbb;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.98em;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border 0.2s;
  box-shadow: none;
  display: flex;
  align-items: center;
  gap: 6px;
}
.btn-reporte-paciente:hover {
  background: #e0e0e0;
  color: #111;
  border-color: #888;
}
.icono-reporte {
  font-size: 1.1em;
  margin-right: 2px;
}
</style> 