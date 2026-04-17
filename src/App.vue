<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import { useUserStore } from './stores/user'

const router = useRouter()
const userStore = useUserStore()
const { isAdmin, isLoggedIn } = storeToRefs(userStore)

userStore.initializeAuth()


async function handleSignOut() {
  await userStore.logout()
  await router.push('/login')
}
</script>

<template>
  <main class="app-shell">
    <nav v-if="isLoggedIn" class="top-nav">
      <div class="nav-links">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/my-profile">My Profile</RouterLink>
        <RouterLink v-if="isAdmin" to="/my-profile">Admin</RouterLink>
        <RouterLink to="/your-giftee">Your Giftee</RouterLink>
      </div>
      <button class="sign-out-button" v-if="isLoggedIn" type="button" @click="handleSignOut">Sign out</button>
    </nav>

    <RouterView />

  </main>
</template>

<style></style>
