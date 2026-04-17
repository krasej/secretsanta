import { createRouter, createWebHistory } from 'vue-router'

import AuthPage from '../Auth.vue'
import Home from '../Home.vue'
import MyProfile from '../MyProfile.vue'
import { getCurrentUser } from '../firebase'

const routes = [
  { path: '/', component: Home, meta: { requiresAuth: true } },
  { path: '/login', component: AuthPage, meta: { guestOnly: true } },
  { path: '/my-profile', component: MyProfile, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const user = getCurrentUser()

  if (to.meta.requiresAuth && !user) {
    return '/login'
  }

  if (to.meta.guestOnly && user) {
    return '/'
  }

  return true
})

export default router
