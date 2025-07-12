<template>
  <div class="modal-overlay">
    <div class="modal-card animate-in">
      <button class="modal-close" @click="$emit('back-to-login')">&times;</button>
      <h2>Recuperar Contraseña</h2>
      <!-- Paso 1: Solicitar código -->
      <div v-if="step === 1" class="step-container">
        <p class="step-description">
          Ingresa tu email para recibir un código de recuperación
        </p>
        <form @submit.prevent="requestCode" class="reset-form">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            v-model="email"
            required
            placeholder="tu@email.com"
          />
          <button type="submit" :disabled="loading" class="btn-green">
            {{ loading ? 'Enviando...' : 'Enviar Código' }}
          </button>
        </form>
      </div>
      <!-- Paso 2: Verificar código y nueva contraseña -->
      <div v-if="step === 2" class="step-container">
        <p class="step-description">
          Ingresa el código recibido por email y tu nueva contraseña
        </p>
        <form @submit.prevent="resetPassword" class="reset-form">
          <label for="code">Código de Verificación</label>
          <input
            type="text"
            id="code"
            v-model="code"
            required
            placeholder="123456"
            maxlength="6"
          />
          <label for="newPassword">Nueva Contraseña</label>
          <input
            type="password"
            id="newPassword"
            v-model="newPassword"
            required
            placeholder="Mínimo 6 caracteres"
            minlength="6"
          />
          <label for="confirmPassword">Confirmar Contraseña</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="confirmPassword"
            required
            placeholder="Repite la contraseña"
          />
          <div class="button-group">
            <button type="button" @click="step = 1" class="btn-secondary">
              Volver
            </button>
            <button type="submit" :disabled="loading || !passwordsMatch">
              {{ loading ? 'Actualizando...' : 'Cambiar Contraseña' }}
            </button>
          </div>
        </form>
      </div>
      <!-- Mensajes de estado -->
      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>
      <!-- Volver al login -->
      <div class="back-to-login">
        <button @click="$emit('back-to-login')" class="btn-main">
          ← Volver al Login
        </button>
      </div>
    </div>
  </div>
</template>
<script>
import { ref, computed } from 'vue'
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore'
import { sendPasswordResetEmail } from '../services/emailService.js'
export default {
  name: 'PasswordReset',
  emits: ['back-to-login'],
  setup() {
    const step = ref(1)
    const email = ref('')
    const code = ref('')
    const newPassword = ref('')
    const confirmPassword = ref('')
    const loading = ref(false)
    const message = ref('')
    const messageType = ref('')
    const db = getFirestore()
    const passwordsMatch = computed(() => {
      return newPassword.value && 
             confirmPassword.value && 
             newPassword.value === confirmPassword.value &&
             newPassword.value.length >= 6
    })
    const showMessage = (text, type = 'info') => {
      message.value = text
      messageType.value = type
      setTimeout(() => {
        message.value = ''
        messageType.value = ''
      }, 5000)
    }
    const requestCode = async () => {
      if (!email.value) {
        showMessage('Por favor ingresa tu email', 'error')
        return
      }
      loading.value = true
      message.value = ''
      try {
        // Buscar usuario en ambas colecciones
        const enfermerasRef = collection(db, 'enfermeras')
        const pacientesRef = collection(db, 'pacientes')
        const enfermerasQuery = query(enfermerasRef, where('email', '==', email.value))
        const pacientesQuery = query(pacientesRef, where('email', '==', email.value))
        const [enfermerasSnapshot, pacientesSnapshot] = await Promise.all([
          getDocs(enfermerasQuery),
          getDocs(pacientesQuery)
        ])
        let userDoc = null
        let userType = null
        if (!enfermerasSnapshot.empty) {
          userDoc = enfermerasSnapshot.docs[0]
          userType = 'enfermeras'
        } else if (!pacientesSnapshot.empty) {
          userDoc = pacientesSnapshot.docs[0]
          userType = 'pacientes'
        }
        if (!userDoc) {
          showMessage('No se encontró una cuenta con ese email', 'error')
          return
        }
        // Generar código de 6 dígitos
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString()
        // Guardar código en Firestore con timestamp
        const resetData = {
          code: resetCode,
          email: email.value,
          userType: userType,
          userId: userDoc.id,
          createdAt: new Date(),
          used: false
        }
        const resetRef = collection(db, 'password_resets')
        await addDoc(resetRef, resetData)
        // Enviar email con el código
        await sendPasswordResetEmail(email.value, resetCode)
        showMessage('Código enviado a tu email. Revisa tu bandeja de entrada.', 'success')
        step.value = 2
      } catch (error) {
        showMessage('Error al enviar el código. Intenta nuevamente.', 'error')
      } finally {
        loading.value = false
      }
    }
    const resetPassword = async () => {
      if (!passwordsMatch.value) {
        showMessage('Las contraseñas no coinciden o son muy cortas', 'error')
        return
      }
      loading.value = true
      message.value = ''
      try {
        // Buscar el código en Firestore
        const resetRef = collection(db, 'password_resets')
        const resetQuery = query(
          resetRef, 
          where('code', '==', code.value),
          where('email', '==', email.value),
          where('used', '==', false)
        )
        const resetSnapshot = await getDocs(resetQuery)
        if (resetSnapshot.empty) {
          showMessage('Código inválido o ya utilizado', 'error')
          return
        }
        const resetDoc = resetSnapshot.docs[0]
        const resetData = resetDoc.data()
        // Verificar que el código no haya expirado (1 hora)
        const now = new Date()
        const codeTime = resetData.createdAt.toDate()
        const timeDiff = now - codeTime
        const oneHour = 60 * 60 * 1000
        if (timeDiff > oneHour) {
          showMessage('El código ha expirado. Solicita uno nuevo.', 'error')
          return
        }
        // Actualizar contraseña en la colección correspondiente
        const userRef = doc(db, resetData.userType, resetData.userId)
        await updateDoc(userRef, {
          password: newPassword.value
        })
        // Marcar código como usado
        await updateDoc(doc(db, 'password_resets', resetDoc.id), {
          used: true
        })
        showMessage('Contraseña actualizada exitosamente', 'success')
        setTimeout(() => {
          step.value = 1
          email.value = ''
          code.value = ''
          newPassword.value = ''
          confirmPassword.value = ''
        }, 2000)
      } catch (error) {
        showMessage('Error al actualizar la contraseña. Intenta nuevamente.', 'error')
      } finally {
        loading.value = false
      }
    }
    return {
      step,
      email,
      code,
      newPassword,
      confirmPassword,
      loading,
      message,
      messageType,
      passwordsMatch,
      requestCode,
      resetPassword
    }
  }
}
</script>
<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(30, 40, 60, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  min-height: 100vh;
  min-width: 100vw;
}
.modal-card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(30, 40, 60, 0.18), 0 1.5px 8px rgba(30,40,60,0.10);
  border: 2.5px solid #e3e8f0;
  padding: 38px 32px 28px 32px;
  max-width: 370px;
  width: 100%;
  min-height: 0;
  text-align: center;
  position: relative;
  animation: modalIn 0.35s cubic-bezier(.4,1.6,.6,1) 1;
}
@keyframes modalIn {
  0% { opacity: 0; transform: scale(0.92) translateY(40px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
.animate-in {
  animation: modalIn 0.35s cubic-bezier(.4,1.6,.6,1) 1;
}
.modal-close {
  position: absolute;
  top: 14px;
  right: 18px;
  background: none;
  border: none;
  font-size: 1.7rem;
  color: #b0b0b0;
  cursor: pointer;
  z-index: 10;
  transition: color 0.2s;
}
.modal-close:hover {
  color: #e53935;
}
.modal-card h2 {
  color: #111;
  font-size: 2.1rem;
  font-weight: bold;
  margin-bottom: 18px;
  letter-spacing: 0.5px;
}
.step-container {
  margin-bottom: 20px;
}
.step-description {
  color: #666;
  margin-bottom: 20px;
  line-height: 1.5;
  font-size: 1rem;
}
.reset-form {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
  text-align: left;
}
.reset-form label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #181818;
  font-size: 1.08rem;
  letter-spacing: 0.2px;
}
.reset-form input {
  width: 100%;
  padding: 10px;
  margin-bottom: 16px;
  border-radius: 6px;
  border: 1.5px solid #bfc8d6;
  background: #f8fafc;
  color: #181818;
  font-size: 1.08rem;
  font-weight: 500;
  box-sizing: border-box;
  transition: border-color 0.2s, background 0.2s;
}
.reset-form input:focus {
  border-color: #1e88e5;
  outline: none;
  background: #f5f9ff;
}
.reset-form input::placeholder {
  color: #888;
  opacity: 1;
}
.reset-form button {
  width: 100%;
  padding: 11px;
  background: #1e88e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 17px;
  font-weight: bold;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
  transition: background 0.2s;
}
.reset-form button:hover:not(:disabled) {
  background: #1976d2;
}
.reset-form button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.button-group {
  display: flex;
  gap: 12px;
  margin-top: 10px;
}
.button-group button {
  flex: 1;
  margin-bottom: 0;
}
.btn-secondary {
  background: #f8f9fa !important;
  color: #333 !important;
  border: 2px solid #e1e5e9 !important;
}
.btn-secondary:hover {
  background: #e9ecef !important;
}
.btn-link {
  background: none !important;
  color: #1e88e5 !important;
  padding: 8px 16px !important;
  font-size: 15px !important;
  text-decoration: underline !important;
  border: none !important;
  margin-bottom: 0 !important;
}
.btn-link:hover {
  color: #1976d2 !important;
}
.btn-main {
  width: 100%;
  padding: 11px;
  background: #1e88e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 17px;
  font-weight: bold;
  letter-spacing: 0.5px;
  margin-bottom: 0;
  margin-top: 0;
  transition: background 0.2s;
}
.btn-main:hover {
  background: #1976d2;
}
.btn-green {
  width: 100%;
  padding: 11px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 17px;
  font-weight: bold;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
  margin-top: 0;
  transition: background 0.2s;
}
.btn-green:hover:not(:disabled) {
  background: #218838;
}
.message {
  padding: 12px 16px;
  border-radius: 6px;
  margin: 20px 0;
  font-weight: 500;
  font-size: 1rem;
}
.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}
.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
.message.info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}
.back-to-login {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e1e5e9;
}
@media (max-width: 480px) {
  .modal-card {
    padding: 18px 6px 12px 6px;
    margin: 10px;
    max-width: 98vw;
  }
  .modal-card h2 {
    font-size: 1.3rem;
  }
}
</style> 