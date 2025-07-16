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

      <!-- Menú de pestañas -->
      <nav class="paciente-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['paciente-tab', { active: seccionActiva === tab.id }]"
          @click="seccionActiva = tab.id"
        >
          {{ tab.label }}
        </button>
      </nav>
  
      <!-- Sección Información -->
      <section v-if="seccionActiva === 'informacion'">
        <!-- Información del paciente -->
        <PacienteInfo :paciente="paciente" />
  
        <!-- Diagnósticos -->
        <PacienteDiagnosticos :diagnosticos="diagnosticos" />
  
        <!-- Historial de medicación -->
        <PacienteHistorialMedicacion :historial="historial" />
  
        <!-- Resumen -->
        <PacienteResumen :diagnosticos="diagnosticos" :historial="historial" />

      <!-- Signos Vitales -->
      <section class="signos-vitales">
        <div class="card">
          <div class="descarga-pdf-row">
            <button @click="descargarPDF" class="btn-descargar-pdf">
              <span class="icono-descarga">📄</span> Descargar PDF
            </button>
          </div>
          <SignosVitalesCharts :signosVitales="signosVitales" />
        </div>
      </section>

      <!-- Receta Médica -->
      <section class="receta-medica-section">
        <PacienteRecetaMedica 
          :medicamentosIndicados="paciente.medicamentosIndicados" 
          @descargar-receta="descargarRecetaIndividualPDF"
        />
      </section>
      </section>

      <!-- Sección Configuración -->
      <section v-if="seccionActiva === 'configuracion'">
        <PacienteConfiguracion 
          :paciente="paciente"
          :datosEditables="datosEditables"
          @guardar-datos="guardarDatosPersonales"
          @solicitar-cambio-dni="solicitarCambioDNI"
          @cancelar-edicion="cancelarEdicion"
        />
      </section>
    </div>

    <!-- Modal para solicitar cambio de DNI -->
    <ModalCambioDNI 
      :mostrar="mostrarModalDNI"
      :dniActual="paciente.dni"
      @cerrar="cerrarModalDNI"
      @enviar-solicitud="enviarSolicitudDNI"
    />
  </div>
</template>
  
<script>
import { db } from "@/firebase";
import { collection, getDocs, query, where, onSnapshot, updateDoc, addDoc, query as firestoreQuery, collection as firestoreCollection, where as firestoreWhere } from "firebase/firestore";
import SignosVitalesCharts from './commons/SignosVitalesCharts.vue';
import PacienteInfo from './commons/PacienteInfo.vue';
import PacienteDiagnosticos from './commons/PacienteDiagnosticos.vue';
import PacienteHistorialMedicacion from './commons/PacienteHistorialMedicacion.vue';
import PacienteResumen from './commons/PacienteResumen.vue';
import PacienteRecetaMedica from './commons/PacienteRecetaMedica.vue';
import PacienteConfiguracion from './commons/PacienteConfiguracion.vue';
import ModalCambioDNI from './commons/ModalCambioDNI.vue';
import { generarPDFSignosYMedicaciones } from '@/utils/helpers';
import jsPDF from 'jspdf';

export default {
  name: "HomePaciente",
  components: { 
    SignosVitalesCharts,
    PacienteInfo,
    PacienteDiagnosticos,
    PacienteHistorialMedicacion,
    PacienteResumen,
    PacienteRecetaMedica,
    PacienteConfiguracion,
    ModalCambioDNI
  },
  data() {
    return {
      paciente: {
        nombre: "Cargando...",
        apellido: "",
        dni: "",
        fechaNacimiento: "",
        email: "",
        medicamentosIndicados: [] // Nuevo campo para la receta médica
      },
      historial: [],
      diagnosticos: [],
      signosVitales: [],
      unsubscribe: null,

      vitalParams: [
        {
          key: 'temperatura',
          title: 'Evolución de Temperatura',
          label: 'Temperatura (°C)',
          color: '#2196f3',
          min: 34, max: 41,
          icon: '🌡️',
          data: (arr) => arr.map(s => s.temperatura)
        },
        {
          key: 'frecuenciaCardiaca',
          title: 'Evolución de Frecuencia Cardíaca',
          label: 'Frecuencia cardíaca (lpm)',
          color: '#e53935',
          min: 40, max: 180,
          icon: '❤️',
          data: (arr) => arr.map(s => s.frecuenciaCardiaca)
        },
        {
          key: 'frecuenciaRespiratoria',
          title: 'Evolución de Frecuencia Respiratoria',
          label: 'Frecuencia respiratoria (resps/min)',
          color: '#43a047',
          min: 5, max: 40,
          icon: '🫁',
          data: (arr) => arr.map(s => s.frecuenciaRespiratoria)
        },
        {
          key: 'saturacionOxigeno',
          title: 'Evolución de Saturación de Oxígeno',
          label: 'Saturación de oxígeno (%)',
          color: '#00bcd4',
          min: 70, max: 100,
          icon: '🩸',
          data: (arr) => arr.map(s => s.saturacionOxigeno)
        },
        {
          key: 'glucemia',
          title: 'Evolución de Glucemia',
          label: 'Glucemia (mg/dL)',
          color: '#ff9800',
          min: 40, max: 300,
          icon: '🧃',
          data: (arr) => arr.map(s => s.glucemia)
        }
      ],
      graficoSeleccionado: 'todos', // 'todos' o el nombre de un parámetro vital
      parametroSeleccionado: null,
      medicamentoPendiente: null,
      grupoAbierto: {},
      // Variables para configuración
      seccionActiva: 'informacion',
      tabs: [
        { id: 'informacion', label: 'Información' },
        { id: 'configuracion', label: 'Configuración' }
      ],
      datosEditables: {
        nombre: '',
        apellido: '',
        email: '',
        fechaNacimiento: ''
      },
      mostrarModalDNI: false,
      solicitudDNI: {
        nuevoDNI: '',
        motivo: ''
      }
    };
  },
  computed: {
    labelsSignos() {
      return this.signosVitales.map(s => this.formatearFecha(s.fechaHora));
    },
    opcionesGrafico() {
      return [
        { key: 'todos', title: 'Todos', icon: '📊' },
        ...this.vitalParams.map(param => ({
          key: param.key,
          title: `${param.icon} ${param.title}`,
          icon: param.icon
        }))
      ];
    },
    datasetsCombinados() {
      if (this.graficoSeleccionado === 'todos') {
        return this.vitalParams.map(param => ({
          label: param.title,
          backgroundColor: param.color + '22',
          borderColor: param.color,
          data: param.data(this.signosVitales),
          fill: false,
          pointBackgroundColor: param.color,
          pointRadius: 4,
          lineTension: 0.1
        }));
      } else {
        const param = this.vitalParams.find(p => p.key === this.graficoSeleccionado);
        if (param) {
          return [
            {
              label: param.title,
              backgroundColor: param.color + '22',
              borderColor: param.color,
              data: param.data(this.signosVitales),
              fill: false,
              pointBackgroundColor: param.color,
              pointRadius: 4,
              lineTension: 0.1
            }
          ];
        }
        return [];
      }
    },

  },
  watch: {
    seccionActiva(nuevaSeccion) {
      if (nuevaSeccion === 'configuracion') {
        this.cargarDatosEditables();
      }
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
            // Actualizar signos vitales
            if (data.signosVitales && Array.isArray(data.signosVitales)) {
              this.signosVitales = data.signosVitales.slice().sort((a, b) => 
                (a.fechaHora || '').localeCompare(b.fechaHora || '')
              );
            }
            // Actualizar receta médica
            if (data.medicamentosIndicados && Array.isArray(data.medicamentosIndicados)) {
              this.paciente.medicamentosIndicados = data.medicamentosIndicados.slice();
            }
          }
        });
        // Borrar signos vitales viejos después de cargar
        await this.borrarSignosVitalesViejos();
      }
    } catch (e) {
      console.error("Error al cargar datos:", e);
      alert("Error al cargar los datos del paciente");
    }
    // Abrir el grupo del mes actual por defecto
    this.$nextTick(() => {
      const hoy = new Date();
      const key = hoy.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
      this.$set(this.grupoAbierto, key, true);
      
      // Inicializar el parámetro seleccionado para el gráfico individual
      this.parametroSeleccionado = this.vitalParams[0];
    });
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
          year: '2-digit',
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
    },
    mesANumero(mes) {
      const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
      return (meses.indexOf(mes.toLowerCase()) + 1).toString().padStart(2, '0');
    },

    seleccionarGrafico(key) {
      this.graficoSeleccionado = key;
      if (key !== 'todos') {
        this.parametroSeleccionado = this.vitalParams.find(p => p.key === key);
      } else {
        this.parametroSeleccionado = null;
      }
    },
    async borrarSignosVitalesViejos() {
      if (!this.paciente || !this.paciente.id) return;
      const ahora = new Date();
      const tresDiasMs = 3 * 24 * 60 * 60 * 1000;
      let signosNuevos = [];
      let huboCambios = false;
      if (Array.isArray(this.signosVitales)) {
        signosNuevos = this.signosVitales.filter(sv => {
          const fecha = new Date(sv.fechaHora);
          return ahora - fecha <= tresDiasMs;
        });
        if (signosNuevos.length !== this.signosVitales.length) huboCambios = true;
      }
      if (huboCambios) {
        const q = query(collection(db, "pacientes"), where("nombre", "==", this.paciente.nombre));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docRef = querySnapshot.docs[0].ref;
          await updateDoc(docRef, {
            signosVitales: signosNuevos
          });
          this.signosVitales = signosNuevos;
        }
      }
    },
    async descargarPDF() {
      // Buscar el canvas del gráfico combinado
      await this.$nextTick();
      const chartCanvas = document.querySelector('.grafico-combinado canvas');
      const pdfBlob = await generarPDFSignosYMedicaciones(
        chartCanvas,
        this.historial || [],
        this.paciente
      );
      // Descargar el PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reporte_medicapp.pdf';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    },
    async descargarRecetaPDF() {
      if (!this.paciente.medicamentosIndicados || !this.paciente.medicamentosIndicados.length) return;
      const doc = new jsPDF();
      // Logo de Brionia (ruta correcta)
      const logoUrl = require('@/assets/a1e7f095-a7c5-4529-a80f-9befabda94a3.png');
      const img = new window.Image();
      img.src = logoUrl;
      img.onload = () => {
        doc.addImage(img, 'PNG', 10, 8, 25, 25);
        this._generarRecetaPDF(doc);
      };
      img.onerror = () => {
        // Si falla el logo, igual genera el PDF
        this._generarRecetaPDF(doc);
      };
    },
    _generarRecetaPDF(doc) {
      // Título y datos del médico
      doc.setFontSize(13);
      doc.text('Médico especialista en Medicina Interna', 40, 15);
      doc.setFontSize(11);
      doc.text('Nombre', 40, 22);
      doc.text('CMP: 0000   RNE: 0000', 40, 28);
      doc.setLineWidth(0.5);
      doc.line(10, 35, 200, 35);
      // Datos del paciente
      doc.setFontSize(11);
      doc.text(`NOMBRE: ${this.paciente.nombre || ''} ${this.paciente.apellido || ''}`, 12, 43);
      doc.text(`N° DNI: ${this.paciente.dni || ''}`, 12, 50);
      doc.text(`EDAD: ${this.calcularEdad(this.paciente.fechaNacimiento)}`, 80, 50);
      // Mostrar todos los diagnósticos
      if (this.diagnosticos && this.diagnosticos.length > 0) {
        doc.text(`DIAGNÓSTICO: ${this.diagnosticos.join(', ')}`, 12, 57);
      } else {
        doc.text('DIAGNÓSTICO:', 12, 57);
      }
      doc.text('Rp./', 12, 65);
      // Medicamentos
      let y = 73;
      this.paciente.medicamentosIndicados.forEach((med, idx) => {
        doc.text(`${idx+1}. ${med.nombre || ''} ${med.dosisRecomendada ? '- ' + med.dosisRecomendada + ' mg' : ''} ${med.frecuencia ? '- ' + med.frecuencia : ''} ${med.instrucciones ? '- ' + med.instrucciones : ''}`, 16, y);
        y += 8;
      });
      // Fecha
      const hoy = new Date();
      doc.text(`FECHA: ${hoy.toLocaleDateString()}`, 12, y + 10);
      // Firma y sello
      doc.text('FIRMA Y SELLO', 150, y + 25);
      // Contacto
      doc.setFontSize(10);
      doc.text(`Contacto al teléfono: ---`, 12, y + 30);
      doc.text(`Correo: ${this.paciente.email || ''}`, 12, y + 35);
      doc.save('receta_medica.pdf');
    },
    async     descargarRecetaIndividualPDF(medicamento) {
      // Buscar el email del admin/médico asociado a esta receta específica
      const adminEmail = medicamento.adminEmail;
      if (!adminEmail) {
        alert('No se puede encontrar el médico administrador asociado a esta receta. Contacta al administrador.');
        return;
      }
      // Buscar el documento del admin por email
      const q = firestoreQuery(firestoreCollection(db, "admins"), firestoreWhere("email", "==", adminEmail));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        alert('No se encontró el médico administrador en la base de datos. Contacta al administrador.');
        return;
      }
      const adminDoc = querySnapshot.docs[0];
      const adminData = adminDoc.data();
      
      // Buscar la firma del admin usando firmaId
      if (adminData.firmaId) {
        try {
          const API_FIRMAS = process.env.VUE_APP_API_FIRMAS || '/api/firmas';
          const res = await fetch(`${API_FIRMAS}/${adminData.firmaId}`);
          if (res.ok) {
            const data = await res.json();
            // Crear una imagen y esperar a que se cargue completamente
            const img = new window.Image();
            img.crossOrigin = "Anonymous";
            
            // Crear una promesa para esperar a que la imagen se cargue
            const loadImage = new Promise((resolve, reject) => {
              img.onload = () => resolve(img);
              img.onerror = () => reject(new Error('Error al cargar imagen'));
            });
            
            img.src = data.imagen;
            
            // Esperar a que la imagen se cargue antes de generar el PDF
            const loadedImg = await loadImage;
            this.generarPDFConFirma(medicamento, loadedImg);
          } else {
            // Si no se puede cargar la firma, generamos PDF sin firma
            this.generarPDFConFirma(medicamento, null);
          }
        } catch (error) {
          console.error('Error al cargar firma:', error);
          this.generarPDFConFirma(medicamento, null);
        }
      } else {
        // Si no hay firmaId, generamos PDF sin firma
        this.generarPDFConFirma(medicamento, null);
      }
    },
    

    
    generarPDFConFirma(medicamento, firmaImg) {
      const doc = new jsPDF();
      
      // Logo de Brionia
      const logoUrl = require('@/assets/a1e7f095-a7c5-4529-a80f-9befabda94a3.png');
      const img = new window.Image();
      img.src = logoUrl;
      
      img.onload = () => {
        doc.addImage(img, 'PNG', 10, 8, 25, 25);
        this._generarRecetaIndividualPDFConFirma(doc, medicamento, firmaImg);
      };
      
      img.onerror = () => {
        this._generarRecetaIndividualPDFConFirma(doc, medicamento, firmaImg);
      };
    },
    
    _generarRecetaIndividualPDFConFirma(doc, medicamento, firmaImg) {
      // Título y datos del médico
      doc.setFontSize(13);
      doc.text('Médico especialista en Medicina Interna', 40, 15);
      doc.setFontSize(11);
      doc.text('Nombre', 40, 22);
      doc.text('CMP: 0000   RNE: 0000', 40, 28);
      doc.setLineWidth(0.5);
      doc.line(10, 35, 200, 35);
      
      // Datos del paciente
      doc.setFontSize(11);
      doc.text(`NOMBRE: ${this.paciente.nombre || ''} ${this.paciente.apellido || ''}`, 12, 43);
      doc.text(`N° DNI: ${this.paciente.dni || ''}`, 12, 50);
      doc.text(`EDAD: ${this.calcularEdad(this.paciente.fechaNacimiento)}`, 80, 50);
      
      // Diagnóstico específico de la receta
      if (medicamento.diagnostico && medicamento.diagnostico.length > 0) {
        const diagnosticoTexto = Array.isArray(medicamento.diagnostico) ? medicamento.diagnostico.join(', ') : medicamento.diagnostico;
        doc.text(`DIAGNÓSTICO: ${diagnosticoTexto}`, 12, 57);
      } else {
        doc.text('DIAGNÓSTICO:', 12, 57);
      }
      
      doc.text('Rp./', 12, 65);
      
      // Medicamento
      doc.text(`${medicamento.nombre || ''} ${medicamento.dosisRecomendada ? '- ' + medicamento.dosisRecomendada + ' mg' : ''} ${medicamento.frecuencia ? '- ' + medicamento.frecuencia : ''} ${medicamento.instrucciones ? '- ' + medicamento.instrucciones : ''}`, 16, 73);
      
      // Fecha
      const hoy = new Date();
      doc.text(`FECHA: ${hoy.toLocaleDateString()}`, 12, 81);
      
      // Firma digital
      if (firmaImg && firmaImg.complete && firmaImg.naturalWidth > 0) {
        try {
          // Crear un canvas para procesar la imagen
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = firmaImg.naturalWidth;
          canvas.height = firmaImg.naturalHeight;
          
          // Dibujar la imagen en el canvas
          ctx.drawImage(firmaImg, 0, 0);
          
          // Obtener los datos de la imagen como base64
          const imageData = canvas.toDataURL('image/png');
          
          // Agregar la imagen al PDF
          doc.addImage(imageData, 'PNG', 150, 85, 40, 20);
          doc.text('FIRMA DIGITAL', 150, 110);
        } catch (error) {
          console.error('Error al agregar firma al PDF:', error);
          doc.text('FIRMA Y SELLO', 150, 95);
        }
      } else {
        doc.text('FIRMA Y SELLO', 150, 95);
      }
      
      // Contacto
      doc.setFontSize(10);
      doc.text(`Contacto al teléfono: ---`, 12, 100);
      doc.text(`Correo: ${this.paciente.email || ''}`, 12, 105);
      
      // Timestamp de firma
      doc.setFontSize(8);
      if (firmaImg) {
        doc.text(`Documento firmado digitalmente el: ${hoy.toLocaleString()}`, 12, 115);
      } else {
        doc.text(`Documento generado el: ${hoy.toLocaleString()} (sin firma digital)`, 12, 115);
      }
      
      doc.save(`receta_individual_${medicamento.nombre || 'medicamento'}.pdf`);
    },
    
    // Métodos para configuración
    cargarDatosEditables() {
      this.datosEditables = {
        nombre: this.paciente.nombre || '',
        apellido: this.paciente.apellido || '',
        email: this.paciente.email || '',
        fechaNacimiento: this.paciente.fechaNacimiento || ''
      };
    },
    
    async guardarDatosPersonales() {
      try {
        // Buscar el documento del paciente en Firestore
        const q = query(collection(db, "pacientes"), where("nombre", "==", this.paciente.nombre));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const docRef = querySnapshot.docs[0].ref;
          
          // Actualizar datos en Firestore
          await updateDoc(docRef, {
            nombre: this.datosEditables.nombre.trim(),
            apellido: this.datosEditables.apellido.trim(),
            email: this.datosEditables.email.trim(),
            fechaNacimiento: this.datosEditables.fechaNacimiento
          });
          
          // Actualizar datos locales
          this.paciente.nombre = this.datosEditables.nombre.trim();
          this.paciente.apellido = this.datosEditables.apellido.trim();
          this.paciente.email = this.datosEditables.email.trim();
          this.paciente.fechaNacimiento = this.datosEditables.fechaNacimiento;
          
          // Actualizar localStorage
          localStorage.setItem('usuario', JSON.stringify(this.paciente));
          
          alert('✅ Datos actualizados exitosamente');
        } else {
          alert('❌ Error: No se encontró el paciente en la base de datos');
        }
      } catch (error) {
        console.error('Error al guardar datos:', error);
        alert('❌ Error al guardar los datos');
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
    
    calcularEdad(fechaNacimiento) {
      if (!fechaNacimiento) return '';
      try {
        const fechaNac = new Date(fechaNacimiento);
        const hoy = new Date();
        let edad = hoy.getFullYear() - fechaNac.getFullYear();
        const mes = hoy.getMonth() - fechaNac.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
          edad--;
        }
        return edad + ' años';
      } catch (e) {
        return '';
      }
    },
    
    async enviarSolicitudDNI() {
      try {
        // Validar que el nuevo DNI sea diferente al actual
        if (this.solicitudDNI.nuevoDNI === this.paciente.dni) {
          alert('❌ El nuevo DNI debe ser diferente al actual');
          return;
        }
        
        // Validar formato del DNI (8 dígitos)
        if (!/^\d{8}$/.test(this.solicitudDNI.nuevoDNI)) {
          alert('❌ El DNI debe tener exactamente 8 dígitos');
          return;
        }
        
        // Crear solicitud en Firestore
        const solicitudData = {
          pacienteId: this.paciente.id,
          pacienteNombre: `${this.paciente.nombre} ${this.paciente.apellido}`,
          dniActual: this.paciente.dni,
          dniNuevo: this.solicitudDNI.nuevoDNI,
          motivo: this.solicitudDNI.motivo.trim(),
          fechaSolicitud: new Date().toISOString(),
          estado: 'pendiente'
        };
        
        await addDoc(collection(db, "dniChangeRequests"), solicitudData);
        
        alert('✅ Solicitud de cambio de DNI enviada exitosamente. El administrador la revisará.');
        this.cerrarModalDNI();
        
      } catch (error) {
        console.error('Error al enviar solicitud:', error);
        alert('❌ Error al enviar la solicitud');
      }
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
  width: 100%;
  box-sizing: border-box;
  /* Centrar el contenido dentro de la tarjeta si es necesario */
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
  margin-top: 32px !important;
  margin-bottom: 32px !important;
  width: 100%;
  box-sizing: border-box;
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

/* Estilos para pestañas */
.paciente-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.95);
  padding: 15px 25px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.paciente-tab {
  background: none;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  color: #666;
  transition: all 0.3s;
}

.paciente-tab:hover {
  background: #f0f0f0;
  color: #333;
}

.paciente-tab.active {
  background: #007bff;
  color: white;
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

.signos-vitales {
  margin-top: 32px;
  margin-bottom: 32px;
}
/* Ajuste especial para la tarjeta de signos vitales */
.signos-vitales .card {
  padding-left: 0;
  padding-right: 0;
  width: 100%;
  box-sizing: border-box;
}

.receta-medica-section {
  margin-top: 32px;
  margin-bottom: 32px;
}

/* Estilos para la cabecera de signos vitales y los botones a la derecha */
.signos-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
  text-align: center;
}

.grafico-selector {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-grafico {
  background: #e0e0e0;
  color: #333;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s, color 0.3s;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 5px;
}

.btn-grafico:hover:not(.activo) {
  background: #d0d0d0;
}

.btn-grafico.activo {
  background: #007bff;
  color: white;
}

.grafico-individual,
.grafico-combinado {
  width: 100%;
  height: 380px;
  margin: 0 0 65px 0;
  padding-right: 52px;
  padding-bottom: 65px;
  box-sizing: border-box;
  display: block;
  position: relative;
}

.grafico-individual canvas,
.grafico-combinado canvas {
  width: 100% !important;
  height: 100% !important;
  display: block;
  background: white;
  border-radius: 0 0 10px 10px;
}

.descarga-pdf-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
  margin-right: 18px;
}
.btn-descargar-pdf {
  background: #f4f4f4;
  color: #333;
  border: 1.5px solid #bbb;
  padding: 7px 18px;
  border-radius: 6px;
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border 0.2s;
  box-shadow: none;
  display: flex;
  align-items: center;
  gap: 7px;
}
.btn-descargar-pdf:hover {
  background: #e0e0e0;
  color: #111;
  border-color: #888;
}
.icono-descarga {
  font-size: 1.2em;
  margin-right: 2px;
}

.btn-descargar-receta {
  background: #1976d2;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
  margin-bottom: 18px;
  margin-top: 8px;
  transition: background 0.2s;
}
.btn-descargar-receta:hover {
  background: #1256a3;
}
.lista-receta {
  margin: 0;
  padding: 0 0 0 18px;
  list-style: disc;
}

.btn-descargar-receta-individual {
  background: #17989c;
  color: #fff;
  border: none;
  padding: 4px 7px;
  border-radius: 6px;
  font-size: 1.1em;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  box-shadow: none;
  display: flex;
  align-items: center;
  gap: 0;
  margin-left: 12px;
  margin-bottom: 0;
  min-width: 28px;
  min-height: 28px;
  justify-content: center;
}
.btn-descargar-receta-individual:hover {
  background: #1fcfcf;
  color: #fff;
}

.btn-descargar-receta-individual .icono-descarga {
  font-size: 1.2em;
  margin: 0;
}

.receta-item-flex {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.receta-info-flex {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.firma-status {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.firma-existe {
  color: #43a047; /* Verde para indicar que la firma existe */
  font-weight: bold;
}

.firma-no-existe {
  color: #dc3545; /* Rojo para indicar que la firma no existe */
  font-weight: bold;
}

.btn-cambiar-firma {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 5px;
}

.btn-cambiar-firma:hover {
  background: #0056b3;
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
  
  .grafico-selector {
    flex-direction: column;
  }
  
  .btn-grafico {
    justify-content: center;
    font-size: 14px;
  }

  .signos-header {
    flex-direction: column;
    align-items: center;
    gap: 10px;
    text-align: center;
  }
  .grafico-selector {
    justify-content: center;
  }
  
  .paciente-tabs {
    flex-direction: column;
    gap: 5px;
  }
  
  .paciente-tab {
    text-align: center;
  }
}

/* Estilos para configuración */
.configuracion-datos {
  margin-top: 20px;
}

.configuracion-datos h3 {
  color: #333;
  margin-bottom: 20px;
  font-size: 18px;
}

.form-datos-personales {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-row label {
  font-weight: bold;
  color: #333;
  font-size: 14px;
}

.form-row input,
.form-row textarea {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-row input:focus,
.form-row textarea:focus {
  outline: none;
  border-color: #007bff;
}

.dni-container {
  display: flex;
  gap: 10px;
  align-items: center;
}

.dni-disabled {
  background: #f5f5f5;
  color: #666;
  cursor: not-allowed;
  flex: 1;
}

.btn-solicitar-dni {
  background: #ff9800;
  color: white;
  border: none;
  padding: 12px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.3s;
  white-space: nowrap;
}

.btn-solicitar-dni:hover {
  background: #f57c00;
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.btn-guardar-datos {
  background: #28a745;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
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
  font-weight: bold;
  transition: background 0.3s;
}

.btn-cancelar:hover {
  background: #5a6268;
}

/* Estilos para modal de DNI */
.modal-dni-overlay {
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

.modal-dni {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-dni-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.modal-dni-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.modal-dni-content {
  padding: 24px;
  overflow-y: auto;
}

.modal-dni-content p {
  color: #666;
  margin-bottom: 20px;
  line-height: 1.5;
}

.form-solicitud-dni {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dni-actual {
  background: #f5f5f5;
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
  font-weight: bold;
  transition: background 0.3s;
}

.btn-enviar-solicitud:hover {
  background: #0056b3;
}

/* Responsive para configuración */
@media (max-width: 768px) {
  .dni-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .modal-dni {
    max-width: 95vw;
  }
  
  .modal-dni-content {
    padding: 20px;
  }
}
</style> 