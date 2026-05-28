<script setup lang="ts">

import { computed, ref } from 'vue'

import { useUserStore } from '../stores/user'
import { updateUserProfile } from '../firebase'

import type { UserProfile } from '../firebase'

const props = defineProps<{ user: UserProfile }>()

const userStore = useUserStore()

const excludedUsers = computed(() => {
  const ids = props.user?.excludedReceiverIds ?? []
  return ids
    .map((id) => userStore.getUserById(id))
    .filter((u): u is UserProfile => u !== null)
})

const potentialExcludedUsers = computed(() => {
  const excludedIds = new Set(props.user?.excludedReceiverIds ?? [])
  return userStore.users.filter(
    (potentialUser) =>
      potentialUser.id !== props.user.id &&
      !excludedIds.has(potentialUser.id),
  )
})

const selectedUserId = ref<string>('')
const isRefreshing = ref(false)

async function removeExcludedUser(userId: string) {
  if (!userId || !props.user || isRefreshing.value) return

  const currentExcluded = props.user.excludedReceiverIds ?? []
  if (!currentExcluded.includes(userId)) return

  isRefreshing.value = true
  try {
    const updatedIds = currentExcluded.filter((id) => id !== userId)
    await updateUserProfile(props.user.id, { excludedReceiverIds: updatedIds })
    await userStore.refreshUsers()
  } finally {
    isRefreshing.value = false
  }
}

async function addExcludedUser(userId: string) {
  if (!userId || !props.user || isRefreshing.value) return

  const currentExcluded = props.user.excludedReceiverIds ?? []
  if (currentExcluded.includes(userId)) return

  isRefreshing.value = true
  try {
    const updatedIds = [...currentExcluded, userId]
    await updateUserProfile(props.user.id, { excludedReceiverIds: updatedIds })
    await userStore.refreshUsers()
    selectedUserId.value = ''
  } finally {
    isRefreshing.value = false
  }
}

</script>

<template>
  <div class="exclude-user-card">
    <h3 class="exclude-user-card--title">
      {{ user.name }}
    </h3>
    <div class="exclude-user-card--description">
      <div v-for="excludedUser in excludedUsers" :key="excludedUser.id">
        {{ excludedUser.name }} <button class="button delete" @click="removeExcludedUser(excludedUser.id)"
          :disabled="isRefreshing">&times;</button>
      </div>
    </div>


    <form class="exclude-user-card-form">
      <select class="exclude-user-card-form--select" v-model="selectedUserId">
        <option value="">Select a user to exclude</option>
        <option v-for="potentialExcludedUser in potentialExcludedUsers" :key="potentialExcludedUser.id"
          :value="potentialExcludedUser.id" :disabled="potentialExcludedUser.id === user.id">
          {{ potentialExcludedUser.name }}
        </option>
      </select>
      <div class="exclude-user-card-form--button">
        <button type="submit" :disabled="isRefreshing || !selectedUserId"
          @click.prevent="addExcludedUser(selectedUserId)">
          {{ 'Add' }}
        </button>
      </div>
    </form>

  </div>
</template>
