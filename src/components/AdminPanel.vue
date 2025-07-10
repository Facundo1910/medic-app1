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
    </div>
  </div>
</template>

<script>
import { db } from "@/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { approveNurseAccount, rejectNurseAccount } from "@/services/nurseValidationService";

export default {
  name: "AdminPanel",
  data() {
    return {
      admin: {
        nombre: "Administrador"
      },
      solicitudes: [],
      cargando: true,
      mensajes: {},
      procesando: {}
    };
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
    }
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
</style> 