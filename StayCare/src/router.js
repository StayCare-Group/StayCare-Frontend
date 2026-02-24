import { createRouter, createWebHistory } from 'vue-router'
import Login from './Pages/Login.vue'
import Dashboard from './Pages/Dashboard.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard
  }
]

const router = createRouter({
  history: createWebHistory('/'),
  routes
})

export default router
