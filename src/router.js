import Vue from "vue"
import Router from "vue-router"
import Login from "@/components/Login.vue"
import HomeEnfermera from "@/components/HomeEnfermera.vue"
import HomePaciente from "@/components/HomePaciente.vue"
import AdminPanel from "@/components/AdminPanel.vue"
import CreateAdmin from "@/components/CreateAdmin.vue"
import AdminLogin from "@/components/AdminLogin.vue"
import { ROUTES, ROLES } from "@/config/constants"
import { getCurrentUser, getRouteByRole } from "@/utils/helpers"

Vue.use(Router)

// Configuración de rutas
const routes = [
  { path: ROUTES.HOME, component: Login },
  { 
    path: ROUTES.ENFERMERA, 
    component: HomeEnfermera,
    meta: { requiresAuth: true, role: ROLES.ENFERMERA }
  },
  { 
    path: ROUTES.PACIENTE, 
    component: HomePaciente,
    meta: { requiresAuth: true, role: ROLES.PACIENTE }
  },
  { 
    path: ROUTES.ADMIN, 
    component: AdminPanel,
    meta: { requiresAuth: true, role: ROLES.ADMIN }
  },
  { 
    path: ROUTES.CREATE_ADMIN, 
    component: CreateAdmin
  },
  { 
    path: ROUTES.LOGIN_ADMIN, 
    component: AdminLogin
  },
  { 
    path: ROUTES.REGISTER_ADMIN, 
    component: CreateAdmin
  },
  { path: "*", redirect: ROUTES.HOME }
]

const router = new Router({
  mode: "history",
  routes
})

// Manejar errores de navegación duplicada
const originalPush = router.push
router.push = function push(location) {
  return originalPush.call(this, location).catch(err => {
    if (err.name !== 'NavigationDuplicated') throw err
  })
}

// Guardia de navegación para proteger rutas
router.beforeEach((to, from, next) => {
  const usuario = getCurrentUser()
  
  if (to.meta.requiresAuth) {
    if (!usuario) {
      // No hay usuario autenticado, redirigir al login
      next(ROUTES.HOME)
    } else if (to.meta.role && usuario.rol !== to.meta.role) {
      // Usuario no tiene el rol correcto, redirigir según su rol
      next(getRouteByRole(usuario.rol))
    } else {
      // Usuario autenticado y con rol correcto
      next()
    }
  } else {
    // Ruta pública (login)
    if (usuario) {
      // Usuario ya autenticado, redirigir según su rol
      next(getRouteByRole(usuario.rol))
    } else {
      next()
    }
  }
})

export default router 