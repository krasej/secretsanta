<script lang="ts" setup>
defineProps<{
  type?: 'error' | 'success' | 'info' | 'warning'
  message: string
}>()

</script>


<template>

  <div v-if="message" class="message" :class="type">
    {{ message }}
  </div>

</template>

<style scoped>
.message {
  padding: 1em;
  border-radius: var(--border-radius-lg);
  margin: 1em 0;
}

.message.error {
  background-color: var(--color-error-light);
  border: 1px solid var(--color-error);
  color: white;
}

.message.success {
  background-color: var(--color-success-light);
  border: 1px solid var(--color-success);
  color: var(--color-success-text);
}
</style>
