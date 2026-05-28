<script setup lang="ts">

import { onMounted } from 'vue'

import { useUserStore } from '../stores/user'
import ExcludeUserBlock from '../components/ExludeUserBlock.vue'

const userStore = useUserStore()

onMounted(async () => {
  await userStore.refreshUsers()
})

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
