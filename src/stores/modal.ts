import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useModalStore = defineStore('modal', () => {
  const isOpen = ref(false)
  const headline = ref<string | null>(null)
  const message = ref<string | null>(null)
  const confirmMessage = ref<string | null>(null)
  const cancelMessage = ref<string | null>(null)
  const onConfirm = ref<(() => void) | null>(null)

  function openModal(
    newMessage: string,
    newHeadline: string | null,
    newConfirmMessage?: string,
    newCancelMessage?: string,
    confirmCallback?: () => void,
  ) {
    message.value = newMessage
    headline.value = newHeadline
    confirmMessage.value = newConfirmMessage ?? null
    cancelMessage.value = newCancelMessage ?? null
    onConfirm.value = confirmCallback ?? null
    isOpen.value = true
  }

  function closeModal() {
    isOpen.value = false
    message.value = null
    headline.value = null
    confirmMessage.value = null
    cancelMessage.value = null
    onConfirm.value = null
  }

  function confirmModal() {
    if (onConfirm.value) {
      onConfirm.value()
    }

    closeModal()
  }

  return {
    isOpen,
    headline,
    message,
    confirmMessage,
    cancelMessage,
    onConfirm,
    openModal,
    closeModal,
    confirmModal,
  }
})
