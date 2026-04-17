<script setup lang="ts">
defineOptions({ name: 'PresentCard' })

import { computed, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'

import type { PresentItem } from '../firebase'
import { useUserStore } from '../stores/user'

const props = defineProps<{
  enableEditing?: boolean
  present: PresentItem
  index?: number
}>()

const userStore = useUserStore()
const { profile } = storeToRefs(userStore)
const previewImage = ref(props.present.image ?? '')
const isLoading = ref(false)
const isEditing = ref(false)
const editablePresent = reactive<PresentItem>({
  headline: props.present.headline,
  description: props.present.description,
  url: props.present.url,
  image: props.present.image ?? null,
})

const shortenedUrl = computed(() => {
  if (!props.present.url) {
    return ''
  }

  let shortenedUrl = props.present.url

  shortenedUrl = shortenedUrl.replace(/^https?:\/\//, '')
  shortenedUrl = shortenedUrl.replace(/^http?:\/\//, '')

  if (shortenedUrl.length > 50) {
    shortenedUrl = shortenedUrl.slice(0, 47) + '...'
  }

  return shortenedUrl
})

const hasImage = computed(() => Boolean(previewImage.value))

async function resolvePreviewImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (response.ok) {
      const html = await response.text()
      const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)

      console.log('Discovered preview image:', match?.[1])

      if (match?.[1]) {
        return new URL(match[1], url).href
      }
    }
  } catch {
    // Cross-origin sites often block page scraping in the browser :c.
  }

  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
  } catch {
    return null
  }
}

async function savePresentUpdate(updatedPresent: PresentItem) {
  if (props.index === undefined || !profile.value?.presents) {
    return
  }

  const presents = Array.isArray(profile.value.presents) ? [...profile.value.presents] : []
  presents[props.index] = updatedPresent
  await userStore.saveProfile({ presents })
}

async function saveImageToDatabase(imageUrl: string) {
  if (props.index === undefined || !profile.value?.presents) {
    return
  }

  const presents = Array.isArray(profile.value.presents) ? [...profile.value.presents] : []
  const existing = presents[props.index]

  if (!existing || (typeof existing === 'object' && 'image' in existing && existing.image)) {
    return
  }

  const updatedPresent = {
    ...(existing as PresentItem),
    image: imageUrl,
  }

  editablePresent.image = imageUrl
  await savePresentUpdate(updatedPresent)
}

async function refreshPreviewFromCurrentUrl() {
  if (!editablePresent.url) {
    previewImage.value = ''
    return
  }

  isLoading.value = true
  try {
    const discoveredImage = await resolvePreviewImage(editablePresent.url)
    previewImage.value = discoveredImage ?? ''
  } finally {
    isLoading.value = false
  }
}

async function saveEdits() {
  await refreshPreviewFromCurrentUrl()

  await savePresentUpdate({
    ...editablePresent,
    image: previewImage.value || editablePresent.image || null,
  })
  isEditing.value = false
}

function cancelEdits() {
  editablePresent.headline = props.present.headline
  editablePresent.description = props.present.description
  editablePresent.url = props.present.url
  editablePresent.image = props.present.image ?? null
  isEditing.value = false
}

onMounted(async () => {
  if (!props.present.url) {
    return
  }

  isLoading.value = true
  try {
    const discoveredImage = await resolvePreviewImage(props.present.url)
    if (discoveredImage) {
      previewImage.value = discoveredImage
      await saveImageToDatabase(discoveredImage)
    }
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="present-card">

    <img v-if="hasImage" :src="previewImage" :alt="present.headline" class="present-image" />
    <div v-else-if="isLoading" class="present-image placeholder">Loading preview…</div>
    <div class="present-content">

      <div v-if="isEditing" class="edit-fields">
        <label>
          Headline
          <input v-model="editablePresent.headline" />
        </label>

        <label>
          Description
          <textarea v-model="editablePresent.description" rows="3"></textarea>
        </label>

        <label>
          URL
          <input type="url" v-model="editablePresent.url" />
        </label>

        <div>
          <button class="cancel-button" @click="cancelEdits">Cancel</button>
          <button class="save-button" @click="saveEdits">Save</button>
        </div>

      </div>

      <div v-else>
        <div class="present-headline">
          <h3>{{ present.headline }}</h3>
          <button v-if="enableEditing" class="edit-button" @click="isEditing = true">Edit</button>
        </div>

        <p v-if="present.description" class="present-description">{{ present.description }}</p>
        <a :href="present.url" target="_blank" rel="noopener noreferrer">{{ shortenedUrl }}</a>
      </div>

    </div>
  </div>
</template>

<style scoped>
.present-description {
  margin: 1rem 0;
  font-size: 0.95rem;
}

.placeholder {
  display: grid;
  place-items: center;
  background: #f3f4f6;
  color: #4b5563;
}
</style>
