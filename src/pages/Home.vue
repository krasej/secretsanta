<script setup lang="ts">
import { useUserStore } from '../stores/user'

import Present from '../components/Present.vue'

const userStore = useUserStore()
</script>


<template>
  <section class="home-panel">
    <h1>Home</h1>
    <p>Welcome to the BSC Secret Santa app. Here is everyone participating!</p>


    <div class="profile-cards">
      <div v-for="(user, i) in userStore.users" :key="i" class="profile-card">
        <h2>{{ user.name }}</h2>
        <div><strong>{{ user.name }}</strong> ({{ user.discordName }})</div>

        <div class="present-cards">
          <template v-for="(present, i) in user.presents" :key="i">
            <Present :present="present" />
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="css" scoped>
@media screen and (min-width:980px) {
  .present-cards {
    grid-template-columns: 1fr 1fr 1fr;
  }
}
</style>
