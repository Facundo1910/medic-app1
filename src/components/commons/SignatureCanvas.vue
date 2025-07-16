<template>
  <div class="signature-modal-overlay" @click="cerrarModal" v-if="mostrar">
    <div class="signature-modal" @click.stop>
      <div class="signature-header">
        <h3>🖊️ Dibuja tu firma</h3>
        <button @click="cerrarModal" class="btn-cerrar">✕</button>
      </div>
      
      <div class="signature-content">
        <p class="signature-instructions">
          Dibuja tu firma en el área de abajo. Esta firma se usará para todas las recetas médicas.
        </p>
        
        <div class="canvas-container">
          <canvas
            ref="signatureCanvas"
            @mousedown="iniciarDibujo"
            @mousemove="dibujar"
            @mouseup="terminarDibujo"
            @mouseleave="terminarDibujo"
            @touchstart="iniciarDibujoTouch"
            @touchmove="dibujarTouch"
            @touchend="terminarDibujo"
            class="signature-canvas"
          ></canvas>
        </div>
        
        <div class="signature-actions">
          <button @click="limpiarCanvas" class="btn-limpiar">
            🗑️ Limpiar
          </button>
          <button @click="guardarFirma" class="btn-guardar" :disabled="!hayFirma">
            💾 Guardar Firma
          </button>
        </div>
        
        <div v-if="mensaje" :class="['mensaje', mensajeTipo]">
          {{ mensaje }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from '@/firebase';
import { updateDoc, doc } from 'firebase/firestore';

export default {
  name: 'SignatureCanvas',
  props: {
    mostrar: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      dibujando: false,
      contexto: null,
      hayFirma: false,
      mensaje: '',
      mensajeTipo: 'info'
    }
  },
  watch: {
    mostrar(nuevo) {
      if (nuevo) {
        this.$nextTick(() => {
          this.inicializarCanvas();
        });
      }
    }
  },
  methods: {
    inicializarCanvas() {
      const canvas = this.$refs.signatureCanvas;
      if (!canvas) return;
      
      // Configurar canvas
      canvas.width = 400;
      canvas.height = 200;
      
      this.contexto = canvas.getContext('2d');
      this.contexto.strokeStyle = '#000';
      this.contexto.lineWidth = 2;
      this.contexto.lineCap = 'round';
      this.contexto.lineJoin = 'round';
      
      // Limpiar canvas
      this.contexto.fillStyle = '#fff';
      this.contexto.fillRect(0, 0, canvas.width, canvas.height);
      
      this.hayFirma = false;
      this.mensaje = '';
    },
    
    obtenerPosicion(event) {
      const canvas = this.$refs.signatureCanvas;
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    },
    
    obtenerPosicionTouch(event) {
      const canvas = this.$refs.signatureCanvas;
      const rect = canvas.getBoundingClientRect();
      const touch = event.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    },
    
    iniciarDibujo(event) {
      this.dibujando = true;
      const pos = this.obtenerPosicion(event);
      this.contexto.beginPath();
      this.contexto.moveTo(pos.x, pos.y);
    },
    
    dibujar(event) {
      if (!this.dibujando) return;
      const pos = this.obtenerPosicion(event);
      this.contexto.lineTo(pos.x, pos.y);
      this.contexto.stroke();
      this.hayFirma = true;
    },
    
    terminarDibujo() {
      this.dibujando = false;
    },
    
    iniciarDibujoTouch(event) {
      event.preventDefault();
      this.iniciarDibujo(event);
    },
    
    dibujarTouch(event) {
      event.preventDefault();
      this.dibujar(event);
    },
    
    limpiarCanvas() {
      this.inicializarCanvas();
    },
    
    async guardarFirma() {
      if (!this.hayFirma) {
        this.mensaje = 'Por favor, dibuja tu firma antes de guardar';
        this.mensajeTipo = 'error';
        return;
      }
      try {
        const canvas = this.$refs.signatureCanvas;
        const firmaDataURL = canvas.toDataURL('image/png');
        // Detectar si estamos en local
        const isLocal = !process.env.VUE_APP_API_FIRMAS && window.location.hostname === 'localhost';
        if (isLocal) {
          // Guardar en localStorage
          localStorage.setItem('firmaGuardada', firmaDataURL);
          this.mensaje = '✅ Firma guardada localmente (solo en este navegador)';
          this.mensajeTipo = 'exito';
          this.$emit('firma-guardada', 'local');
          setTimeout(() => {
            this.cerrarModal();
          }, 1500);
          return;
        }
        // En producción, guardar en el backend
        const API_FIRMAS = process.env.VUE_APP_API_FIRMAS || 'http://localhost:4000/firmas';
        const response = await fetch(API_FIRMAS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imagen: firmaDataURL })
        });
        if (!response.ok) throw new Error('Error al guardar en MongoDB');
        const data = await response.json();
        this.mensaje = '✅ Firma guardada en MongoDB (ID: ' + data.id + ')';
        this.mensajeTipo = 'exito';
        // Guardar el ID en Firebase (paciente actual)
        const usuarioData = localStorage.getItem('usuario');
        if (usuarioData) {
          const usuario = JSON.parse(usuarioData);
          if (usuario.rol === 'paciente' && usuario.id) {
            const docRef = doc(db, 'pacientes', usuario.id);
            await updateDoc(docRef, { firmaId: data.id });
          }
        }
        // Emitir evento de firma guardada con el ID de Mongo
        this.$emit('firma-guardada', data.id);
        setTimeout(() => {
          this.cerrarModal();
        }, 1500);
      } catch (error) {
        this.mensaje = '❌ Error al guardar la firma en MongoDB';
        this.mensajeTipo = 'error';
      }
    },
    
    cerrarModal() {
      this.$emit('cerrar');
    }
  }
}
</script>

<style scoped>
.signature-modal-overlay {
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

.signature-modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.signature-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.signature-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.btn-cerrar {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
}

.btn-cerrar:hover {
  background: #e0e0e0;
}

.signature-content {
  padding: 20px 24px;
  flex: 1;
}

.signature-instructions {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 14px;
  text-align: center;
}

.canvas-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.signature-canvas {
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: crosshair;
  background: white;
}

.signature-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 15px;
}

.btn-limpiar, .btn-guardar {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.btn-limpiar {
  background: #f8f9fa;
  color: #666;
  border: 1px solid #ddd;
}

.btn-limpiar:hover {
  background: #e9ecef;
}

.btn-guardar {
  background: #17989c;
  color: white;
}

.btn-guardar:hover:not(:disabled) {
  background: #1fcfcf;
}

.btn-guardar:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.mensaje {
  padding: 10px;
  border-radius: 6px;
  text-align: center;
  font-weight: bold;
}

.mensaje.exito {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.mensaje.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.mensaje.info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

@media (max-width: 768px) {
  .signature-modal {
    max-width: 95vw;
  }
  
  .signature-canvas {
    width: 100%;
    max-width: 350px;
    height: 150px;
  }
  
  .signature-actions {
    flex-direction: column;
  }
}
</style> 