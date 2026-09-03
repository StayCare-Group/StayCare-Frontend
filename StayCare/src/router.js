import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './stores/auth.js'
import i18n from './i18n/index.js'
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
    meta: {
      guest: true,
      titleKey: 'seo.loginTitle',
      descriptionKey: 'seo.loginDescription'
    }
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
    redirect: '/LogorCreate'
    // component: CreateAccount,
    // meta: {
    //   guest: true,
    //   titleKey: 'seo.createAccountTitle',
    //   descriptionKey: 'seo.createAccountDescription'
    // }
  },
  {
    path: '/logorcreate',
    name: 'LogorCreate',
    component: LogorCreate,
    meta: {
      guest: true,
      titleKey: 'seo.homeTitle',
      descriptionKey: 'seo.homeDescription'
    }
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
    meta: {
      guest: true,
      titleKey: 'seo.forgotPasswordTitle'
    }
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

// Dynamic SEO head guard
router.afterEach((to) => {
  const t = i18n.global.t
  const titleKey = to.meta?.titleKey
  const descriptionKey = to.meta?.descriptionKey

  if (titleKey && t(titleKey)) {
    document.title = t(titleKey)
  } else {
    document.title = t('seo.defaultTitle')
  }

  if (descriptionKey && t(descriptionKey)) {
    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.setAttribute('name', 'description')
      document.head.appendChild(metaDesc)
    }
    metaDesc.setAttribute('content', t(descriptionKey))
  }
})

export default router
