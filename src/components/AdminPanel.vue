<template>
  <div class="admin-panel">
    <div v-if="mensajeBanner" :class="['banner-mensaje', mensajeTipo]">
      {{ mensajeBanner }}
    </div>
    <div class="contenedor-central">
      <header class="header">
        <div class="logo">🔧 Panel de Administración</div>
        <div class="usuario">
          <span class="nombre-usuario">Dr. {{ admin.apellido }}, {{ admin.nombre }}</span>
          <button @click="logout" class="btn-logout">
            Cerrar sesión
          </button>
        </div>
      </header>

      <!-- Menú de pestañas -->
      <nav class="admin-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['admin-tab', { active: seccionActiva === tab.id }]"
          @click="seccionActiva = tab.id"
        >
          {{ tab.label }}
        </button>
      </nav>

      <!-- Sección Pacientes -->
      <section v-if="seccionActiva === 'pacientes'">
        <section class="gestion-medicamentos">
          <div class="card">
            <h2>💊 Receta Médica</h2>
            <div class="medicamentos-container">
              <!-- Formulario para agregar medicamento -->
              <div class="formulario-medicamento">
                <h3>Agregar Nuevo Medicamento</h3>
                <form @submit.prevent="agregarMedicamento">
                  <div class="form-row">
                    <label>Diagnóstico para esta receta (obligatorio):</label>
                    <DiagnosticoSelector :diagnosticos.sync="nuevoDiagnostico" />
                    <span v-if="diagnosticoError" class="error-msg">El diagnóstico es obligatorio.</span>
                  </div>
                  <div class="form-row" style="position: relative;">
                    <label>Nombre del medicamento:</label>
                    <input 
                      v-model="nuevoMedicamento.nombre" 
                      type="text" 
                      required 
                      placeholder="Ej: Paracetamol"
                      @input="buscarMedicamentosCIMA"
                    />
                    <ul v-if="sugerenciasCIMA.length" class="sugerencias-cima-lista">
                      <li 
                        v-for="(sug, idx) in sugerenciasCIMA" 
                        :key="idx"
                        @click="seleccionarSugerenciaCIMA(sug)"
                        class="sugerencia-cima-item"
                      >
                        {{ sug }}
                      </li>
                    </ul>
                  </div>
                  <div class="form-row">
                    <label>Descripción:</label>
                    <textarea 
                      v-model="nuevoMedicamento.descripcion" 
                      placeholder="Descripción del medicamento..."
                      rows="3"
                    ></textarea>
                  </div>
                  <div class="form-row">
                    <label>Dosis recomendada (mg):</label>
                    <input 
                      v-model="nuevoMedicamento.dosisRecomendada" 
                      type="number" 
                      min="1"
                      placeholder="Ej: 500"
                    />
                  </div>
                  <div class="form-row">
                    <label>Frecuencia de administración:</label>
                    <select v-model="nuevoMedicamento.frecuencia">
                      <option value="">Seleccionar frecuencia</option>
                      <option value="cada 4 horas">Cada 4 horas</option>
                      <option value="cada 6 horas">Cada 6 horas</option>
                      <option value="cada 8 horas">Cada 8 horas</option>
                      <option value="cada 12 horas">Cada 12 horas</option>
                      <option value="una vez al día">Una vez al día</option>
                      <option value="dos veces al día">Dos veces al día</option>
                      <option value="tres veces al día">Tres veces al día</option>
                      <option value="según necesidad">Según necesidad</option>
                    </select>
                  </div>
                  <div class="form-row">
                    <label>Instrucciones especiales:</label>
                    <textarea 
                      v-model="nuevoMedicamento.instrucciones" 
                      placeholder="Instrucciones especiales para la administración..."
                      rows="2"
                    ></textarea>
                  </div>
                  <div class="form-row">
                    <label>Asignar a paciente(s) (obligatorio):</label>
                    <multiselect
                      v-model="pacientesParaNuevoMedicamento"
                      :options="pacientes"
                      :multiple="true"
                      :close-on-select="false"
                      :clear-on-select="false"
                      :preserve-search="true"
                      :custom-label="customLabelPaciente"
                      placeholder="Buscar y seleccionar pacientes..."
                      label="nombre"
                      track-by="id"
                      :max-height="250"
                    />
                    <span v-if="pacienteError" class="error-msg">Debes seleccionar al menos un paciente.</span>
                  </div>
                  <button type="submit" class="btn-agregar-medicamento">➕ Agregar Medicamento</button>
                </form>
              </div>

              <!-- Lista de medicamentos -->
              <div class="lista-medicamentos">
                <h3>Medicamentos Disponibles</h3>
                <div v-if="cargandoMedicamentos" class="cargando">
                  <p>Cargando medicamentos...</p>
                </div>
                <div v-else-if="medicamentos.length === 0" class="no-medicamentos">
                  <p>No hay medicamentos registrados</p>
                </div>
                <div v-else class="medicamentos-grid medicamentos-scroll">
                  <div v-for="medicamento in medicamentos" :key="medicamento.id" class="medicamento-card">
                    <div class="medicamento-header">
                      <h4>{{ medicamento.nombre }}</h4>
                      <button 
                        @click="eliminarMedicamento(medicamento.id)" 
                        class="btn-eliminar-medicamento"
                        title="Eliminar medicamento"
                      >
                        🗑️
                      </button>
                    </div>
                    <div class="medicamento-info">
                      <p v-if="medicamento.descripcion"><strong>Descripción:</strong> {{ medicamento.descripcion }}</p>
                      <p v-if="medicamento.dosisRecomendada"><strong>Dosis:</strong> {{ medicamento.dosisRecomendada }} mg</p>
                      <p v-if="medicamento.frecuencia"><strong>Frecuencia:</strong> {{ medicamento.frecuencia }}</p>
                      <p v-if="medicamento.instrucciones"><strong>Instrucciones:</strong> {{ medicamento.instrucciones }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <!-- Tabla de pacientes al final -->
        <section class="tabla-pacientes card">
          <h2>📋 Reportes de Pacientes</h2>
          <input v-model="busquedaPaciente" placeholder="Buscar paciente por nombre, apellido o email..." class="input-busqueda-paciente" />
          <!-- Tabla solo en desktop -->
          <table class="tabla-pacientes-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>DNI</th>
                <th>Email</th>
                <th>Enfermera(s) asignada(s)</th>
                <th>Recetas médicas</th>
                <th>Reporte</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pac in pacientesFiltrados" :key="pac.id">
                <td>{{ pac.nombre }} {{ pac.apellido }}</td>
                <td>{{ pac.dni }}</td>
                <td>{{ pac.email }}</td>
                <td>
                  <span v-if="pac.enfermeras && pac.enfermeras.length">
                    <span v-for="(enf, idx) in pac.enfermeras" :key="enf.id">
                      {{ enf.nombre }} {{ enf.apellido }}<span v-if="idx < pac.enfermeras.length - 1">, </span>
                    </span>
                  </span>
                  <span v-else style="color:#888;">Sin enfermera asignada</span>
                </td>
                <td>
                  <div class="recetas-container">
                    <div v-if="pac.recetasMedicas && pac.recetasMedicas.length > 0">
                      <!-- Botón para abrir modal de recetas -->
                      <button class="btn-ver-recetas" @click="abrirModalRecetas(pac)">
                        <span class="recetas-contador">{{ pac.recetasMedicas.length }} receta{{ pac.recetasMedicas.length > 1 ? 's' : '' }}</span>
                        <span class="icono-ver">👁️</span>
                      </button>
                    </div>
                    <div v-else class="sin-recetas">Sin recetas médicas</div>
                  </div>
                </td>
                <td>
                  <button @click="descargarReportePaciente(pac)" class="btn-reporte-paciente">
                    <span class="icono-reporte">📄</span> Reporte
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <!-- Cards solo en mobile -->
          <div class="paciente-card-mobile" v-for="pac in pacientesFiltrados" :key="pac.id">
            <div><strong>Nombre:</strong> {{ pac.nombre }} {{ pac.apellido }}</div>
            <div><strong>Email:</strong> {{ pac.email }}</div>
            <div><strong>Año de nacimiento:</strong> {{ pac.anioNacimiento || (pac.fechaNacimiento ? pac.fechaNacimiento.slice(0,4) : '') }}</div>
            <div><strong>Enfermera(s):</strong>
              <span v-if="pac.enfermeras && pac.enfermeras.length">
                <span v-for="(enf, idx) in pac.enfermeras" :key="enf.id">
                  {{ enf.nombre }}<span v-if="idx < pac.enfermeras.length - 1">, </span>
                </span>
              </span>
              <span v-else>Sin enfermera asignada</span>
            </div>
            <button @click="descargarReportePaciente(pac)" class="btn-reporte-paciente" style="margin-top:8px;">
              <span class="icono-reporte">📄</span> Reporte
            </button>
          </div>
        </section>
      </section>

      <!-- Sección Enfermeras -->
      <section v-if="seccionActiva === 'enfermeras'">
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
              <multiselect
                v-model="enfermeraSeleccionada"
                :options="enfermeras"
                :custom-label="customLabelEnfermera"
                placeholder="Buscar enfermera por nombre, apellido o DNI..."
                label="nombre"
                track-by="id"
                :searchable="true"
                :close-on-select="true"
                :allow-empty="true"
                id="enfermeraSelect"
              />
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
        <!-- Tabla de enfermeras al final -->
        <section class="tabla-enfermeras card">
          <h2>👩‍⚕️ Enfermeras Registradas</h2>
          <table class="tabla-enfermeras-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Email</th>
                <th>DNI</th>
                <th>Año de nacimiento</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="enf in enfermeras" :key="enf.id">
                <td>{{ enf.nombre }}</td>
                <td>{{ enf.apellido }}</td>
                <td>{{ enf.email }}</td>
                <td>{{ enf.dni }}</td>
                <td>{{ enf.anioNacimiento || (enf.fechaNacimiento ? enf.fechaNacimiento.slice(0,4) : '') }}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </section>

      <!-- Sección Solicitudes de DNI -->
      <section v-if="seccionActiva === 'solicitudesDNI'">
        <div class="card">
          <h2>📝 Solicitudes de Cambio de DNI</h2>
          
          <div v-if="cargandoSolicitudesDNI" class="cargando">
            <p>Cargando solicitudes...</p>
          </div>
          
          <div v-else-if="solicitudesDNI.length === 0" class="no-solicitudes">
            <p>No hay solicitudes de cambio de DNI pendientes</p>
          </div>
          
          <div v-else class="solicitudes-dni-lista">
            <div v-for="solicitud in solicitudesDNI" :key="solicitud.id" class="solicitud-dni-item">
              <div class="solicitud-dni-info">
                <h3>{{ solicitud.nombre }} {{ solicitud.apellido }}</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Rol:</label>
                    <span>{{ solicitud.rol }}</span>
                  </div>
                  <div class="info-item">
                    <label>Email:</label>
                    <span>{{ solicitud.email }}</span>
                  </div>
                  <div class="info-item">
                    <label>DNI Actual:</label>
                    <span>{{ solicitud.dniActual }}</span>
                  </div>
                  <div class="info-item">
                    <label>Nuevo DNI:</label>
                    <span>{{ solicitud.nuevoDNI }}</span>
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
                
                <div class="motivo-solicitud">
                  <label>Motivo del cambio:</label>
                  <p>{{ solicitud.motivo }}</p>
                </div>
              </div>
              
              <div v-if="solicitud.estado === 'pendiente'" class="acciones-dni">
                <div class="accion-grupo">
                  <label for="mensaje-dni">Mensaje (opcional):</label>
                  <textarea 
                    v-model="mensajesDNI[solicitud.id]" 
                    id="mensaje-dni"
                    placeholder="Mensaje personalizado para el usuario..."
                    rows="2"
                  ></textarea>
                </div>
                
                <div class="botones-accion">
                  <button 
                    @click="aprobarCambioDNI(solicitud.id, mensajesDNI[solicitud.id])"
                    :disabled="procesandoDNI[solicitud.id]"
                    class="btn-aprobar"
                  >
                    {{ procesandoDNI[solicitud.id] ? 'Aprobando...' : '✅ Aprobar Cambio' }}
                  </button>
                  
                  <button 
                    @click="rechazarCambioDNI(solicitud.id, mensajesDNI[solicitud.id])"
                    :disabled="procesandoDNI[solicitud.id]"
                    class="btn-rechazar"
                  >
                    {{ procesandoDNI[solicitud.id] ? 'Rechazando...' : '❌ Rechazar' }}
                  </button>
                </div>
              </div>
              
              <div v-else-if="solicitud.estado === 'aprobado'" class="estado-finalizado">
                <p class="aprobado">✅ Cambio aprobado el {{ formatearFecha(solicitud.fechaAprobacion) }}</p>
                <p v-if="solicitud.mensaje" class="mensaje-admin">Mensaje: {{ solicitud.mensaje }}</p>
              </div>
              
              <div v-else-if="solicitud.estado === 'rechazado'" class="estado-finalizado">
                <p class="rechazado">❌ Cambio rechazado el {{ formatearFecha(solicitud.fechaRechazo) }}</p>
                <p v-if="solicitud.motivoRechazo" class="mensaje-admin">Motivo: {{ solicitud.motivoRechazo }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Modal de asignación de medicamento a paciente -->
      <div v-if="mostrarModalAsignar" class="modal-asignar-overlay">
        <div class="modal-asignar">
          <h3>Asignar medicamento a paciente</h3>
          <p><strong>Medicamento:</strong> {{ medicamentoAAsignar?.nombre }}</p>
          <label>Selecciona paciente(s):</label>
          <multiselect
            v-model="pacientesSeleccionados"
            :options="pacientes"
            :multiple="true"
            :close-on-select="false"
            :clear-on-select="false"
            :preserve-search="true"
            :custom-label="customLabelPaciente"
            placeholder="Buscar y seleccionar pacientes..."
            label="nombre"
            track-by="id"
            :max-height="250"
          />
          <div class="modal-asignar-actions">
            <button @click="asignarMedicamentoAPacientes" class="btn-confirmar-asignacion">Asignar</button>
            <button @click="cerrarModalAsignar" class="btn-cancelar-asignacion">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
    <!-- Modal de recetas médicas -->
    <div v-if="mostrarModalRecetas" class="modal-recetas-overlay" @click="cerrarModalRecetas">
      <div class="modal-recetas" @click.stop>
        <div class="modal-recetas-header">
          <h3>📋 Recetas Médicas - {{ pacienteSeleccionado?.nombre }} {{ pacienteSeleccionado?.apellido }}</h3>
          <button @click="cerrarModalRecetas" class="btn-cerrar-modal">✕</button>
        </div>
        
        <div class="modal-recetas-content">
          <div v-if="recetasPorFecha.length === 0" class="sin-recetas-modal">
            <p>No hay recetas médicas registradas</p>
          </div>
          
          <div v-else class="recetas-por-fecha">
            <div v-for="grupo in recetasPorFecha" :key="grupo.fecha" class="grupo-fecha">
              <h4 class="fecha-grupo">{{ grupo.fechaFormateada }}</h4>
              <div class="recetas-del-dia">
                <div v-for="receta in grupo.recetas" :key="receta.id + receta.fechaAsignacion" class="receta-modal-item">
                  <div class="receta-modal-header">
                    <strong class="receta-nombre">{{ receta.nombre }}</strong>
                    <span class="receta-hora">{{ formatearHora(receta.fechaAsignacion) }}</span>
                  </div>
                  <div class="receta-modal-info">
                    <span v-if="receta.dosisRecomendada" class="receta-dosis-modal">{{ receta.dosisRecomendada }} mg</span>
                    <span v-if="receta.frecuencia" class="receta-frecuencia-modal">{{ receta.frecuencia }}</span>
                    <span v-if="receta.instrucciones" class="receta-instrucciones-modal">{{ receta.instrucciones }}</span>
                  </div>
                  <div v-if="receta.diagnosticos && receta.diagnosticos.length > 0" class="receta-diagnosticos">
                    <strong>Diagnósticos:</strong>
                    <span v-for="(diag, idx) in receta.diagnosticos" :key="idx" class="diagnostico-tag">
                      {{ diag }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sección Configuración -->
    <section v-if="seccionActiva === 'configuracion'">
      <div class="card">
        <h2>⚙️ Configuración del Médico</h2>
        
        <!-- Configuración de Datos Personales -->
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
                  :value="admin.dni" 
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
        
        <!-- Configuración de Firma Digital -->
        <div class="configuracion-firma">
          <h3>🖊️ Firma Digital</h3>
          <p>Configura tu firma digital para validar las recetas médicas.</p>
          
          <div class="firma-status">
            <div class="firma-info">
              <span v-if="firmaGuardada || tieneFirmaMedico" class="firma-existe">
                ✅ Firma configurada
              </span>
              <span v-else class="firma-no-existe">
                ❌ Sin firma configurada
              </span>
            </div>
            
            <div class="firma-actions">
              <button @click="abrirModalFirma" class="btn-configurar-firma">
                {{ (firmaGuardada || tieneFirmaMedico) ? '✏️ Cambiar Firma' : '🖊️ Configurar Firma' }}
              </button>
              
              <button v-if="firmaGuardada || tieneFirmaMedico" @click="eliminarFirma" class="btn-eliminar-firma">
                🗑️ Eliminar Firma
              </button>
            </div>
          </div>
          
          <div v-if="firmaGuardada || tieneFirmaMedico" class="firma-preview">
            <h4>Vista previa de la firma:</h4>
            <div class="firma-preview-container">
              <img :src="firmaGuardada || firmaLocalStorage" alt="Firma del médico" class="firma-preview-img" />
            </div>
          </div>
        </div>
      </div>
    </section>

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
              <input :value="admin.dni" type="text" disabled class="dni-actual" />
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

    <!-- Modal de firma digital -->
    <SignatureCanvas 
      :mostrar="mostrarModalFirma"
      @cerrar="cerrarModalFirma"
      @firma-guardada="onFirmaGuardada"
    />

    <!-- Render oculto del gráfico para PDF -->
    <div ref="graficoPDF" style="position: absolute; left: -9999px; top: 0;">
      <SignosVitalesCharts
        v-if="pacienteParaReporte && pacienteParaReporte.signosVitales && pacienteParaReporte.signosVitales.length"
        :signosVitales="pacienteParaReporte.signosVitales"
        :titulo="'Signos Vitales de ' + pacienteParaReporte.nombre"
      />
    </div>
  </div>
</template>

<script>
import { db } from "@/firebase";
import { collection, getDocs, query, orderBy, doc, updateDoc, addDoc, where } from "firebase/firestore";
import { approveNurseAccount, rejectNurseAccount } from "@/services/nurseValidationService";
import { getMedicamentos, addMedicamento, deleteMedicamento } from "@/services/medicamentoService";
import Multiselect from 'vue-multiselect';
import 'vue-multiselect/dist/vue-multiselect.min.css';
import { generarPDFSignosYMedicaciones } from '../utils/helpers';
import SignosVitalesCharts from "@/components/commons/SignosVitalesCharts.vue";
import DiagnosticoSelector from './commons/DiagnosticoSelector.vue';
import SignatureCanvas from './commons/SignatureCanvas.vue';

export default {
  name: "AdminPanel",
  components: {
    Multiselect,
    SignosVitalesCharts,
    DiagnosticoSelector,
    SignatureCanvas
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
      pacientes: [],
      cargandoAsignacion: true,
      enfermeraSeleccionada: null,
      pacientesAsignadosTemp: [],
      asignacionGuardada: false,
      busquedaPaciente: '',
      pacienteParaReporte: null,
      // Variables para gestión de medicamentos
      medicamentos: [],
      cargandoMedicamentos: true,
      nuevoMedicamento: {
        nombre: '',
        descripcion: '',
        dosisRecomendada: '',
        frecuencia: '',
        instrucciones: ''
      },
      mostrarModalAsignar: false,
      medicamentoAAsignar: null,
      pacientesSeleccionados: [],
      pacientesParaNuevoMedicamento: [],
      sugerenciasCIMA: [],
      seccionActiva: 'pacientes',
      tabs: [
        { id: 'pacientes', label: 'Pacientes' },
        { id: 'enfermeras', label: 'Enfermeras' },
        { id: 'solicitudesDNI', label: 'Solicitudes DNI' },
        { id: 'configuracion', label: 'Configuración' }
      ],
      nuevoDiagnostico: [],
      diagnosticoError: false,
      pacienteError: false,
      recetasExpandidas: {},
      // Variables para modal de recetas
      mostrarModalRecetas: false,
      pacienteSeleccionado: null,
      recetasPorFecha: [],
      // Variables para firma digital
      mostrarModalFirma: false,
      firmaGuardada: null,
      // Variables para configuración
      datosEditables: {
        nombre: '',
        apellido: '',
        email: ''
      },
      mostrarModalDNI: false,
      solicitudDNI: {
        nuevoDNI: '',
        motivo: ''
      },
      // Variables para solicitudes de DNI
      solicitudesDNI: [],
      cargandoSolicitudesDNI: false,
      mensajesDNI: {},
      procesandoDNI: {},
      mensajeBanner: '',
      mensajeTipo: 'info'
    };
  },
  computed: {
    // enfermeraSeleccionada ahora es el objeto seleccionado directamente
    pacientesFiltrados() {
      if (!this.pacientes || !this.busquedaPaciente) return this.pacientes;
      const q = this.busquedaPaciente.toLowerCase();
      return this.pacientes.filter(pac =>
        pac.nombre.toLowerCase().includes(q) ||
        pac.apellido.toLowerCase().includes(q) ||
        (pac.email && pac.email.toLowerCase().includes(q))
      );
    },
    tieneFirmaMedico() {
      return !!this.firmaLocalStorage;
    },
    firmaLocalStorage() {
      try {
        return localStorage.getItem('medicoFirma');
      } catch (e) {
        return null;
      }
    }
  },
  watch: {
    enfermeraSeleccionada(newEnf) {
      this.pacientesAsignadosTemp = newEnf && newEnf.pacientesAsignados
        ? this.pacientes.filter(p => newEnf.pacientesAsignados.includes(p.id))
        : [];
      this.asignacionGuardada = false;
    },
    seccionActiva(nuevaSeccion) {
      if (nuevaSeccion === 'configuracion') {
        this.cargarDatosEditables();
      } else if (nuevaSeccion === 'solicitudesDNI') {
        this.cargarSolicitudesDNI();
      }
    },
    pacientesParaNuevoMedicamento(nuevosPacientes) {
      // Limpiar error de paciente cuando se selecciona uno
      if (nuevosPacientes && nuevosPacientes.length > 0) {
        this.pacienteError = false;
      }
    }
  },
  async mounted() {
    try {
      // Verificar que el usuario sea administrador
      const usuarioData = localStorage.getItem('usuario');
      
      if (usuarioData) {
        const usuario = JSON.parse(usuarioData);
        if (usuario.rol === 'admin') {
          // Busca el documento en Firestore para obtener el id
          const q = query(collection(db, "admins"), where("email", "==", usuario.email));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0];
            this.admin = { id: docSnap.id, ...docSnap.data() };
          } else {
            this.admin = usuario;
          }
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
      await this.cargarMedicamentos();
      // Log para depuración de recetas médicas
      console.log('Pacientes cargados:', this.pacientes);

      if (this.admin && this.admin.firmaId) {
        await this.cargarFirmaAdmin(this.admin.firmaId);
      }
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
        this.pacientes = pacientesSnap.docs.map(doc => {
          const data = { id: doc.id, ...doc.data() };
          // Si no tiene recetasMedicas, inicializarlo en Firestore y local
          if (!('recetasMedicas' in data)) {
            data.recetasMedicas = [];
            const pacienteRef = doc.ref;
            updateDoc(pacienteRef, { recetasMedicas: [] });
          }
          return data;
        });
      } catch (e) {
        alert("Error al cargar enfermeras o pacientes");
      } finally {
        this.cargandoAsignacion = false;
      }
    },
    async guardarAsignacion() {
      if (!this.enfermeraSeleccionada) return;
      try {
        // Actualizar la enfermera con los pacientes asignados
        const enfRef = doc(db, 'enfermeras', this.enfermeraSeleccionada.id);
        const pacientesIds = this.pacientesAsignadosTemp.map(p => p.id);
        await updateDoc(enfRef, { pacientesAsignados: pacientesIds });

        // Obtener pacientes que estaban previamente asignados a la enfermera
        const enfermeraObj = this.enfermeras.find(e => e.id === this.enfermeraSeleccionada.id);
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
          let nuevasEnfermeras = Array.isArray(paciente?.enfermeras) ? paciente.enfermeras.filter(e => e.id !== this.enfermeraSeleccionada.id) : [];
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
            console.log('Asignando enfermera:', enfermeraObj);
            nuevasEnfermeras.push({
              id: enfermeraObj.id,
              nombre: enfermeraObj.nombre,
              apellido: enfermeraObj.apellido,
              dni: enfermeraObj.dni
            });
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
    customLabelEnfermera(enf) {
      if (!enf) return '';
      return `${enf.nombre} ${enf.apellido} (DNI: ${enf.dni})`;
    },
    async descargarReportePaciente(paciente) {
      this.pacienteParaReporte = paciente;
      await this.$nextTick();
      setTimeout(async () => {
        const graficoDiv = this.$refs.graficoPDF;
        const chartCanvas = graficoDiv ? graficoDiv.querySelector('canvas') : null;
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
          this.pacienteParaReporte = null;
        }, 100);
      }, 800);
    },

    // Métodos para gestión de medicamentos
    async cargarMedicamentos() {
      try {
        this.cargandoMedicamentos = true;
        const medicamentos = await getMedicamentos();
        const hoy = new Date();
        let medicamentosVigentes = [];
        for (const med of medicamentos) {
          const fecha = new Date(med.fechaCreacion);
          const diffDias = (hoy - fecha) / (1000 * 60 * 60 * 24);
          if (diffDias > 1) {
            // Eliminar de Firestore y mover a recetasMedicas de los pacientes asignados
            await this.archivarMedicamentoComoReceta(med);
            await deleteMedicamento(med.id);
          } else {
            medicamentosVigentes.push(med);
          }
        }
        this.medicamentos = medicamentosVigentes;
      } catch (e) {
        console.error("Error al cargar medicamentos:", e);
        alert("Error al cargar los medicamentos");
      } finally {
        this.cargandoMedicamentos = false;
      }
    },

    async archivarMedicamentoComoReceta(medicamento) {
      // Buscar todos los pacientes a los que se asignó este medicamento
      for (const paciente of this.pacientes) {
        const actuales = Array.isArray(paciente.medicamentosIndicados) ? paciente.medicamentosIndicados : [];
        const fueAsignado = actuales.find(m => m.id === medicamento.id);
        if (fueAsignado) {
          // Quitar de medicamentosIndicados y agregar a recetasMedicas
          const nuevosIndicados = actuales.filter(m => m.id !== medicamento.id);
          const recetas = Array.isArray(paciente.recetasMedicas) ? paciente.recetasMedicas : [];
          const receta = {
            ...fueAsignado,
            fechaArchivado: new Date().toISOString()
          };
          const nuevasRecetas = [...recetas, receta];
          const pacienteRef = doc(db, 'pacientes', paciente.id);
          await updateDoc(pacienteRef, {
            medicamentosIndicados: nuevosIndicados,
            recetasMedicas: nuevasRecetas
          });
          // Actualizar local
          paciente.medicamentosIndicados = nuevosIndicados;
          paciente.recetasMedicas = nuevasRecetas;
        }
      }
    },

    async agregarMedicamento() {
      this.diagnosticoError = false;
      this.pacienteError = false;
      
      if (!this.nuevoDiagnostico.length) {
        this.diagnosticoError = true;
        return;
      }
      
      // Validar que el nombre no esté vacío
      if (!this.nuevoMedicamento.nombre.trim()) {
        alert("El nombre del medicamento es obligatorio");
        return;
      }

      // Validar que se haya seleccionado al menos un paciente
      if (!this.pacientesParaNuevoMedicamento || this.pacientesParaNuevoMedicamento.length === 0) {
        this.pacienteError = true;
        return;
      }
      
      try {

        // Agregar el medicamento a Firestore
        const medicamentoData = {
          nombre: this.nuevoMedicamento.nombre.trim(),
          descripcion: this.nuevoMedicamento.descripcion.trim(),
          dosisRecomendada: this.nuevoMedicamento.dosisRecomendada ? parseInt(this.nuevoMedicamento.dosisRecomendada) : null,
          frecuencia: this.nuevoMedicamento.frecuencia,
          instrucciones: this.nuevoMedicamento.instrucciones.trim(),
          fechaCreacion: new Date().toISOString(),
          creadoPor: this.admin.nombre || 'Administrador'
        };

        const nuevoMedicamento = await addMedicamento(medicamentoData);
        
        // Agregar a la lista local
        this.medicamentos.push(nuevoMedicamento);

        // Asignar a pacientes si hay seleccionados
        if (this.pacientesParaNuevoMedicamento.length > 0) {
          const fechaAsignacion = new Date().toISOString();
          for (const paciente of this.pacientesParaNuevoMedicamento) {
            const pacienteRef = doc(db, 'pacientes', paciente.id);
            const actuales = Array.isArray(paciente.medicamentosIndicados) ? paciente.medicamentosIndicados : [];
            const objAsignado = {
              id: nuevoMedicamento.id,
              nombre: nuevoMedicamento.nombre,
              descripcion: nuevoMedicamento.descripcion,
              dosisRecomendada: nuevoMedicamento.dosisRecomendada,
              frecuencia: nuevoMedicamento.frecuencia,
              instrucciones: nuevoMedicamento.instrucciones,
              fechaAsignacion,
              adminEmail: this.admin.email, // Agregar el email del admin que asigna la receta
              diagnostico: this.nuevoDiagnostico // Agregar el diagnóstico específico de esta receta
            };
            const nuevos = [...actuales.filter(m => m.id !== nuevoMedicamento.id), objAsignado];
            const recetas = Array.isArray(paciente.recetasMedicas) ? paciente.recetasMedicas : [];
            const yaExiste = recetas.some(r => r.id === nuevoMedicamento.id && r.fechaAsignacion === objAsignado.fechaAsignacion);
            const nuevasRecetas = yaExiste ? recetas : [...recetas, objAsignado];
            
            await updateDoc(pacienteRef, {
              medicamentosIndicados: nuevos,
              recetasMedicas: nuevasRecetas
            });
          }
        }

        // Limpiar el formulario
        this.nuevoMedicamento = {
          nombre: '',
          descripcion: '',
          dosisRecomendada: '',
          frecuencia: '',
          instrucciones: ''
        };
        this.pacientesParaNuevoMedicamento = [];
        this.nuevoDiagnostico = []; // Limpiar diagnóstico

        await this.cargarEnfermerasYPacientes();
      } catch (e) {
        console.error("Error al agregar medicamento:", e);
        alert("Error al agregar el medicamento");
      }
    },

    async eliminarMedicamento(medicamentoId) {
      if (!confirm("¿Estás seguro de que quieres eliminar este medicamento?")) {
        return;
      }

      try {
        // Eliminar de Firestore
        await deleteMedicamento(medicamentoId);
        
        // Eliminar de la lista local
        this.medicamentos = this.medicamentos.filter(m => m.id !== medicamentoId);
        
        alert("Medicamento eliminado exitosamente");
      } catch (e) {
        console.error("Error al eliminar medicamento:", e);
        alert("Error al eliminar el medicamento");
      }
    },

    abrirModalAsignar(medicamento) {
      this.medicamentoAAsignar = medicamento;
      this.pacientesSeleccionados = []; // Limpiar selección
      this.mostrarModalAsignar = true;
    },

    cerrarModalAsignar() {
      this.mostrarModalAsignar = false;
      this.medicamentoAAsignar = null;
      this.pacientesSeleccionados = [];
    },

    async asignarMedicamentoAPacientes() {
      if (!this.medicamentoAAsignar || this.pacientesParaNuevoMedicamento.length === 0) {
        alert("Por favor, selecciona un medicamento y al menos un paciente.");
        return;
      }

      try {
        const medicamento = this.medicamentoAAsignar;
        const fechaAsignacion = new Date().toISOString();
        for (const paciente of this.pacientesParaNuevoMedicamento) {
          const pacienteRef = doc(db, 'pacientes', paciente.id);
          // --- medicamentosIndicados ---
          const actuales = Array.isArray(paciente.medicamentosIndicados) ? paciente.medicamentosIndicados : [];
          const objAsignado = {
            id: medicamento.id,
            nombre: medicamento.nombre,
            descripcion: medicamento.descripcion,
            dosisRecomendada: medicamento.dosisRecomendada,
            frecuencia: medicamento.frecuencia,
            instrucciones: medicamento.instrucciones,
            fechaAsignacion,
            adminEmail: this.admin.email, // Agregar el email del admin que asigna la receta
            diagnostico: this.nuevoDiagnostico // Agregar el diagnóstico específico de esta receta
          };
          const nuevos = [...actuales.filter(m => m.id !== medicamento.id), objAsignado];
          // --- recetasMedicas ---
          const recetas = Array.isArray(paciente.recetasMedicas) ? paciente.recetasMedicas : [];
          // Evitar duplicados por id y fecha
          const yaExiste = recetas.some(r => r.id === medicamento.id && r.fechaAsignacion === objAsignado.fechaAsignacion);
          const nuevasRecetas = yaExiste ? recetas : [...recetas, objAsignado];
          await updateDoc(pacienteRef, {
            medicamentosIndicados: nuevos,
            recetasMedicas: nuevasRecetas
          });
          paciente.medicamentosIndicados = nuevos;
          paciente.recetasMedicas = nuevasRecetas;
        }
        alert("Medicamento asignado a pacientes exitosamente.");
        this.cerrarModalAsignar();
      } catch (e) {
        console.error("Error al asignar medicamento a pacientes:", e);
        alert("Error al asignar el medicamento a los pacientes.");
      }
    },
    async buscarMedicamentosCIMA() {
      if (!this.nuevoMedicamento.nombre || this.nuevoMedicamento.nombre.length < 3) {
        this.sugerenciasCIMA = [];
        return;
      }
      const query = encodeURIComponent(this.nuevoMedicamento.nombre);
      const url = `https://cima.aemps.es/cima/rest/medicamentos?nombre=${query}`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        this.sugerenciasCIMA = Array.from(new Set((data.resultados || []).map(m => m.nombre))).slice(0, 10);
      } catch (e) {
        this.sugerenciasCIMA = [];
        console.error('Error buscando medicamentos CIMA:', e);
      }
    },
    seleccionarSugerenciaCIMA(nombre) {
      this.nuevoMedicamento.nombre = nombre;
      this.sugerenciasCIMA = [];
    },
    
    toggleRecetas(pacienteId) {
      this.$set(this.recetasExpandidas, pacienteId, !this.recetasExpandidas[pacienteId]);
    },
    
    abrirModalRecetas(paciente) {
      this.pacienteSeleccionado = paciente;
      this.organizarRecetasPorFecha(paciente.recetasMedicas || []);
      this.mostrarModalRecetas = true;
    },
    
    cerrarModalRecetas() {
      this.mostrarModalRecetas = false;
      this.pacienteSeleccionado = null;
      this.recetasPorFecha = [];
    },
    
    organizarRecetasPorFecha(recetas) {
      const grupos = {};
      
      recetas.forEach(receta => {
        const fecha = new Date(receta.fechaAsignacion);
        const fechaKey = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
        
        if (!grupos[fechaKey]) {
          grupos[fechaKey] = {
            fecha: fechaKey,
            fechaFormateada: fecha.toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            recetas: []
          };
        }
        
        grupos[fechaKey].recetas.push(receta);
      });
      
      // Ordenar por fecha (más reciente primero) y dentro de cada fecha por hora
      this.recetasPorFecha = Object.values(grupos)
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .map(grupo => ({
          ...grupo,
          recetas: grupo.recetas.sort((a, b) => 
            new Date(b.fechaAsignacion) - new Date(a.fechaAsignacion)
          )
        }));
    },
    
    formatearHora(fechaString) {
      if (!fechaString) return '';
      const fecha = new Date(fechaString);
      return fecha.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    // Métodos para firma digital
    abrirModalFirma() {
      this.mostrarModalFirma = true;
    },
    
    cerrarModalFirma() {
      this.mostrarModalFirma = false;
    },
    
    async onFirmaGuardada(firmaDataURL) {
      try {
        const adminId = this.admin.id;
        if (!adminId) {
          this.setMensaje('No se encontró el ID del admin. Vuelve a iniciar sesión.', 'error');
          return;
        }
        const API_FIRMAS = process.env.VUE_APP_API_FIRMAS || '/api/firmas';
        const res = await fetch(API_FIRMAS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imagen: firmaDataURL })
        });
        if (!res.ok) throw new Error('Error al guardar firma en backend');
        const { id: firmaId } = await res.json();
        await updateDoc(doc(db, "admins", adminId), { firmaId });
        await this.cargarFirmaAdmin(firmaId);
        this.mostrarModalFirma = false;
        this.setMensaje('✅ Firma guardada correctamente', 'exito');
      } catch (error) {
        this.setMensaje('❌ Error al guardar la firma', 'error');
        console.error('Error al guardar firma:', error);
      }
    },
    async cargarFirmaAdmin(firmaId) {
      if (!firmaId) {
        this.firmaGuardada = null;
        return;
      }
              const API_FIRMAS = process.env.VUE_APP_API_FIRMAS || '/api/firmas';
      const res = await fetch(`${API_FIRMAS}/${firmaId}`);
      if (res.ok) {
        const { imagen } = await res.json();
        this.firmaGuardada = imagen;
      } else {
        this.firmaGuardada = null;
      }
    },
    
    eliminarFirma() {
      if (confirm('¿Estás seguro de que quieres eliminar tu firma digital?')) {
        this.firmaGuardada = null;
        localStorage.removeItem('medicoFirma');
        this.setMensaje('Firma eliminada', 'info');
      }
    },

    // Métodos para configuración
    cargarDatosEditables() {
      this.datosEditables = {
        nombre: this.admin.nombre || '',
        apellido: this.admin.apellido || '',
        email: this.admin.email || ''
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
        this.admin = usuarioActualizado;
        
        // Actualizar en Firestore
        const adminsRef = collection(db, "admins");
        const querySnapshot = await getDocs(adminsRef);
        const adminDoc = querySnapshot.docs.find(doc => doc.data().dni === this.admin.dni);
        
        if (adminDoc) {
          await updateDoc(doc(db, "admins", adminDoc.id), {
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
        if (this.solicitudDNI.nuevoDNI === this.admin.dni) {
          alert('❌ El nuevo DNI no puede ser igual al actual');
          return;
        }

        // Crear solicitud en Firestore
        await addDoc(collection(db, "solicitudesDNI"), {
          dniActual: this.admin.dni,
          nuevoDNI: this.solicitudDNI.nuevoDNI,
          motivo: this.solicitudDNI.motivo,
          usuarioId: this.admin.id || this.admin.dni,
          rol: 'admin',
          nombre: this.admin.nombre,
          apellido: this.admin.apellido,
          email: this.admin.email,
          fechaSolicitud: new Date().toISOString(),
          estado: 'pendiente'
        });

        alert('✅ Solicitud de cambio de DNI enviada correctamente. Será revisada por el administrador.');
        this.cerrarModalDNI();
      } catch (error) {
        console.error('Error al enviar solicitud de DNI:', error);
        alert('❌ Error al enviar la solicitud de cambio de DNI');
      }
    },

    // Métodos para gestión de solicitudes de DNI
    async cargarSolicitudesDNI() {
      try {
        this.cargandoSolicitudesDNI = true;
        const q = query(
          collection(db, "solicitudesDNI"),
          orderBy("fechaSolicitud", "desc")
        );
        const querySnapshot = await getDocs(q);
        this.solicitudesDNI = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error('Error al cargar solicitudes de DNI:', error);
        alert('Error al cargar las solicitudes de DNI');
      } finally {
        this.cargandoSolicitudesDNI = false;
      }
    },

    async aprobarCambioDNI(solicitudId, mensaje = '') {
      this.procesandoDNI[solicitudId] = true;
      try {
        const solicitud = this.solicitudesDNI.find(s => s.id === solicitudId);
        if (!solicitud) {
          alert('Solicitud no encontrada');
          return;
        }

        // Actualizar la solicitud en Firestore
        const solicitudRef = doc(db, "solicitudesDNI", solicitudId);
        await updateDoc(solicitudRef, {
          estado: 'aprobado',
          fechaAprobacion: new Date().toISOString(),
          mensaje: mensaje
        });

        // Actualizar el DNI del usuario en su colección correspondiente
        const coleccion = solicitud.rol === 'paciente' ? 'pacientes' : 
                         solicitud.rol === 'enfermera' ? 'enfermeras' : 'admins';
        
        const usuariosRef = collection(db, coleccion);
        const querySnapshot = await getDocs(usuariosRef);
        const usuarioDoc = querySnapshot.docs.find(doc => doc.data().dni === solicitud.dniActual);
        
        if (usuarioDoc) {
          await updateDoc(doc(db, coleccion, usuarioDoc.id), {
            dni: solicitud.nuevoDNI
          });
        }

        alert('✅ Cambio de DNI aprobado correctamente');
        await this.cargarSolicitudesDNI(); // Recargar la lista
      } catch (error) {
        console.error('Error al aprobar cambio de DNI:', error);
        alert('Error al aprobar el cambio de DNI');
      } finally {
        this.procesandoDNI[solicitudId] = false;
      }
    },

    async rechazarCambioDNI(solicitudId, motivo = '') {
      this.procesandoDNI[solicitudId] = true;
      try {
        // Actualizar la solicitud en Firestore
        const solicitudRef = doc(db, "solicitudesDNI", solicitudId);
        await updateDoc(solicitudRef, {
          estado: 'rechazado',
          fechaRechazo: new Date().toISOString(),
          motivoRechazo: motivo
        });

        alert('✅ Solicitud de cambio de DNI rechazada');
        await this.cargarSolicitudesDNI(); // Recargar la lista
      } catch (error) {
        console.error('Error al rechazar cambio de DNI:', error);
        alert('Error al rechazar la solicitud de cambio de DNI');
      } finally {
        this.procesandoDNI[solicitudId] = false;
      }
    },
    setMensaje(mensaje, tipo = 'info', duracion = 3500) {
      this.mensajeBanner = mensaje;
      this.mensajeTipo = tipo;
      if (duracion > 0) {
        setTimeout(() => { this.mensajeBanner = ''; }, duracion);
      }
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
  min-height: 60px;
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
  flex-shrink: 0;
}

.nombre-usuario {
  font-weight: bold;
  color: #333;
  white-space: nowrap;
  display: flex;
  align-items: center;
  height: 100%;
  margin-top: 17px;
}

.btn-logout {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
  display: flex;
  align-items: center;
  height: fit-content;
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
.tabla-pacientes.card {
  overflow-x: auto;
}
.tabla-pacientes-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border-radius: 8px;
  overflow: hidden;
}
.tabla-pacientes-table th, .tabla-pacientes-table td {
  border: 1px solid #e0e0e0;
  padding: 14px 12px;
  text-align: left;
  vertical-align: middle;
  background: #fff;
}
.tabla-pacientes-table th {
  background: #f7f9fa;
  font-weight: 600;
}
.tabla-pacientes-table tr:not(:last-child) td {
  border-bottom: 1.5px solid #e0e0e0;
}
.tabla-pacientes-table td:not(:last-child),
.tabla-pacientes-table th:not(:last-child) {
  border-right: 1.5px solid #e0e0e0;
}
.tabla-pacientes-table tr {
  transition: background 0.2s;
}
.tabla-pacientes-table tr:hover {
  background: #f5faff;
}

/* Estilos para tabla de enfermeras */
.tabla-enfermeras.card {
  overflow-x: auto;
}

.tabla-enfermeras-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.tabla-enfermeras-table th, 
.tabla-enfermeras-table td {
  border: 1px solid #e0e0e0;
  padding: 14px 12px;
  text-align: left;
  vertical-align: middle;
  background: #fff;
}

.tabla-enfermeras-table th {
  background: #f7f9fa;
  font-weight: 600;
  color: #333;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tabla-enfermeras-table tr:not(:last-child) td {
  border-bottom: 1.5px solid #e0e0e0;
}

.tabla-enfermeras-table td:not(:last-child),
.tabla-enfermeras-table th:not(:last-child) {
  border-right: 1.5px solid #e0e0e0;
}

.tabla-enfermeras-table tr {
  transition: background 0.2s;
}

.tabla-enfermeras-table tr:hover {
  background: #f5faff;
}

.tabla-enfermeras-table td {
  color: #333;
  font-size: 14px;
}

.recetas-scroll-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.receta-item-col {
  margin-bottom: 2px;
}
.btn-reporte-paciente {
  margin-left: 0;
  margin-right: 0;
}

/* Estilos para gestión de medicamentos */
.gestion-medicamentos .card {
  margin-top: 32px;
  padding: 24px 18px;
}

.medicamentos-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.formulario-medicamento {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.formulario-medicamento h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 18px;
}

.form-row {
  margin-bottom: 15px;
}

.form-row label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
  font-size: 14px;
}

.form-row input,
.form-row select,
.form-row textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-row textarea {
  resize: vertical;
  min-height: 60px;
}

.btn-agregar-medicamento {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-size: 14px;
  transition: background 0.3s;
  width: 100%;
}

.btn-agregar-medicamento:hover {
  background: #218838;
}

.lista-medicamentos h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 18px;
}

.medicamentos-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
  overflow-y: auto;
}

.medicamentos-scroll {
  max-height: 350px;
  overflow-y: auto;
}

.medicamento-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.medicamento-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.medicamento-header h4 {
  margin: 0;
  color: #333;
  font-size: 16px;
  font-weight: bold;
}

.btn-eliminar-medicamento {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
}

.btn-eliminar-medicamento:hover {
  background: #f8d7da;
}

.medicamento-info p {
  margin: 5px 0;
  font-size: 14px;
  color: #666;
}

.medicamento-info strong {
  color: #333;
}

.no-medicamentos {
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
}

.btn-asignar-medicamento {
  background: #4CAF50; /* Verde para asignar */
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: background 0.3s;
  margin-top: 10px;
}

.btn-asignar-medicamento:hover {
  background: #388E3C;
}

/* Modal de asignación de medicamento a paciente */
.modal-asignar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-asignar {
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.modal-asignar h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
  font-size: 20px;
}

.modal-asignar p {
  color: #555;
  font-size: 15px;
  margin-bottom: 10px;
}

.modal-asignar label {
  font-weight: bold;
  color: #333;
  font-size: 16px;
  margin-bottom: 5px;
}

.modal-asignar-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-confirmar-asignacion, .btn-cancelar-asignacion {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.3s;
}

.btn-confirmar-asignacion {
  background: #28a745;
  color: white;
}

.btn-confirmar-asignacion:hover {
  background: #218838;
}

.btn-cancelar-asignacion {
  background: #dc3545;
  color: white;
}

.btn-cancelar-asignacion:hover {
  background: #c82333;
}

/* Responsive para medicamentos */
@media (max-width: 768px) {
  .medicamentos-container {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .formulario-medicamento,
  .lista-medicamentos {
    padding: 15px;
  }
}
.recetas-medicas-admin {
  padding: 10px 18px 10px 18px;
  font-size: 15px;
  color: #333;
}
.recetas-scroll {
  max-height: 120px;
  overflow-y: auto;
  margin-top: 4px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: #fff;
  padding: 6px 10px;
}
.receta-item {
  padding: 4px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}
.receta-item:last-child {
  border-bottom: none;
}
.receta-nombre {
  font-weight: bold;
  color: #2d4fff;
}
.receta-fecha {
  color: #888;
  font-size: 12px;
  margin-left: 8px;
}
.btn-receta-prueba {
  margin-left: 8px;
  background: #ff9800;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: bold;
  transition: background 0.2s;
}
.btn-receta-prueba:hover {
  background: #e65100;
}
.recetas-container {
  min-width: 200px;
}

.recetas-resumen {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 14px;
}

.recetas-resumen:hover {
  background: #e9ecef;
}

.recetas-contador {
  font-weight: bold;
  color: #2d4fff;
}

.recetas-toggle {
  color: #666;
  font-size: 12px;
}

.recetas-detalle {
  margin-top: 8px;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  background: #fff;
}

.receta-item-detalle {
  padding: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.receta-item-detalle:last-child {
  border-bottom: none;
}

.receta-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.receta-header strong {
  color: #2d4fff;
  font-size: 13px;
}

.receta-fecha-detalle {
  color: #888;
  font-size: 11px;
}

.receta-info-detalle {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
}

.receta-dosis {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 6px;
  border-radius: 4px;
}

.receta-frecuencia {
  background: #f3e5f5;
  color: #7b1fa2;
  padding: 2px 6px;
  border-radius: 4px;
}

.receta-instrucciones {
  background: #fff3e0;
  color: #f57c00;
  padding: 2px 6px;
  border-radius: 4px;
}

.sin-recetas {
  color: #888;
  font-size: 13px;
  font-style: italic;
  text-align: center;
  padding: 8px;
}
.sugerencias-cima-lista {
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 180px;
  overflow-y: auto;
  position: absolute;
  z-index: 10;
  width: 100%;
}
.sugerencia-cima-item {
  padding: 8px 12px;
  cursor: pointer;
}
.sugerencia-cima-item:hover {
  background: #f0f0f0;
}
.admin-tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  padding: 8px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
  gap: 4px;
}

.admin-tab {
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

.admin-tab:hover {
  background: rgba(0, 123, 255, 0.1);
  color: #007bff;
}

.admin-tab.active {
  background: #007bff;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.3);
}

/* Estilos para la sección de configuración */
.configuracion-datos {
  max-width: 600px;
  margin: 0 auto 30px auto;
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

/* Responsive para configuración */
@media (max-width: 768px) {
  .admin-tabs {
    flex-direction: column;
  }

  .admin-tab {
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

/* Estilos para configuración de firma digital */
.configuracion-firma {
  margin-top: 20px;
}

.configuracion-firma h3 {
  color: #333;
  margin-bottom: 10px;
  font-size: 18px;
}

.configuracion-firma p {
  color: #666;
  margin-bottom: 20px;
  line-height: 1.5;
}

.firma-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  margin-bottom: 20px;
}

.firma-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.firma-existe {
  color: #27ae60;
  font-weight: bold;
  font-size: 16px;
}

.firma-no-existe {
  color: #e74c3c;
  font-weight: bold;
  font-size: 16px;
}

.firma-actions {
  display: flex;
  gap: 10px;
}

.btn-configurar-firma {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.2s;
}

.btn-configurar-firma:hover {
  background: #0056b3;
}

.btn-eliminar-firma {
  background: #dc3545;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.2s;
}

.btn-eliminar-firma:hover {
  background: #c82333;
}

.firma-preview {
  margin-top: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.firma-preview h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.firma-preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 20px;
}

.firma-preview-img {
  max-width: 200px;
  max-height: 80px;
  object-fit: contain;
}

/* Modal de recetas médicas */
.modal-recetas-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.modal-recetas {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-recetas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.modal-recetas-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: bold;
}

.modal-recetas-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.sin-recetas-modal {
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
}

.recetas-por-fecha {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.grupo-fecha {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.fecha-grupo {
  background: #f8f9fa;
  padding: 12px 16px;
  margin: 0;
  color: #333;
  font-size: 16px;
  font-weight: bold;
  border-bottom: 1px solid #e0e0e0;
}

.recetas-del-dia {
  padding: 16px;
}

.receta-modal-item {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.receta-modal-item:last-child {
  margin-bottom: 0;
}

.receta-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.receta-nombre {
  color: #007bff;
  font-size: 16px;
  font-weight: bold;
}

.receta-hora {
  color: #666;
  font-size: 14px;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
}

.receta-modal-info {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
}

.receta-dosis-modal,
.receta-frecuencia-modal,
.receta-instrucciones-modal {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}

.receta-diagnosticos {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.receta-diagnosticos strong {
  color: #333;
  font-size: 14px;
  margin-right: 8px;
}

.diagnostico-tag {
  display: inline-block;
  background: #fff3e0;
  color: #f57c00;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 4px;
  margin-bottom: 4px;
}

/* Responsive para modal de recetas */
@media (max-width: 768px) {
  .modal-recetas {
    max-width: 95vw;
    margin: 10px;
  }
  
  .modal-recetas-header {
    padding: 16px 20px;
  }
  
  .modal-recetas-content {
    padding: 20px;
  }
  
  .receta-modal-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .receta-modal-info {
    flex-direction: column;
    gap: 8px;
  }
}

/* Responsive para configuración de firma */
@media (max-width: 768px) {
  .firma-status {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .firma-actions {
    flex-direction: column;
  }
  
  .firma-preview-container {
    min-height: 80px;
  }
  
  .firma-preview-img {
    max-width: 150px;
    max-height: 60px;
  }
}
</style>

<style>
@media (max-width: 600px) {
  .tabla-pacientes-table {
    display: none !important;
  }
  .paciente-card-mobile {
    display: block !important;
    background: #fff;
    border-radius: 8px;
    margin-bottom: 12px;
    padding: 12px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.06);
    font-size: 15px;
  }
}
@media (min-width: 601px) {
  .paciente-card-mobile {
    display: none !important;
  }
}

/* Responsive para tabla de enfermeras */
@media (max-width: 768px) {
  .tabla-enfermeras-table {
    font-size: 12px;
  }
  
  .tabla-enfermeras-table th, 
  .tabla-enfermeras-table td {
    padding: 8px 6px;
  }
  
  .tabla-enfermeras-table th {
    font-size: 12px;
    letter-spacing: 0.3px;
  }
  
  .tabla-enfermeras-table td {
    font-size: 12px;
  }
}
.banner-mensaje {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  z-index: 9999;
  padding: 16px;
  text-align: center;
  font-weight: bold;
  font-size: 1.1em;
  transition: all 0.3s;
}
.banner-mensaje.info { background: #d1ecf1; color: #0c5460; }
.banner-mensaje.exito { background: #d4edda; color: #155724; }
.banner-mensaje.error { background: #f8d7da; color: #721c24; }
</style> 