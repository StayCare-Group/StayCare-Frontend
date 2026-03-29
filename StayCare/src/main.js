import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router.js'
import i18n from './i18n/index.js'
import './index.css'
import 'leaflet/dist/leaflet.css'
import { useAuthStore } from './stores/auth.js'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(i18n)

// Restore session BEFORE registering the router so that navigation guards
// run with the correct auth state and don't redirect an authenticated user
// to the login screen on a page refresh.
const auth = useAuthStore()
auth.tryRefresh().then(() => {
  app.use(router)
  app.mount('#app')
})
