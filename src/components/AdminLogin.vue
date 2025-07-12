<template>
  <div class="modal-overlay">
    <div class="modal-content animate-in">
      <button class="modal-close" @click="cerrarModal">&times;</button>
      <h2>🔧 Ingreso Administrador</h2>
      <form @submit.prevent="loginAdmin">
        <label for="adminEmail">Email</label>
        <input v-model="email" id="adminEmail" type="email" required placeholder="admin@ejemplo.com" />
        <label for="adminClave">Clave</label>
        <input v-model="clave" id="adminClave" type="password" required placeholder="Clave" />
        <button type="submit">Ingresar</button>
      </form>
      <p v-if="error" class="error">{{ error }}</p>
      <div style="margin-top: 14px; text-align: center;">
        <router-link to="/register-admin" style="color: #1e88e5; text-decoration: underline; font-size: 14px;">Registrarse como administrador</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default {
  name: "AdminLogin",
  data() {
    return {
      email: "",
      clave: "",
      error: ""
    };
  },
  methods: {
    async loginAdmin() {
      this.error = "";
      try {
        const qAdmin = query(
          collection(db, "admins"),
          where("email", "==", this.email),
          where("clave", "==", this.clave)
        );
        const adminSnapshot = await getDocs(qAdmin);
        if (!adminSnapshot.empty) {
          const admin = adminSnapshot.docs[0].data();
          admin.rol = 'admin';
          admin.id = adminSnapshot.docs[0].id;
          localStorage.setItem('usuario', JSON.stringify(admin));
          this.$router.push("/admin");
        } else {
          this.error = "Email o clave incorrectos";
        }
      } catch (e) {
        this.error = "Error al conectar con la base de datos";
      }
    },
    cerrarModal() {
      this.$router.push('/');
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  min-height: 100vh;
}
.modal-content {
  background: #fff;
  padding: 32px 28px 22px 28px;
  border-radius: 16px;
  min-width: 380px;
  max-width: 95vw;
  box-shadow: 0 8px 32px rgba(30,136,229,0.13);
  position: relative;
  text-align: left;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fadeInUp 0.4s cubic-bezier(.4,0,.2,1);
}
.animate-in {
  animation: fadeInUp 0.4s cubic-bezier(.4,0,.2,1);
}
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.modal-close {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #e53935;
  font-weight: bold;
  transition: color 0.2s;
  z-index: 10;
  padding: 4px;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-close:hover {
  color: #b71c1c;
  background: #fbe9e7;
}
h2 {
  text-align: center;
  color: #222;
  margin-bottom: 22px;
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}
label {
  display: block;
  margin-bottom: 6px;
  font-weight: bold;
  font-size: 1rem;
  color: #222;
}
input {
  width: 100%;
  max-width: 340px;
  padding: 12px 18px;
  margin-bottom: 16px;
  border-radius: 6px;
  border: 1.5px solid #b3c6e0;
  background: #f6f8fc;
  color: #181818;
  font-size: 1.08rem;
  font-weight: 500;
  transition: border 0.2s;
  text-align: center;
  display: block;
  margin-left: auto;
  margin-right: auto;
}
input:focus {
  border-color: #1e88e5;
  outline: none;
  background: #fff;
}
button[type="submit"] {
  width: 100%;
  padding: 12px;
  background: linear-gradient(90deg, #2d4fff 60%, #1e88e5 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin-top: 8px;
  box-shadow: 0 2px 8px rgba(45,79,255,0.10);
  transition: background 0.2s;
}
button[type="submit"]:hover {
  background: linear-gradient(90deg, #1e88e5 60%, #2d4fff 100%);
}
.error {
  color: #c00;
  margin-top: 10px;
  font-weight: bold;
  font-size: 1.05rem;
  text-align: center;
}
form {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
@media (max-width: 768px) {
  .modal-content {
    padding: 18px 4vw 12px 4vw;
    min-width: 0;
    max-width: 98vw;
  }
  h2 {
    font-size: 1.2rem;
  }
  label {
    font-size: 0.95rem;
  }
  input {
    font-size: 1rem;
    padding: 10px 10px;
    max-width: 100%;
  }
  button[type="submit"] {
    font-size: 15px;
    padding: 10px;
  }
  .modal-close {
    font-size: 20px;
    width: 28px;
    height: 28px;
    top: 6px;
    right: 8px;
  }
}
</style> 