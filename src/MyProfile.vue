<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { reactive, watch } from 'vue'

import Present from './components/Present.vue'
import { useUserStore } from './stores/user'

const userStore = useUserStore()
const { profile, error, success } = storeToRefs(userStore)
const presentForm = reactive({
  headline: '',
  description: '',
  url: '',
})

userStore.initializeAuth()

const userForm = reactive({
  name: '',
  discordName: '',
  address: '',
})

watch(
  profile,
  (value) => {
    if (!value) {
      return
    }

    userForm.name = value.name || ''
    userForm.discordName = value.discordName || ''
    userForm.address = value.address || ''
  },
  { immediate: true },
)

async function savePresent() {
  if (!presentForm.headline) {
    error.value = 'Headline is required for a wish.'
    return
  }


  userStore.resetMessages()

  await userStore.saveProfile({
    presents: [
      ...(profile.value?.presents || []),
      {
        headline: presentForm.headline,
        description: presentForm.description,
        url: presentForm.url,
      },

    ],
  })

  presentForm.headline = ''
  presentForm.description = ''
  presentForm.url = ''
}

async function saveChanges() {
  userStore.resetMessages()

  try {
    await userStore.saveProfile({
      name: userForm.name,
      discordName: userForm.discordName,
      address: userForm.address
    })
  } catch {
    error.value = 'Unable to save your profile.'
  }
}
</script>

<template>

  <section>
    <h1>My Profile</h1>
    <p>This is where you can view and edit your profile and see your wishes</p>

    <div v-if="profile" class="profile-card current-profile">
      <h2>Your wishes!</h2>

      <div class="present-cards">
        <template v-for="(present, i) in profile.presents" :key="i">
          <Present :present="present" :index="i" :enable-editing="true" />
        </template>
      </div>

      <h3>Add a wish!</h3>

      <form class="present-form" @submit.prevent="savePresent">
        <label>
          What: <input v-model="presentForm.headline" />
        </label>
        <label>
          Description: <textarea v-model="presentForm.description" rows="2"></textarea>
        </label>
        <label>
          URL: <input v-model="presentForm.url" />
        </label>

        <button type="submit">Save Wish!</button>
      </form>


      <h2>Your profile</h2>

      <div><strong>{{ profile.name }}</strong> ({{ profile.discordName }})</div>
      <div>Email: {{ profile.email || 'None' }}</div>
      <div>Your address: {{ profile.address || 'None' }}</div>
      <div>Receiver: {{ profile.receiver || 'Not assigned' }}</div>
      <div>Receiver address: {{ profile.receiverAddress || 'Not assigned yet' }}</div>

      <h3>Update your profile</h3>

      <form class="edit-form" @submit.prevent="saveChanges">
        <label>
          <span class="text">Name</span>
          <input v-model="userForm.name" />
        </label>

        <label>
          <span class="text">Discord Name</span>
          <input v-model="userForm.discordName" />
        </label>

        <label>
          <span class="text">Address</span>
          <textarea v-model="userForm.address" rows="2"></textarea>
        </label>

        <button type="submit">Save profile</button>
      </form>

      <div v-if="error" class="message error">{{ error }}</div>
      <div v-if="success" class="message success">{{ success }}</div>
    </div>
  </section>
</template>

<style scoped>
.message {
  margin-top: 1rem;
  padding: 0.9rem 1rem;
  border-radius: 10px;
}
</style>
