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
      <button v-if="isLoggedIn" type="button" @click="handleSignOut">Sign out</button>
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

<style>
.app-shell {
  display: grid;
  gap: 2rem;
  max-width: 920px;
  margin: 0 auto;
  padding: 2rem;
}

.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.nav-links {
  display: flex;
  gap: 1rem;
}

.list-panel {
  border: 1px solid #d0d4db;
  border-radius: 14px;
  padding: 1.5rem;
  background: #fff;
}

button {
  width: fit-content;
  padding: 0.9rem 1.4rem;
  border: none;
  border-radius: 999px;
  background: #3b82f6;
  color: white;
  font-weight: 700;
  cursor: pointer;
}

button:hover {
  background: #2563eb;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 1rem;
}

li {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
}

.json-value {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
