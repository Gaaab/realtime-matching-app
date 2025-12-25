<script setup lang="ts">
import type { FileUpload } from '~/composables/useUploadAvatar'

definePageMeta({
  layout: 'default',
  middleware: 'auth'
})

const router = useRouter()
const api = useApi()
const authStore = useAuthStore()
const { user } = useAuth()
const { handleUpload: uploadAvatar, loading: avatarLoading, error: avatarError } = useUploadAvatar()

const currentStep = ref(1)
const totalSteps = 5

// SSR-safe unique ID for the visibility checkbox
const visibilityCheckboxId = useId()

const form = reactive({
  first_name: '',
  last_name: '',
  date_of_birth: '',
  gender: '' as 'male' | 'female' | 'non-binary' | 'other' | '',
})

const errors = reactive({
  first_name: '',
  last_name: '',
  date_of_birth: '',
  gender: '',
  photo: '',
  general: ''
})

const loading = ref(false)
const avatarUploaded = ref(false)

// Step 1: Introduction
const handleIntroNext = () => {
  currentStep.value = 2
}

// Step 2: Name
const validateName = () => {
  errors.first_name = ''
  errors.last_name = ''

  if (!form.first_name) {
    errors.first_name = 'First name is required'
    return false
  }

  if (!form.last_name) {
    errors.last_name = 'Last name is required'
    return false
  }

  return true
}

const handleNameNext = async () => {
  if (!validateName()) return

  try {
    loading.value = true
    errors.general = ''

    // Save name to profile
    const response = await api.put('/auth/profile', {
      first_name: form.first_name,
      last_name: form.last_name
    })

    if (response.success && response.data) {
      authStore.setUser(response.data)
      authStore.persistToStorage()
      currentStep.value = 3
    }
  } catch (error: any) {
    errors.general = error.message || 'Failed to save name'
  } finally {
    loading.value = false
  }
}

// Step 3: Date of Birth
const validateDateOfBirth = () => {
  errors.date_of_birth = ''

  if (!form.date_of_birth) {
    errors.date_of_birth = 'Date of birth is required'
    return false
  }

  // Check if user is at least 18 years old
  const birthDate = new Date(form.date_of_birth)
  const today = new Date()
  const age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    if (age - 1 < 18) {
      errors.date_of_birth = 'You must be at least 18 years old'
      return false
    }
  } else if (age < 18) {
    errors.date_of_birth = 'You must be at least 18 years old'
    return false
  }

  return true
}

const handleDateNext = async () => {
  if (!validateDateOfBirth()) return

  try {
    loading.value = true
    errors.general = ''

    // Save date of birth to profile
    const response = await api.put('/auth/profile', {
      date_of_birth: form.date_of_birth
    })

    if (response.success && response.data) {
      authStore.setUser(response.data)
      authStore.persistToStorage()
      currentStep.value = 4
    }
  } catch (error: any) {
    errors.general = error.message || 'Failed to save date of birth'
  } finally {
    loading.value = false
  }
}

// Step 4: Gender
const validateGender = () => {
  errors.gender = ''

  if (!form.gender) {
    errors.gender = 'Please select your gender'
    return false
  }

  return true
}

const handleGenderNext = async () => {
  if (!validateGender()) return

  try {
    loading.value = true
    errors.general = ''

    // Save gender to profile
    const response = await api.put('/auth/profile', {
      gender: form.gender
    })

    if (response.success && response.data) {
      authStore.setUser(response.data)
      authStore.persistToStorage()
      currentStep.value = 5
    }
  } catch (error: any) {
    errors.general = error.message || 'Failed to save gender'
  } finally {
    loading.value = false
  }
}

// Step 5: Photo Upload with Cropping
const avatarUrl = computed(() => user.value?.profile?.profile_picture_url ?? undefined)

const handleAvatarSave = async (data: FileUpload & { canvas: HTMLCanvasElement }) => {
  errors.photo = ''
  errors.general = ''

  try {
    await uploadAvatar(data)
    avatarUploaded.value = true
  } catch (error: any) {
    errors.photo = error.message || 'Failed to upload avatar'
  }
}

const handleAvatarError = (errorMsg: string) => {
  errors.photo = errorMsg
}

const handleAvatarAdded = () => {
  errors.photo = ''
}

const handleSkipPhoto = async () => {
  await navigateToDashboard()
}

const handleContinue = async () => {
  await navigateToDashboard()
}

const navigateToDashboard = async () => {
  await router.push('/dashboard')
}

const goBack = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-pink-50 to-purple-50 py-8 px-4">
    <div class="max-w-md mx-auto">
      <!-- Progress Bar -->
      <div class="mb-8">
        <div class="flex justify-between mb-2">
          <span class="text-sm text-gray-600">Step {{ currentStep }} of {{ totalSteps }}</span>
        </div>
        <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-primary-500 to-primary-700 transition-all duration-300"
            :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
          ></div>
        </div>
      </div>

      <UiCard variant="elevated" padding="lg">
        <!-- Back Button (except on intro) -->
        <button
          v-if="currentStep > 1"
          @click="goBack"
          class="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span class="text-sm font-medium">Back</span>
        </button>

        <!-- Step 1: Introduction -->
        <div v-if="currentStep === 1" class="text-center">
          <div class="w-20 h-20 mx-auto bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center mb-6">
            <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-900 mb-4">Let's set up the essentials</h2>
          <p class="text-gray-600 mb-8">A few quick details to help people get to know the real you</p>

          <UiButton size="lg" fullWidth @click="handleIntroNext">
            Let's do it
            <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </UiButton>
        </div>

        <!-- Step 2: Name -->
        <div v-if="currentStep === 2">
          <div class="text-center mb-8">
            <div class="w-16 h-16 mx-auto bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mb-4">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 class="text-3xl font-bold text-gray-900">Start with your name</h2>
            <p class="text-gray-600 mt-2">This keeps your profile honest and relevant</p>
          </div>

          <form @submit.prevent="handleNameNext" class="space-y-5">
            <div v-if="errors.general" class="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p class="text-sm text-red-600">{{ errors.general }}</p>
            </div>

            <div class="space-y-4">
              <UiInput
                v-model="form.first_name"
                type="text"
                label="First name"
                placeholder="Jane"
                :error="errors.first_name"
                :disabled="loading"
                required
              />

              <UiInput
                v-model="form.last_name"
                type="text"
                label="Surname"
                placeholder="Smith"
                :error="errors.last_name"
                :disabled="loading"
                required
              />
            </div>

            <UiButton type="submit" size="lg" fullWidth :loading="loading" :disabled="loading">
              {{ loading ? 'Saving...' : 'Continue' }}
            </UiButton>
          </form>
        </div>

        <!-- Step 3: Date of Birth -->
        <div v-if="currentStep === 3">
          <div class="text-center mb-8">
            <div class="w-16 h-16 mx-auto bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mb-4">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 class="text-3xl font-bold text-gray-900">What's your age?</h2>
            <p class="text-gray-600 mt-2">This keeps your matches relevant and relevant</p>
          </div>

          <form @submit.prevent="handleDateNext" class="space-y-5">
            <div v-if="errors.general" class="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p class="text-sm text-red-600">{{ errors.general }}</p>
            </div>

            <UiInput
              v-model="form.date_of_birth"
              type="date"
              label="Date of birth"
              :error="errors.date_of_birth"
              :disabled="loading"
              required
            />

            <UiButton type="submit" size="lg" fullWidth :loading="loading" :disabled="loading">
              {{ loading ? 'Saving...' : 'Continue' }}
            </UiButton>
          </form>
        </div>

        <!-- Step 4: Gender -->
        <div v-if="currentStep === 4">
          <div class="text-center mb-8">
            <div class="w-16 h-16 mx-auto bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mb-4">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 class="text-3xl font-bold text-gray-900">How do you identify?</h2>
            <p class="text-gray-600 mt-2">Share your gender, or select "More" if you'd like to add more detail</p>
          </div>

          <div class="space-y-5">
            <div v-if="errors.general" class="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p class="text-sm text-red-600">{{ errors.general }}</p>
            </div>

            <fieldset class="space-y-3" role="radiogroup" aria-labelledby="gender-legend">
              <legend id="gender-legend" class="sr-only">Select your gender</legend>
              <label
                v-for="option in [
                  { value: 'male', label: 'Man' },
                  { value: 'female', label: 'Woman' },
                  { value: 'non-binary', label: 'Non-binary' },
                  { value: 'other', label: 'More' }
                ]"
                :key="option.value"
                :for="`gender-${option.value}`"
                :class="[
                  'flex items-center justify-between px-5 py-4 border-2 rounded-2xl cursor-pointer transition-all',
                  form.gender === option.value
                    ? 'border-primary bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300',
                  loading ? 'opacity-50 pointer-events-none' : ''
                ]"
              >
                <span class="font-medium">{{ option.label }}</span>
                <input
                  :id="`gender-${option.value}`"
                  type="radio"
                  name="gender"
                  :value="option.value"
                  v-model="form.gender"
                  :disabled="loading"
                  class="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
              </label>
            </fieldset>

            <p v-if="errors.gender" class="text-sm text-red-600">{{ errors.gender }}</p>

            <div class="flex items-center space-x-2 text-sm text-gray-600">
              <input
                type="checkbox"
                :id="visibilityCheckboxId"
                class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                :disabled="loading"
                checked
              />
              <label :for="visibilityCheckboxId">Visible on profile</label>
            </div>

            <UiButton size="lg" fullWidth :loading="loading" :disabled="loading" @click="handleGenderNext">
              {{ loading ? 'Saving...' : 'Continue' }}
            </UiButton>
          </div>
        </div>

        <!-- Step 5: Photo Upload with Cropping -->
        <div v-if="currentStep === 5">
          <div class="text-center mb-8">
            <div class="w-16 h-16 mx-auto bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mb-4">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 class="text-3xl font-bold text-gray-900">Your first impression starts here</h2>
            <p class="text-gray-600 mt-2">Add at least one photo that truly represents you</p>
          </div>

          <div class="space-y-5">
            <!-- Avatar Uploader with Cropping -->
            <div class="flex flex-col items-center">
              <UiAvatarUploader
                :src="avatarUrl"
                :loading="avatarLoading"
                :error-messages="errors.photo"
                size="lg"
                @save="handleAvatarSave"
                @added="handleAvatarAdded"
                @error="handleAvatarError"
              />
            </div>

            <div class="text-center text-sm text-gray-500">
              <p>Use a clear photo of yourself</p>
              <p class="text-xs mt-1">Supported formats: JPG, PNG, GIF, WebP, HEIC (max 10MB)</p>
            </div>

            <div v-if="errors.general" class="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p class="text-sm text-red-600">{{ errors.general }}</p>
            </div>

            <!-- Success message when avatar is uploaded -->
            <div v-if="avatarUploaded && avatarUrl" class="p-4 bg-green-50 border border-green-200 rounded-xl">
              <p class="text-sm text-green-600 text-center">Avatar uploaded successfully!</p>
            </div>

            <div class="space-y-3">
              <UiButton
                size="lg"
                fullWidth
                :disabled="avatarLoading"
                @click="handleContinue"
              >
                {{ avatarUploaded || avatarUrl ? 'Continue' : 'Continue without photo' }}
              </UiButton>

              <button
                v-if="!avatarUploaded && !avatarUrl"
                type="button"
                @click="handleSkipPhoto"
                :disabled="avatarLoading"
                class="w-full text-gray-600 hover:text-gray-700 font-medium text-sm py-3 disabled:opacity-50"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      </UiCard>
    </div>
  </div>
</template>
