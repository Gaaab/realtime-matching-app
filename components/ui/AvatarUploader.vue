<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import type { FileUpload } from '~/composables/useUploadAvatar'
import { isHeicFile, parseImage } from '~/utils/image'

interface Props {
  src?: string
  alt?: string
  loading?: boolean
  errorMessages?: string | string[]
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'lg',
  loading: false,
})

const emits = defineEmits<{
  (e: 'save', value: FileUpload & { canvas: HTMLCanvasElement }): void
  (e: 'added'): void
  (e: 'removed'): void
  (e: 'error', error: string): void
}>()

const nuxtApp = useNuxtApp()

const form = ref<FileUpload>({
  file: null,
  base64: null,
})

const internalLoading = ref(false)
const hasError = ref(false)
const fileInputRef = ref<HTMLInputElement>()
const cropperRef = ref<typeof Cropper>()

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
  }
  return sizes[props.size]
})

const hasImage = computed(() => props.src && !hasError.value)

const handleImage = async (event: Event) => {
  const input = event.target as HTMLInputElement

  if (!input.files?.[0]) return

  const file = input.files[0]
  form.value.file = file

  try {
    internalLoading.value = true

    // Convert HEIC/HEIF files to JPEG (only on client)
    if (isHeicFile(file) && nuxtApp.$heicToJpeg) {
      const { file: convertedFile } = await nuxtApp.$heicToJpeg(file)
      form.value.base64 = await parseImage(convertedFile)
      form.value.file = convertedFile
    } else {
      form.value.base64 = await parseImage(file)
    }

    internalLoading.value = false
    emits('added')
  } catch (error: any) {
    internalLoading.value = false
    const errorMsg = error.message || 'Failed to load image'
    emits('error', errorMsg)
    console.error('Image load error:', error)
  }
}

const handleCancelUpload = () => {
  form.value.file = null
  form.value.base64 = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  emits('removed')
}

const handleSave = () => {
  if (!cropperRef.value || !form.value.file) return

  const result = cropperRef.value.getResult()
  if (!result || !result.canvas) return

  emits('save', {
    ...form.value,
    canvas: result.canvas,
  })
}

watch(
  () => props.loading,
  (newLoading) => {
    if (!newLoading) {
      form.value.file = null
      form.value.base64 = null
      if (fileInputRef.value) {
        fileInputRef.value.value = ''
      }
    }
  }
)

watch(
  () => props.src,
  (newSrc) => {
    if (newSrc && hasError.value) {
      hasError.value = false
    }
  }
)

const errors = computed(() => {
  if (Array.isArray(props.errorMessages)) {
    return props.errorMessages
  }
  return props.errorMessages ? [props.errorMessages] : []
})

defineExpose({
  form,
})
</script>

<template>
  <div class="avatar-uploader">
    <!-- Cropper View -->
    <div v-if="form.base64" class="w-full">
      <Cropper
        ref="cropperRef"
        :src="form.base64"
        :stencil-props="{
          aspectRatio: 1,
        }"
        class="rounded-2xl overflow-hidden"
        style="min-height: 300px; max-height: 500px"
      />

      <div class="flex gap-3 mt-4">
        <UiButton
          variant="outline"
          fullWidth
          :disabled="loading"
          @click="handleCancelUpload"
        >
          Cancel
        </UiButton>
        <UiButton
          fullWidth
          :loading="loading"
          @click="handleSave"
        >
          Save
        </UiButton>
      </div>
    </div>

    <!-- Upload View -->
    <div v-else class="flex flex-col items-center">
      <div class="relative">
        <div
          :class="[sizeClasses]"
          class="relative rounded-full overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600"
        >
          <img
            v-if="hasImage"
            :src="src"
            :alt="alt || 'Avatar'"
            class="w-full h-full object-cover"
            @error="hasError = true"
          />
          <div
            v-else
            class="w-full h-full flex items-center justify-center text-white text-4xl font-semibold"
          >
            ?
          </div>
        </div>

        <button
          type="button"
          :disabled="internalLoading || loading"
          class="absolute bottom-0 right-0 w-12 h-12 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg flex items-center justify-center transition-colors disabled:opacity-50"
          @click="fileInputRef?.click()"
        >
          <svg
            v-if="internalLoading"
            class="animate-spin h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <svg
            v-else-if="!hasImage"
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>

        <input
          ref="fileInputRef"
          type="file"
          accept="image/*,.heic,.heif"
          class="hidden"
          @change="handleImage"
        />
      </div>

      <!-- Error Messages -->
      <div v-if="errors.length > 0" class="mt-4 w-full">
        <p
          v-for="(error, index) in errors"
          :key="index"
          class="text-sm text-red-600 text-center"
        >
          {{ error }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.avatar-uploader {
  width: 100%;
}
</style>
