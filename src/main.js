import Vue from 'vue'
import App from './App.vue'
import router from "./router"

// Configuración de Vue para desarrollo
Vue.config.productionTip = false

// Instancia principal de Vue
new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
