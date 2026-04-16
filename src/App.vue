<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import { useUserStore } from './stores/user'

const router = useRouter()
const userStore = useUserStore()
const { users, isAdmin, isLoggedIn } = storeToRefs(userStore)

userStore.initializeAuth()

function formatPresents(value: unknown) {
  return userStore.formatPresents(value)
}

async function handleSignOut() {
  await userStore.logout()
  await router.push('/login')
}
</script>

<template>
  <main class="app-shell">
    <nav class="top-nav">
      <div class="nav-links">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink v-if="isLoggedIn" to="/my-profile">My Profile</RouterLink>
        <RouterLink v-else to="/login">Login</RouterLink>
      </div>
      <button class="sign-out-button" v-if="isLoggedIn" type="button" @click="handleSignOut">Sign out</button>
    </nav>

    <RouterView />

    <section v-if="isLoggedIn" class="list-panel">
      <h2>{{ isAdmin ? 'All participant profiles' : 'Participant profiles' }}</h2>

      <ul>
        <li v-for="user in users" :key="user.id">
          <strong>{{ user.name }}</strong>
          <div>Discord: {{ user.discordName }}</div>
          <div>Receiver: {{ user.receiver || 'Not assigned' }}</div>
          <div>Presents: <span class="json-value">{{ formatPresents(user.presents) }}</span></div>
        </li>
      </ul>
    </section>
  </main>
</template>

<style></style>
