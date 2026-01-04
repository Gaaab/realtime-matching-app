<script setup lang="ts">
/**
 * Onboarding - Age/Date of Birth Step
 * Collect user's birthdate with 18+ validation
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
  validateAge,
  saveProfileBasics,
  loadExistingData,
  previous,
  goToStepById,
  syncStepById
} = useOnboarding()

const birthdate = ref('')
const error = ref('')
const isDataLoaded = ref(false)

// Load existing data and sync step on mount
onMounted(async () => {
  syncStepById('age')
  await loadExistingData()

  // Initialize local ref from loaded state
  birthdate.value = state.value.profileBasics.birthdate || ''
  isDataLoaded.value = true
})

// Sync local state with composable state (only after data is loaded)
watch(birthdate, () => {
  if (isDataLoaded.value) {
    state.value.profileBasics.birthdate = birthdate.value
  }
})

const handleContinue = async () => {
  error.value = ''

  // Validate (includes 18+ check)
  const validation = validateAge()
  if (!validation.valid) {
    error.value = Object.values(validation.errors)[0]
    return
  }

  // Save to API (only birthdate)
  const success = await saveProfileBasics({
    birthdate: birthdate.value
  })
  if (!success) {
    error.value = state.value.errors.general || 'Failed to save date of birth'
    return
  }

  // Navigate to next step
  goToStepById('gender')
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-gray-900">What's your age?</h1>
          <p class="text-gray-600 mt-2">This keeps your matches accurate and relevant</p>
        </div>

        <!-- Form -->
        <form class="space-y-6" @submit.prevent="handleContinue">
          <!-- Error Message -->
          <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-xl" role="alert">
            <p class="text-sm text-red-600">{{ error }}</p>
          </div>

          <WheelDatePicker
            v-model="birthdate"
            :disabled="saving"
          />

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
