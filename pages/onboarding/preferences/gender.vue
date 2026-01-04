<script setup lang="ts">
/**
 * Onboarding - Gender Preference Step
 *
 * Allows users to select who they want to meet.
 * Supports multi-select: Women, Men, Non-binary, or Everyone.
 * Selecting Women + Men = Both (internally stored as ['women', 'men'])
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
  validatePreferencesGender,
  savePreferences,
  loadExistingData,
  previous,
  goToStepById,
  syncStepById
} = useOnboarding()

// Local state for multi-select
const selectedGenders = ref<string[]>([])
const error = ref('')

// Load existing data and sync step on mount
onMounted(async () => {
  syncStepById('preferences-gender')
  await loadExistingData()

  // Initialize local refs from loaded state
  selectedGenders.value = [...state.value.preferences.looking_for_gender]
})

// Gender preference options (multi-select enabled)
const genderOptions = [
  { value: 'women', label: 'Women' },
  { value: 'men', label: 'Men' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'everyone', label: 'Everyone' }
]

// Handle option toggle (multi-select logic)
const toggleGender = (value: string) => {
  if (value === 'everyone') {
    // "Everyone" clears other selections and selects only "everyone"
    selectedGenders.value = ['everyone']
  } else {
    // Remove "everyone" if selecting specific genders
    const filtered = selectedGenders.value.filter(g => g !== 'everyone')

    if (filtered.includes(value)) {
      // Deselect if already selected
      selectedGenders.value = filtered.filter(g => g !== value)
    } else {
      // Add to selection
      selectedGenders.value = [...filtered, value]
    }
  }

  // Sync with onboarding state
  state.value.preferences.looking_for_gender = selectedGenders.value
}

// Check if an option is selected
const isSelected = (value: string) => {
  return selectedGenders.value.includes(value)
}

// Validation: at least one option must be selected
const canContinue = computed(() => selectedGenders.value.length > 0)

const handleContinue = async () => {
  error.value = ''

  // Validate
  const validation = validatePreferencesGender()
  if (!validation.valid) {
    error.value = Object.values(validation.errors)[0]
    return
  }

  // Save to API
  const success = await savePreferences({
    looking_for_gender: selectedGenders.value
  })

  if (!success) {
    error.value = state.value.errors.general || 'Failed to save preferences'
    return
  }

  // Navigate to next step
  goToStepById('preferences-age-range')
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-900">Who do you want to meet?</h2>
          <p class="text-gray-600 mt-2">Choose the gender or genders you're open to meet</p>
        </div>

        <!-- Form -->
        <div class="space-y-5">
          <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p class="text-sm text-red-600">{{ error }}</p>
          </div>

          <!-- Multi-select Gender Options -->
          <fieldset class="space-y-3" role="group" aria-labelledby="gender-preference-legend">
            <legend id="gender-preference-legend" class="sr-only">Select who you want to meet</legend>
            <button
              v-for="option in genderOptions"
              :key="option.value"
              type="button"
              :disabled="saving"
              :class="[
                'w-full flex items-center justify-between px-5 py-4 border-2 rounded-2xl transition-all duration-200',
                isSelected(option.value)
                  ? 'border-primary bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300',
                saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              ]"
              :aria-pressed="isSelected(option.value)"
              @click="toggleGender(option.value)"
            >
              <span class="font-medium">{{ option.label }}</span>

              <!-- Checkmark indicator for selected state -->
              <div
                :class="[
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200',
                  isSelected(option.value)
                    ? 'border-primary bg-primary'
                    : 'border-gray-300 bg-white'
                ]"
              >
                <svg
                  v-if="isSelected(option.value)"
                  class="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </button>
          </fieldset>

          <UiButton
            size="lg"
            fullWidth
            :loading="saving"
            :disabled="saving || !canContinue"
            @click="handleContinue"
          >
            {{ saving ? 'Saving...' : 'Continue' }}
          </UiButton>
        </div>
      </UiCard>
    </div>
  </div>
</template>
