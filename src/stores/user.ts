import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import {
  deleteUser as deleteFirebaseUser,
  getAllUsers,
  getCurrentUser,
  getUserProfile,
  loginUser,
  onAuthStateChange,
  registerUser,
  signOutUser,
  updateUserProfile,
  type FirebaseUser,
  type PresentsJson,
  type UserProfile,
} from '../firebase'

type RegisterPayload = {
  email: string
  password: string
  name: string
  discordName: string
  receiver?: string
  presents?: PresentsJson
  address?: string
  hasSecretSanta?: boolean
  excludedReceiverIds?: string[]
}

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<FirebaseUser | null>(null)
  const profile = ref<UserProfile | null>(null)
  const users = ref<UserProfile[]>([])
  const error = ref('')
  const success = ref('')
  const initialized = ref(false)

  const isAdmin = computed(() => profile.value?.role === 'admin')
  const isLoggedIn = computed(() => Boolean(currentUser.value))

  function resetMessages() {
    error.value = ''
    success.value = ''
  }

  function clearUserState() {
    currentUser.value = null
    profile.value = null
    users.value = []
  }

  function getUserById(userId: string) {
    return users.value.find((user) => user.id === userId) || null
  }

  function formatPresents(value: unknown) {
    if (value == null || value === '') {
      return 'None'
    }

    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === 'object' && item !== null) {
            const present = item as { headline?: string; link?: string; url?: string }
            return `${present.headline || 'Untitled'} — ${present.link || 'Link'}: ${present.url || 'No URL'}`
          }
          return String(item)
        })
        .join('\n')
    }

    return typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  }

  async function refreshProfile(user: FirebaseUser) {
    profile.value = await getUserProfile(user.uid)
  }

  async function refreshUsers() {
    users.value = await getAllUsers()
  }

  async function login(email: string, password: string) {
    resetMessages()
    currentUser.value = await loginUser(email, password)

    if (currentUser.value) {
      await refreshProfile(currentUser.value)
      await refreshUsers()
    }

    success.value = 'Signed in successfully.'
  }

  async function register(payload: RegisterPayload) {
    resetMessages()
    currentUser.value = await registerUser(payload.email, payload.password, {
      name: payload.name,
      discordName: payload.discordName,
      receiver: payload.receiver ?? '',
      presents: payload.presents ?? [],
      address: payload.address ?? '',
      hasSecretSanta: payload.hasSecretSanta ?? false,
      excludedReceiverIds: payload.excludedReceiverIds ?? [],
    })

    if (currentUser.value) {
      await refreshProfile(currentUser.value)
      await refreshUsers()
    }
  }

  async function saveProfile(updates: Partial<UserProfile>) {
    if (!currentUser.value) {
      throw new Error('No signed in user')
    }

    resetMessages()
    await updateUserProfile(currentUser.value.uid, updates)
    await refreshProfile(currentUser.value)
    await refreshUsers()
  }

  async function setUserHasSecretSanta(userId: string, value = true) {
    await updateUserProfile(userId, { hasSecretSanta: value })

    if (currentUser.value) {
      await refreshProfile(currentUser.value)
    }

    await refreshUsers()
  }

  async function deleteUser(userId: string) {
    resetMessages()
    await deleteFirebaseUser(userId)

    if (currentUser.value?.uid === userId) {
      clearUserState()
      success.value = 'Account deleted successfully.'
      return
    }

    if (currentUser.value) {
      await refreshProfile(currentUser.value)
    }

    await refreshUsers()
    success.value = 'User deleted successfully.'
  }

  async function logout() {
    resetMessages()
    await signOutUser()
    clearUserState()
    success.value = 'Signed out successfully.'
  }

  function initializeAuth() {
    if (initialized.value) {
      return
    }

    initialized.value = true

    onAuthStateChange(async (user) => {
      currentUser.value = user

      if (user) {
        try {
          await refreshProfile(user)
          await refreshUsers()
        } catch {
          error.value = 'Unable to load user data.'
        }
      } else {
        clearUserState()
      }
    })

    const existingUser = getCurrentUser()
    if (existingUser) {
      currentUser.value = existingUser
      void refreshProfile(existingUser)
      void refreshUsers()
    }
  }

  return {
    currentUser,
    profile,
    users,
    error,
    success,
    isAdmin,
    isLoggedIn,
    getUserById,
    formatPresents,
    initializeAuth,
    login,
    register,
    saveProfile,
    setUserHasSecretSanta,
    deleteUser,
    logout,
    refreshProfile,
    refreshUsers,
    resetMessages,
  }
})
