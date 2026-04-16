<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { reactive, watch } from 'vue'

import { useUserStore } from './stores/user'

const userStore = useUserStore()
const { profile, error, success } = storeToRefs(userStore)

userStore.initializeAuth()

const form = reactive({
  name: '',
  discordName: '',
  address: '',
  presents: '[]',
})

watch(
  profile,
  (value) => {
    if (!value) {
      return
    }

    form.name = value.name || ''
    form.discordName = value.discordName || ''
    form.address = value.address || ''
    form.presents = JSON.stringify(value.presents ?? [], null, 2)
  },
  { immediate: true },
)

function formatPresents(value: unknown) {
  return userStore.formatPresents(value)
}

async function saveChanges() {
  userStore.resetMessages()

  let presentsJson: unknown
  try {
    presentsJson = form.presents.trim() ? JSON.parse(form.presents) : []
  } catch {
    error.value = 'Presents must be valid JSON.'
    return
  }

  try {
    await userStore.saveProfile({
      name: form.name,
      discordName: form.discordName,
      address: form.address,
      presents: presentsJson,
    })
  } catch {
    error.value = 'Unable to save your profile.'
  }
}
</script>

<template>
  <section>
    <h1>My Profile</h1>
    <p>This is where you can view and edit your profile details.</p>

    <div v-if="profile" class="profile-card current-profile">
      <h2>Your private profile</h2>
      <div><strong>{{ profile.name }}</strong> ({{ profile.discordName }})</div>
      <div>Email: {{ profile.email || 'None' }}</div>
      <div>Your address: {{ profile.address || 'None' }}</div>
      <div>Receiver: {{ profile.receiver || 'Not assigned' }}</div>
      <div>Receiver address: {{ profile.receiverAddress || 'Not assigned yet' }}</div>
      <div>Presents: <span class="json-value">{{ formatPresents(profile.presents) }}</span></div>
      <div>Role: {{ profile.role || 'user' }}</div>

      <form class="edit-form" @submit.prevent="saveChanges">
        <label>
          Name
          <input v-model="form.name" />
        </label>

        <label>
          Discord Name
          <input v-model="form.discordName" />
        </label>

        <label>
          Address
          <textarea v-model="form.address" rows="2"></textarea>
        </label>

        <label>
          Presents JSON
          <textarea v-model="form.presents" rows="6"></textarea>
        </label>

        <button type="submit">Save profile</button>
      </form>

      <div v-if="error" class="message error">{{ error }}</div>
      <div v-if="success" class="message success">{{ success }}</div>
    </div>
  </section>
</template>

<style scoped>
.edit-form {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

label {
  display: grid;
  gap: 0.4rem;
  font-weight: 600;
}

input,
textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #c0c4cc;
  border-radius: 8px;
  font: inherit;
}

button {
  width: fit-content;
  padding: 0.8rem 1.2rem;
  border: none;
  border-radius: 999px;
  background: #3b82f6;
  color: white;
  font-weight: 700;
  cursor: pointer;
}

.message {
  margin-top: 1rem;
  padding: 0.9rem 1rem;
  border-radius: 10px;
}

.error {
  background: #fee2e2;
  color: #991b1b;
}

.success {
  background: #ecfdf5;
  color: #166534;
}

.json-value {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
