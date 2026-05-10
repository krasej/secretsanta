import { createRouter, createWebHistory } from 'vue-router'

import { getCurrentUser } from '../firebase'
import { useUserStore } from '../stores/user'
import AuthPage from '../pages/AuthPage.vue'
import Home from '../pages/HomePage.vue'
import MyProfile from '../pages/ProfilePage.vue'
import YourGiftee from '../pages/RecieverPage.vue'
import AdminPage from '../pages/AdminPage.vue'

const routes = [
  { path: '/', component: Home, meta: { requiresAuth: true } },
  { path: '/login', component: AuthPage, meta: { guestOnly: true } },
  { path: '/my-profile', component: MyProfile, meta: { requiresAuth: true } },
  { path: '/your-giftee', component: YourGiftee, meta: { requiresAuth: true } },
  { path: '/admin', component: AdminPage, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const user = getCurrentUser()
  const isAdmin = useUserStore().isAdmin

  if (to.meta.requiresAdmin && !isAdmin) {
    return '/'
  }

  if (to.meta.requiresAuth && !user) {
    return '/login'
  }

  if (to.meta.guestOnly && user) {
    return '/'
  }

  return true
})

export default router
