import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './stores/auth.js'
import Login from './Pages/Login.vue'
import Dashboard from './Pages/Dashboard.vue'
import CreateAccount from './Pages/CreateAccount.vue'
import LogorCreate from './Pages/LogorCreate.vue'
import InviteRegister from './Pages/InviteRegister.vue'
import ForgotPassword from './Pages/ForgotPassword.vue'
import ResetPassword from './Pages/ResetPassword.vue'

const routes = [
  {
    path: '/',
    redirect: '/LogorCreate'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { guest: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/createaccount',
    name: 'CreateAccount',
    component: CreateAccount,
    meta: { guest: true }
  },
  {
    path: '/logorcreate',
    name: 'LogorCreate',
    component: LogorCreate,
    meta: { guest: true }
  },
  {
    path: '/invite/:token',
    name: 'InviteRegister',
    component: InviteRegister,
    meta: { guest: true }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: { guest: true }
  },
  {
    path: '/reset-password/:token',
    name: 'ResetPassword',
    component: ResetPassword,
    meta: { guest: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/LogorCreate'
  }
]

const router = createRouter({
  history: createWebHistory('/'),
  routes
})

// Navigation guard
router.beforeEach((to) => {
  const auth = useAuthStore()

  // Protected route — redirect to login if not authenticated
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'LogorCreate' }
  }

  // Guest-only route — redirect to dashboard if already logged in
  if (to.meta.guest && auth.isLoggedIn) {
    return { name: 'Dashboard' }
  }

  // Role-based guard (e.g. meta: { requiresRole: 'admin' })
  if (to.meta.requiresRole && auth.userRole !== to.meta.requiresRole) {
    return { name: 'Dashboard' }
  }
})

export default router
