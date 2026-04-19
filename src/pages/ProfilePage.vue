<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { reactive, watch } from 'vue'

import PresentBlock from '../components/PresentBlock.vue'
import MessageBlock from '../components/MessageBlock.vue'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const profileError = reactive({ value: '' })
const profileSuccess = reactive({ value: '' })
const presentError = reactive({ value: '' })
const presentSuccess = reactive({ value: '' })
const { profile } = storeToRefs(userStore)
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
    presentError.value = 'Headline is required for a wish.'
    return
  }

  await userStore.saveProfile({
    presents: [
      ...(profile.value?.presents || []),
      {
        headline: presentForm.headline,
        description: presentForm.description,
        url: presentForm.url,
      },

    ],
  }).then(() => {
    presentSuccess.value = 'Wish saved successfully.'
  }).catch(() => {
    presentError.value = 'Unable to save your wish.'
  })

  presentForm.headline = ''
  presentForm.description = ''
  presentForm.url = ''
}

async function saveChanges() {

  try {
    await userStore.saveProfile({
      name: userForm.name,
      discordName: userForm.discordName,
      address: userForm.address
    }).then(() => {
      profileSuccess.value = 'Profile saved successfully.'
    })
  } catch {
    profileError.value = 'Unable to save your profile.'
  }
}
</script>

<template>

  <section>
    <h1>Your Profile</h1>
    <p>This is where you can view and edit your profile and see your wishes!</p>

    <div v-if="profile" class="profile-card current-profile">
      <h2>Your wishes!</h2>

      <div v-if="profile.presents?.length === 0">You have not added any wishes yet. Add some so your Secret Santa knows
        what to get you!
      </div>

      <div class="present-cards" v-else>
        <template v-for="(present, i) in profile.presents"
          :key="`${i}-${present.headline}-${present.url}-${present.image ?? ''}`">
          <PresentBlock :present="present" :index="i" :enable-editing="true" />
        </template>
      </div>

      <h3>Add a wish!</h3>

      <MessageBlock v-if="presentError.value" :message="presentError.value" type="error" />
      <MessageBlock v-if="presentSuccess.value" :message="presentSuccess.value" type="success" />


      <form class="present-form" @submit.prevent="savePresent">
        <label>
          What: <input v-model="presentForm.headline" />
        </label>
        <label>
          Description: <textarea v-model="presentForm.description" rows="2"></textarea>
        </label>
        <label>
          URL: <input type="url" v-model="presentForm.url" />
        </label>

        <button type="submit" class="primary">Save Wish!</button>
      </form>


      <h2>Your profile</h2>

      <div><strong>{{ profile.name }}</strong> ({{ profile.discordName }})</div>
      <div>Email: {{ profile.email || 'None' }}</div>
      <div>Your address: {{ profile.address || 'None' }}</div>
      <div>Receiver: {{ profile.receiver || 'Not assigned' }}</div>
      <div>Receiver address: {{ profile.receiverAddress || 'Not assigned yet' }}</div>

      <h3>Update your profile</h3>

      <MessageBlock v-if="profileError.value" :message="profileError.value" type="error" />
      <MessageBlock v-if="profileSuccess.value" :message="profileSuccess.value" type="success" />

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

        <button type="submit" class="secondarycolor">Save profile</button>
      </form>
    </div>
  </section>
</template>

<style lang="css" scoped>
@media screen and (min-width:980px) {
  .present-cards {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
