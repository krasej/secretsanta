<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { createUser, getUsers, type User } from './firebase'

const form = reactive({
  name: '',
  discordName: '',
  password: '',
  giftee: '',
  presents: '',
  address: '',
})

const users = ref<User[]>([])
const error = ref('')
const success = ref('')

async function loadUsers() {
  try {
    users.value = await getUsers()
  } catch (err) {
    error.value = 'Unable to load users. Check Firebase setup.'
  }
}

async function submitForm() {
  error.value = ''
  success.value = ''

  if (!form.name || !form.discordName || !form.password) {
    error.value = 'Name, Discord name, and password are required.'
    return
  }

  try {
    await createUser({
      name: form.name,
      discordName: form.discordName,
      password: form.password,
      giftee: form.giftee,
      presents: form.presents,
      address: form.address,
    })

    success.value = 'User registered successfully.'
    form.name = ''
    form.discordName = ''
    form.password = ''
    form.giftee = ''
    form.presents = ''
    form.address = ''
    await loadUsers()
  } catch (err) {
    error.value = 'Unable to save user. Check Firebase setup.'
  }
}

onMounted(loadUsers)
</script>

<template>
  <main class="app-shell">
    <section class="form-panel">
      <h1>Secret Santa Registration</h1>
      <p>Create users with the fields required for your Secret Santa app.</p>

      <form @submit.prevent="submitForm">
        <label>
          Name
          <input v-model="form.name" required />
        </label>

        <label>
          Discord Name
          <input v-model="form.discordName" required />
        </label>

        <label>
          Password
          <input type="password" v-model="form.password" required />
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

        <button type="submit">Save user</button>
      </form>

      <div class="message error" v-if="error">{{ error }}</div>
      <div class="message success" v-if="success">{{ success }}</div>
    </section>

    <section class="list-panel">
      <h2>Registered Secret Santa Users</h2>
      <p v-if="users.length === 0">No users yet.</p>
      <ul>
        <li v-for="user in users" :key="user.id">
          <strong>{{ user.name }}</strong>
          <div>Discord: {{ user.discordName }}</div>
          <div>Giftee: {{ user.giftee || 'Not assigned' }}</div>
          <div>Presents: {{ user.presents || 'None' }}</div>
          <div>Address: {{ user.address || 'None' }}</div>
        </li>
      </ul>
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

li {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
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
