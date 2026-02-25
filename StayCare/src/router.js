import { createRouter, createWebHistory } from 'vue-router'
import Login from './Pages/Login.vue'
import Dashboard from './Pages/Dashboard.vue'
import CreateAccount from './Pages/CreateAccount.vue'
import LogorCreate from './Pages/LogorCreate.vue'

const routes = [
  {
    path: '/',
    redirect: '/LogorCreate'
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
  },
  {
    path: '/createaccount',
    name: 'CreateAccount',
    component: CreateAccount
  },
  {
    path: '/logorcreate',
    name: 'LogorCreate',
    component: LogorCreate
  }
]

const router = createRouter({
  history: createWebHistory('/'),
  routes
})

export default router
