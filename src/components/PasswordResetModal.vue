<template>
  <div class="modal-overlay">
    <div class="modal-card">
      <button class="modal-close" @click="$emit('close')">&times;</button>
      <h2>Recuperar Contraseña</h2>
      <form v-if="step === 1" @submit.prevent="enviarCodigo">
        <label for="email">Email</label>
        <input v-model="email" id="email" type="email" required autocomplete="email" />
        <button type="submit">Enviar código</button>
      </form>
      <form v-else @submit.prevent="cambiarPassword">
        <label for="token">Código recibido</label>
        <input v-model="token" id="token" type="text" required maxlength="6" autocomplete="one-time-code" />
        <label for="newPassword">Nueva contraseña</label>
        <input v-model="newPassword" id="newPassword" type="password" required minlength="8" autocomplete="new-password" />
        <label for="confirmPassword">Repetir contraseña</label>
        <input v-model="confirmPassword" id="confirmPassword" type="password" required minlength="8" autocomplete="new-password" />
        <button type="submit">Cambiar contraseña</button>
      </form>
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">{{ success }}</p>
      <div v-if="step === 2 && !success" style="margin-top: 12px; text-align: center;">
        <button @click="step = 1; error = ''; success = '';" type="button" class="btn-link">Volver a solicitar código</button>
      </div>
    </div>
  </div>
</template>

<script>
import { requestPasswordReset, resetPasswordWithToken } from '@/services/passwordResetService';

export default {
  name: 'PasswordResetModal',
  data() {
    return {
      step: 1,
      email: '',
      token: '',
      newPassword: '',
      confirmPassword: '',
      error: '',
      success: ''
    };
  },
  methods: {
    async enviarCodigo() {
      this.error = '';
      this.success = '';
      if (!this.email) {
        this.error = 'Ingresa tu email.';
        return;
      }
      const res = await requestPasswordReset(this.email);
      if (res.success) {
        this.success = res.message;
        this.step = 2;
      } else {
        this.error = res.message;
      }
    },
    async cambiarPassword() {
      this.error = '';
      this.success = '';
      if (!this.token || !this.newPassword || !this.confirmPassword) {
        this.error = 'Completa todos los campos.';
        return;
      }
      if (this.newPassword.length < 8) {
        this.error = 'La contraseña debe tener al menos 8 caracteres.';
        return;
      }
      if (this.newPassword !== this.confirmPassword) {
        this.error = 'Las contraseñas no coinciden.';
        return;
      }
      const res = await resetPasswordWithToken(this.email, this.token, this.newPassword);
      if (res.success) {
        this.success = res.message;
      } else {
        this.error = res.message;
      }
    }
  }
};
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
}
.modal-card {
  background: #fff;
  border-radius: 16px;
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
.modal-close {
  position: absolute;
  top: 10px;
  right: 14px;
  background: none;
  border: none;
  font-size: 2.1rem;
  color: #d32f2f;
  cursor: pointer;
  z-index: 10;
  padding: 0;
  line-height: 1;
  /* Elimina cualquier transición o efecto de hover */
}
.modal-close:hover {
  color: #d32f2f;
  background: none;
}
h2 {
  color: #1e88e5;
  font-size: 2.1rem;
  font-weight: bold;
  margin-bottom: 18px;
  letter-spacing: 0.5px;
}
label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #181818;
  font-size: 1.08rem;
  letter-spacing: 0.2px;
  text-align: left;
}
input {
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
input:focus {
  border-color: #1e88e5;
  outline: none;
  background: #f5f9ff;
}
input::placeholder {
  color: #888;
  opacity: 1;
}
button {
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
button:hover:not(:disabled) {
  background: #1976d2;
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
.error {
  color: #d32f2f;
  margin-top: 12px;
}
.success {
  color: #388e3c;
  margin-top: 12px;
}
</style> 