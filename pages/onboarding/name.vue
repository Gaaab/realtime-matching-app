<script setup lang="ts">
/**
 * Onboarding - Name Step
 * Collect user's first and last name
 */

definePageMeta({
  layout: 'default',
  middleware: 'auth'
})

const {
  state,
  saving,
  loading,
  progress,
  validateName,
  saveProfileBasics,
  loadExistingData,
  previous,
  goToStepById,
  syncStepById
} = useOnboarding()

// Local reactive refs for v-model
const firstName = ref('')
const lastName = ref('')
const errors = ref<Record<string, string>>({})
const isDataLoaded = ref(false)

// Load existing data and sync step on mount
onMounted(async () => {
  syncStepById('name')
  await loadExistingData()

  // Initialize local refs from loaded state
  firstName.value = state.value.profileBasics.first_name || ''
  lastName.value = state.value.profileBasics.last_name || ''
  isDataLoaded.value = true
})

// Sync local state with composable state (only after data is loaded to prevent overwrites)
watch([firstName, lastName], () => {
  if (isDataLoaded.value) {
    state.value.profileBasics.first_name = firstName.value
    state.value.profileBasics.last_name = lastName.value
  }
})

const handleContinue = async () => {
  errors.value = {}

  // Validate
  const validation = validateName()
  if (!validation.valid) {
    errors.value = validation.errors
    return
  }

  // Save to API (only name fields)
  const success = await saveProfileBasics({
    first_name: firstName.value,
    last_name: lastName.value
  })
  if (!success) {
    errors.value.general = state.value.errors.general || 'Failed to save name'
    return
  }

  // Navigate to next step
  goToStepById('age')
}

const handleBack = () => {
  previous()
}
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-gray-900">Start with your name</h1>
          <p class="text-gray-600 mt-2">Keep it simple, keep it real</p>
        </div>

        <!-- Form -->
        <form class="space-y-6" @submit.prevent="handleContinue">
          <!-- General Error -->
          <div v-if="errors.general" class="p-4 bg-red-50 border border-red-200 rounded-xl" role="alert">
            <p class="text-sm text-red-600">{{ errors.general }}</p>
          </div>

          <div class="space-y-4">
            <UiInput
              v-model="firstName"
              type="text"
              label="First name"
              placeholder="Jane"
              :error="errors.first_name"
              :disabled="saving"
              required
            />

            <UiInput
              v-model="lastName"
              type="text"
              label="Last name"
              placeholder="Smith"
              :error="errors.last_name"
              :disabled="saving"
              required
            />
          </div>

          <UiButton
            type="submit"
            size="lg"
            fullWidth
            :loading="saving"
            :disabled="saving"
          >
            Continue
          </UiButton>
        </form>
      </UiCard>
    </div>
  </div>
</template>
