<script setup lang="ts">
defineOptions({ name: 'AuthPage' })
import { storeToRefs } from 'pinia'
import { reactive, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

import { useUserStore } from '../stores/user'
import MessageBlock from '@/components/MessageBlock.vue'

const router = useRouter()
const userStore = useUserStore()
const error = ref('')
const { isLoggedIn } = storeToRefs(userStore)

const authMode = ref<'login' | 'register'>('login')
const form = reactive({
  email: '',
  password: '',
  name: '',
  discordName: '',
})

userStore.initializeAuth()

watchEffect(async () => {
  if (isLoggedIn.value) {
    await router.replace('/my-profile')
  }
})

function resetForm() {
  form.email = ''
  form.password = ''
  form.name = ''
  form.discordName = ''
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

      await userStore.register({
        email: form.email,
        password: form.password,
        name: form.name,
        discordName: form.discordName,
        receiver: '',
        presents: [],
        address: '',
      })
      resetForm()
    }
  } catch {
    error.value = 'Unable to authenticate. Check your credentials.'
  }
}
</script>

<template>
  <section class="auth-panel">
    <h1>Welcome to Secret Santa</h1>
    <h2>Login</h2>
    <p>Sign in to continue, or register if you do not have an account yet.</p>

    <MessageBlock v-if="error" :message="error" type="error" />

    <div class="auth-switch">
      <button type="button" class="primary" :class="{ active: authMode === 'login' }" @click="authMode = 'login'">
        Login
      </button>
      <button type="button" class="register" :class="{ active: authMode === 'register' }"
        @click="authMode = 'register'">
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
      </template>

      <button class="primary" type="submit">{{ authMode === 'login' ? 'Sign in' : 'Register' }}</button>
    </form>
  </section>
</template>

<style scoped>
.auth-switch {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.auth-switch .primary:not(.active) {
  background-color: transparent;
}

.auth-switch .register.active {
  background-color: var(--color-secondary);
  color: white;
}
</style>
