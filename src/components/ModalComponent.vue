<script setup lang="ts">
defineProps<{
  message: string
  isOpen: boolean
}>()
</script>

<template>
  <div class="modal-overlay" v-if="isOpen">
    <div class="modal-content">
      {{ message }}
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
</style>
