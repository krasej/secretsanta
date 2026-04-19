import { createRouter, createWebHistory } from 'vue-router'

import { getCurrentUser } from '../firebase'
import AuthPage from '../pages/AuthPage.vue'
import Home from '../pages/HomePage.vue'
import MyProfile from '../pages/ProfilePage.vue'
import YourGiftee from '../pages/RecieverPage.vue'

const routes = [
  { path: '/', component: Home, meta: { requiresAuth: true } },
  { path: '/login', component: AuthPage, meta: { guestOnly: true } },
  { path: '/my-profile', component: MyProfile, meta: { requiresAuth: true } },
  { path: '/your-giftee', component: YourGiftee, meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
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
