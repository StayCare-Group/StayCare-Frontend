import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router.js'
import './index.css'
import { useAuthStore } from './stores/auth.js'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Try to restore session from refresh token cookie before mounting
const auth = useAuthStore()
auth.tryRefresh().then(() => {
  app.mount('#app')
})
