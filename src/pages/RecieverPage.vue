<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'

import Present from '../components/PresentBlock.vue'
import { useUserStore } from '../stores/user'
import { fetchPrivateUserData } from '../firebase'

const userStore = useUserStore()
const { profile, error, success } = storeToRefs(userStore)

userStore.initializeAuth()

const eligibleUsers = computed(() => {
  if (!profile.value) {
    return []
  }

  return userStore.users.filter((user) => {
    return (
      user.id !== profile.value?.id &&
      !(profile.value?.excludedReceiverIds ?? []).includes(user.id) &&
      !user.hasSecretSanta
    )
  })
})

const receiverAddress = ref<string | null>(null)
const addressLoading = ref(false)
const addressError = ref('')

const receiverProfile = computed(() => {
  if (!profile.value?.receiver) {
    return null
  }

  return userStore.users.find((user) => user.name === profile.value?.receiver) ?? null
})

async function revealReceiverAddress() {
  if (!receiverProfile.value?.id) {
    addressError.value = 'Unable to load receiver address.'
    return
  }

  addressLoading.value = true
  addressError.value = ''

  try {
    const privateData = await fetchPrivateUserData(receiverProfile.value.id)
    receiverAddress.value = privateData?.address ?? null
  } catch {
    addressError.value = 'Unable to fetch receiver address.'
  } finally {
    addressLoading.value = false
  }
}

async function assignGiftee() {
  if (!profile.value) {
    return
  }

  userStore.resetMessages()

  if (!eligibleUsers.value.length) {
    error.value = 'No eligible giftees are available right now.'
    return
  }

  const selectedUser = eligibleUsers.value[Math.floor(Math.random() * eligibleUsers.value.length)]

  if (!selectedUser) {
    error.value = 'No eligible giftees are available right now. :c'
    return
  }

  const privateData = await fetchPrivateUserData(selectedUser.id)

  await userStore.saveProfile({
    receiver: selectedUser.name,
  })

  if (privateData?.address) {
    receiverAddress.value = privateData.address
  }

  await userStore.setUserHasSecretSanta(selectedUser.id, true)
  success.value = `${selectedUser.name} has been marked as assigned.`
}
</script>

<template>
  <section>
    <h1>Your Giftee</h1>

    <div v-if="profile?.receiver">
      <p>You are getting a great gift for <strong>{{ profile.receiver }}</strong>.</p>
      <p>
        Delivery address:
        <strong v-if="receiverAddress">
          {{ receiverAddress }}
        </strong>
        <span v-else>Not loaded</span>
      </p>
      <button v-if="!receiverAddress" class="secondary" type="button" @click="revealReceiverAddress"
        :disabled="addressLoading">
        {{ addressLoading ? 'Loading address...' : 'Reveal address' }}
      </button>
      <div v-if="addressError" class="message error">{{ addressError }}</div>

      <div v-if="receiverProfile?.presents?.length" class="present-cards">
        <Present v-for="(present, index) in receiverProfile.presents" :key="index" :present="present" />
      </div>

      <p v-else>Your receiver has not added any wishes yet.</p>
    </div>

    <p v-else> <button @click="assignGiftee">Assign me a giftee</button></p>

    <div v-if="error" class="message error">{{ error }}</div>
    <div v-if="success" class="message success">{{ success }}</div>
  </section>
</template>
