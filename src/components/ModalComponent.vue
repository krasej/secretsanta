<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useModalStore } from '../stores/modal'


const { isOpen, message, headline, confirmMessage, cancelMessage } = storeToRefs(useModalStore())

</script>

<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-close" @click="useModalStore().closeModal">&times;</div>
      <h3 class="modal-headline">
        {{ headline }}
      </h3>
      <div class="modal-text">
        {{ message }}
      </div>
      <div class="modal-buttons">
        <button v-if="cancelMessage" @click="useModalStore().closeModal">{{ cancelMessage }}</button>
        <button class="primary" @click="useModalStore().confirmModal"><template v-if="confirmMessage">{{ confirmMessage
            }}</template><template v-else>Confirm</template></button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
}

.modal-headline {
  margin-top: 0;
}

.modal-text {
  margin-bottom: 2rem;
  margin-top: 1rem;
}

.modal-close {
  position: absolute;
  font-size: 2rem;
  cursor: pointer;
  top: 0;
  right: 2rem;
}

.modal-buttons {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.modal-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--color-background);
  padding: 1em 2em 2em 2em;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  width: 680px;
}
</style>
