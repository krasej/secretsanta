<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  getAllUsers,
  getCurrentUser,
  getUserProfile,
  loginUser,
  onAuthStateChange,
  registerUser,
  signOutUser,
  type FirebaseUser,
  type UserProfile,
} from './firebase'

const authMode = ref<'login' | 'register'>('login')
const currentUser = ref<FirebaseUser | null>(null)
const profile = ref<UserProfile | null>(null)
const users = ref<UserProfile[]>([])
const error = ref('')
const success = ref('')

const form = reactive({
  email: '',
  password: '',
  name: '',
  discordName: '',
  giftee: '',
  presents: '',
  address: '',
})

const isAdmin = computed(() => profile.value?.role === 'admin')
const isLoggedIn = computed(() => Boolean(currentUser.value))

function resetMessages() {
  error.value = ''
  success.value = ''
}

function resetForm() {
  form.email = ''
  form.password = ''
  form.name = ''
  form.discordName = ''
  form.giftee = ''
  form.presents = ''
  form.address = ''
}

async function refreshProfile(user: FirebaseUser) {
  profile.value = await getUserProfile(user.uid)
}

async function refreshUsers() {
  if (!isAdmin.value) {
    users.value = []
    return
  }

  users.value = await getAllUsers()
}

async function submitForm() {
  resetMessages()

  if (!form.email || !form.password) {
    error.value = 'Email and password are required.'
    return
  }

  try {
    if (authMode.value === 'login') {
      currentUser.value = await loginUser(form.email, form.password)
      success.value = 'Signed in successfully.'
    } else {
      if (!form.name || !form.discordName) {
        error.value = 'Name and Discord name are required for registration.'
        return
      }

      currentUser.value = await registerUser(form.email, form.password, {
        name: form.name,
        discordName: form.discordName,
        giftee: form.giftee,
        presents: form.presents,
        address: form.address,
      })
      success.value = 'Account created successfully.'
    }

    if (currentUser.value) {
      await refreshProfile(currentUser.value)
      await refreshUsers()
      resetForm()
    }
  } catch {
    error.value = 'Unable to authenticate. Check your Firebase setup and credentials.'
  }
}

async function handleSignOut() {
  resetMessages()

  try {
    await signOutUser()
    currentUser.value = null
    profile.value = null
    users.value = []
    success.value = 'Signed out successfully.'
  } catch {
    error.value = 'Unable to sign out.'
  }
}

onAuthStateChange(async (user) => {
  currentUser.value = user

  if (user) {
    await refreshProfile(user)
    await refreshUsers()
  } else {
    profile.value = null
    users.value = []
  }
})

const existingUser = getCurrentUser()
if (existingUser) {
  currentUser.value = existingUser
  refreshProfile(existingUser)
  refreshUsers()
}
</script>

<template>
  <main class="app-shell">
    <section class="form-panel">
      <h1>Secret Santa Auth</h1>
      <p>Sign in or register with Firebase. Admin users can view the full participant list.</p>

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
            Giftee
            <input v-model="form.giftee" />
          </label>

          <label>
            Presents
            <input v-model="form.presents" placeholder="Example: book, mug, socks" />
          </label>

          <label>
            Address
            <textarea v-model="form.address" rows="2"></textarea>
          </label>
        </template>

        <button type="submit">{{ authMode === 'login' ? 'Sign in' : 'Register' }}</button>
      </form>

      <div v-if="error" class="message error">{{ error }}</div>
      <div v-if="success" class="message success">{{ success }}</div>

      <div v-if="profile" class="profile-card current-profile">
        <h2>Signed in as</h2>
        <div><strong>{{ profile.name }}</strong> ({{ profile.discordName }})</div>
        <div>{{ profile.email }}</div>
        <div>Role: {{ profile.role || 'user' }}</div>
        <button type="button" @click="handleSignOut">Sign out</button>
      </div>
    </section>

    <section v-if="isLoggedIn" class="list-panel">
      <h2>{{ isAdmin ? 'All registered users' : 'Your profile' }}</h2>
      <p v-if="!isAdmin">Only admins can see the complete list.</p>

      <ul v-if="isAdmin">
        <li v-for="user in users" :key="user.id">
          <strong>{{ user.name }}</strong>
          <div>Email: {{ user.email }}</div>
          <div>Discord: {{ user.discordName }}</div>
          <div>Role: {{ user.role || 'user' }}</div>
          <div>Giftee: {{ user.giftee || 'Not assigned' }}</div>
          <div>Presents: {{ user.presents || 'None' }}</div>
          <div>Address: {{ user.address || 'None' }}</div>
        </li>
      </ul>

      <div v-else class="profile-card">
        <strong>{{ profile?.name }}</strong>
        <div>Email: {{ profile?.email }}</div>
        <div>Discord: {{ profile?.discordName }}</div>
        <div>Giftee: {{ profile?.giftee || 'Not assigned' }}</div>
        <div>Presents: {{ profile?.presents || 'None' }}</div>
        <div>Address: {{ profile?.address || 'None' }}</div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.app-shell {
  display: grid;
  gap: 2rem;
  max-width: 920px;
  margin: 0 auto;
  padding: 2rem;
}

.form-panel,
.list-panel {
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

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 1rem;
}

li,
.profile-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
}

.current-profile {
  margin-top: 1rem;
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
