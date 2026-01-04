<script setup lang="ts">
/**
 * Onboarding - Age Range Preference Step
 *
 * Allows users to set their preferred age range for matches.
 * Uses dual-handle slider for min/max selection (18-99).
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
  validateAgeRange,
  savePreferences,
  loadExistingData,
  previous,
  goToStepById,
  syncStepById
} = useOnboarding()

// Age range with sensible defaults
const ageRange = ref({
  min: 20,
  max: 30
})
const error = ref('')

// Load existing data and sync step on mount
onMounted(async () => {
  syncStepById('preferences-age-range')
  await loadExistingData()

  // Initialize local refs from loaded state
  ageRange.value = {
    min: state.value.preferences.age_min || 20,
    max: state.value.preferences.age_max || 30
  }
})

// Sync with onboarding state
watch(ageRange, () => {
  state.value.preferences.age_min = ageRange.value.min
  state.value.preferences.age_max = ageRange.value.max
}, { deep: true })

const handleContinue = async () => {
  error.value = ''

  // Validate
  const validation = validateAgeRange()
  if (!validation.valid) {
    error.value = Object.values(validation.errors)[0]
    return
  }

  // Save to API
  const success = await savePreferences({
    age_min: ageRange.value.min,
    age_max: ageRange.value.max
  })

  if (!success) {
    error.value = state.value.errors.general || 'Failed to save age range'
    return
  }

  // Navigate to next step
  goToStepById('preferences-kids')
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
          ></div>
        </div>
      </div>

      <UiCard variant="elevated" padding="lg">
        <!-- Back Button -->
        <button
          @click="handleBack"
          class="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span class="text-sm font-medium">Back</span>
        </button>

        <!-- Header -->
        <div class="text-center mb-8">
          <div class="w-16 h-16 mx-auto bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mb-4">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-900">Set your age range</h2>
          <p class="text-gray-600 mt-2">Keep things aligned with what you're looking for</p>
        </div>

        <!-- Form -->
        <div class="space-y-6">
          <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p class="text-sm text-red-600">{{ error }}</p>
          </div>

          <!-- Age Range Slider with min 18, max 99 -->
          <AgeRangeSlider
            v-model="ageRange"
            :min-age="18"
            :max-age="99"
            :disabled="saving"
          />

          <UiButton size="lg" fullWidth :loading="saving" :disabled="saving" @click="handleContinue">
            {{ saving ? 'Saving...' : 'Continue' }}
          </UiButton>
        </div>
      </UiCard>
    </div>
  </div>
</template>
