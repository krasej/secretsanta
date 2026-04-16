<script setup lang="ts">
defineOptions({ name: 'AuthPage' })
import { storeToRefs } from 'pinia'
import { reactive, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

import { useUserStore } from './stores/user'

const router = useRouter()
const userStore = useUserStore()
const { error, success, isLoggedIn } = storeToRefs(userStore)

const authMode = ref<'login' | 'register'>('login')
const form = reactive({
  email: '',
  password: '',
  name: '',
  discordName: '',
  receiver: '',
  presents: '["book", "socks"]',
  address: '',
})

userStore.initializeAuth()

watchEffect(async () => {
  if (isLoggedIn.value) {
    await router.replace('/')
  }
})

function resetForm() {
  form.email = ''
  form.password = ''
  form.name = ''
  form.discordName = ''
  form.receiver = ''
  form.presents = '["book", "socks"]'
  form.address = ''
}

function parsePresents(raw: string) {
  if (!raw.trim()) {
    return []
  }

  return JSON.parse(raw)
}

async function submitForm() {
  userStore.resetMessages()

  if (!form.email || !form.password) {
    error.value = 'Email and password are required.'
    return
  }

  try {
    if (authMode.value === 'login') {
      await userStore.login(form.email, form.password)
    } else {
      if (!form.name || !form.discordName) {
        error.value = 'Name and Discord name are required for registration.'
        return
      }

      let presentsJson: unknown
      try {
        presentsJson = parsePresents(form.presents)
      } catch {
        error.value = 'Presents must be valid JSON.'
        return
      }

      await userStore.register({
        email: form.email,
        password: form.password,
        name: form.name,
        discordName: form.discordName,
        receiver: form.receiver,
        presents: presentsJson,
        address: form.address,
      })
      resetForm()
    }
  } catch {
    error.value = 'Unable to authenticate. Check your Firebase setup and credentials.'
  }
}
</script>

<template>
  <section class="auth-panel">
    <h1>Login</h1>
    <p>Sign in to continue, or register if you do not have an account yet.</p>

    <div class="auth-switch">
      <button type="button" :class="{ active: authMode === 'login' }" @click="authMode = 'login'">
        Login
      </button>
      <button type="button" :class="{ active: authMode === 'register' }" @click="authMode = 'register'">
        Register
      </button>
    </div>

    <form @submit.prevent="submitForm">
      <label>
        Email
        <input v-model="form.email" type="email" required />
      </label>

      <label>
        Password
        <input v-model="form.password" type="password" required />
      </label>

      <template v-if="authMode === 'register'">
        <label>
          Name
          <input v-model="form.name" required />
        </label>

        <label>
          Discord Name
          <input v-model="form.discordName" required />
        </label>

        <label>
          Receiver / Giftee
          <input v-model="form.receiver" />
        </label>

        <label>
          Presents JSON
          <textarea v-model="form.presents" rows="3"></textarea>
        </label>

        <label>
          Your Address
          <textarea v-model="form.address" rows="2"></textarea>
        </label>
      </template>

      <button type="submit">{{ authMode === 'login' ? 'Sign in' : 'Register' }}</button>
    </form>

    <div v-if="error" class="message error">{{ error }}</div>
    <div v-if="success" class="message success">{{ success }}</div>
  </section>
</template>

<style scoped>
.auth-panel {
  border: 1px solid #d0d4db;
  border-radius: 14px;
  padding: 1.5rem;
  background: #fff;
}

.auth-switch {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.auth-switch button {
  background: white;
  color: #1f2937;
  border: 1px solid #cbd5e1;
}

.auth-switch button.active {
  background: #3b82f6;
  color: white;
}

form {
  display: grid;
  gap: 1rem;
}

label {
  display: grid;
  gap: 0.5rem;
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
</style>
