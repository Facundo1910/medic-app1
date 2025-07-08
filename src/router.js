import Vue from "vue";
import Router from "vue-router";
import Login from "@/components/Login.vue";
import HomeEnfermera from "@/components/HomeEnfermera.vue";
import HomePaciente from "@/components/HomePaciente.vue";

Vue.use(Router);

const router = new Router({
  mode: "history",
  routes: [
    { path: "/", component: Login },
    { 
      path: "/enfermera", 
      component: HomeEnfermera,
      meta: { requiresAuth: true, role: 'enfermera' }
    },
    { 
      path: "/paciente", 
      component: HomePaciente,
      meta: { requiresAuth: true, role: 'paciente' }
    },
    { path: "*", redirect: "/" }
  ]
});

// Manejar errores de navegación duplicada
const originalPush = router.push;
router.push = function push(location) {
  return originalPush.call(this, location).catch(err => {
    if (err.name !== 'NavigationDuplicated') throw err;
  });
};

// Guardia de navegación para proteger rutas
router.beforeEach((to, from, next) => {
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
  
  if (to.meta.requiresAuth) {
    if (!usuario) {
      // No hay usuario autenticado, redirigir al login
      next('/');
    } else if (to.meta.role && usuario.rol !== to.meta.role) {
      // Usuario no tiene el rol correcto, redirigir según su rol
      if (usuario.rol === 'enfermera') {
        next('/enfermera');
      } else {
        next('/paciente');
      }
    } else {
      // Usuario autenticado y con rol correcto
      next();
    }
  } else {
    // Ruta pública (login)
    if (usuario) {
      // Usuario ya autenticado, redirigir según su rol
      if (usuario.rol === 'enfermera') {
        next('/enfermera');
      } else {
        next('/paciente');
      }
    } else {
      next();
    }
  }
});

export default router; 