<script setup lang="ts">
/**
 * Onboarding - Photo Upload Step
 * Profile photo upload with cropping functionality
 */

import type { FileUpload } from '~/composables/useUploadAvatar'

definePageMeta({
  layout: 'default',
  middleware: 'auth'
})

const { user } = useAuth()
const { handleUpload: uploadAvatar, loading: avatarLoading, error: avatarError } = useUploadAvatar()
const {
  state,
  progress,
  previous,
  goToStepById,
  syncStepById,
  loadExistingData
} = useOnboarding()

// Sync step and load existing data on mount
onMounted(async () => {
  syncStepById('photo')
  await loadExistingData()
})

const avatarUploaded = ref(false)
const error = ref('')

const avatarUrl = computed(() => user.value?.profile?.profile_picture_url ?? undefined)

const handleAvatarSave = async (data: FileUpload & { canvas: HTMLCanvasElement }) => {
  error.value = ''

  try {
    await uploadAvatar(data)
    avatarUploaded.value = true
    state.value.profileBasics.photo_uploaded = true
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to upload photo'
    error.value = errorMessage
  }
}

const handleAvatarError = (errorMsg: string) => {
  error.value = errorMsg
}

const handleAvatarAdded = () => {
  error.value = ''
}

const handleContinue = () => {
  // Navigate to Section 2: Preferences
  goToStepById('preferences-intro')
}

const handleSkip = () => {
  goToStepById('preferences-intro')
}

const handleBack = () => {
  previous()
}

// Determine button text based on photo state
const hasPhoto = computed(() => avatarUploaded.value || avatarUrl.value)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-pink-50 to-purple-50 py-8 px-4">
    <div class="max-w-md mx-auto">
      <!-- Progress Bar -->
      <div class="mb-8">
        <div class="flex justify-between mb-2">
          <span class="text-sm text-gray-600">Step {{ progress.current }} of {{ progress.total }}</span>
          <span class="text-sm text-gray-600">{{ progress.percentage }}%</span>
        </div>
        <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-primary-500 to-primary-700 transition-all duration-300"
            :style="{ width: `${progress.percentage}%` }"
          />
        </div>
      </div>

      <UiCard variant="elevated" padding="lg">
        <!-- Back Button -->
        <button
          type="button"
          class="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          @click="handleBack"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span class="text-sm font-medium">Back</span>
        </button>

        <!-- Header -->
        <div class="text-center mb-8">
          <div class="w-16 h-16 mx-auto bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mb-4">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-gray-900">Your first impression starts here</h1>
          <p class="text-gray-600 mt-2">A single photo can't tell the story you'd tell over a single coffee. So rather be yourself, not a resume</p>
        </div>

        <!-- Avatar Uploader -->
        <div class="space-y-6">
          <div class="flex flex-col items-center">
            <UiAvatarUploader
              :src="avatarUrl"
              :loading="avatarLoading"
              :error-messages="error"
              size="lg"
              @save="handleAvatarSave"
              @added="handleAvatarAdded"
              @error="handleAvatarError"
            />
          </div>

          <!-- Guidelines -->
          <div class="text-center text-sm text-gray-500">
            <p>Remember to use clear photos of yourself, not group shots</p>
            <p class="text-xs mt-1">Supported formats: JPG, PNG, GIF, WebP, HEIC (max 10MB)</p>
          </div>

          <!-- Success Message -->
          <div v-if="avatarUploaded && avatarUrl" class="p-4 bg-green-50 border border-green-200 rounded-xl" role="status">
            <p class="text-sm text-green-600 text-center">Photo uploaded successfully!</p>
          </div>

          <!-- Action Buttons -->
          <div class="space-y-3">
            <UiButton
              v-if="hasPhoto"
              size="lg"
              fullWidth
              :disabled="avatarLoading"
              @click="handleContinue"
            >
              Continue
            </UiButton>

            <UiButton
              v-else
              size="lg"
              fullWidth
              variant="outline"
              :disabled="avatarLoading"
              @click="handleSkip"
            >
              Skip for now
            </UiButton>
          </div>
        </div>
      </UiCard>
    </div>
  </div>
</template>
