<script setup lang="ts">

import { onMounted, reactive } from 'vue'

import { useUserStore } from '../stores/user'
import { fetchPrivateUserData } from '../firebase'
import ExcludeUserBlock from '../components/ExludeUserBlock.vue'

const userStore = useUserStore()
const privateData = reactive<Record<string, { address: string | null }>>({})
const loading = reactive<Record<string, boolean>>({})

onMounted(async () => {
  await userStore.refreshUsers()
})

async function revealPrivate(userId: string) {
  loading[userId] = true
  try {
    privateData[userId] = (await fetchPrivateUserData(userId)) ?? { address: null }
  } finally {
    loading[userId] = false
  }
}

</script>

<template>
  <section class="admin-page">

    <button @click="userStore.refreshUsers()">Refresh Users</button>
    <h2>Admin Page</h2>
    <p>Welcome to the admin page. Here you can manage users and view analytics.</p>

    <div class="admin-section">
      <h3>User Management</h3>
      <div class="user-management">
        <div v-for="(user, i) in userStore.users" class="user-card" :key="i">
          <ExcludeUserBlock :user="user" />
          <div class="private-address">
            <button type="button" class="secondary" @click="revealPrivate(user.id)" :disabled="loading[user.id]">
              {{ loading[user.id] ? 'Loading private info...' : 'Reveal private address' }}
            </button>
            <div v-if="privateData[user.id]">
              <p><strong>Private address:</strong> {{ privateData[user.id]?.address || 'None' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.user-management {
  display: grid;
  gap: 2rem;
  grid-template-columns: 1fr 1fr;
}
</style>
