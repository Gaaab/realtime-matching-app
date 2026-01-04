<script setup lang="ts">
/**
 * Onboarding - Kids Preference Step
 *
 * Allows users to specify their preference regarding kids.
 * This step is optional and can be skipped.
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
  savePreferences,
  loadExistingData,
  previous,
  goToStepById,
  syncStepById
} = useOnboarding()

const kidsPreference = ref('')
const error = ref('')

// Load existing data and sync step on mount
onMounted(async () => {
  syncStepById('preferences-kids')
  await loadExistingData()

  // Initialize local ref from loaded state
  kidsPreference.value = state.value.preferences.kids_preference
})

// Kids preference options per requirements
const kidsOptions = [
  { value: 'wants_kids', label: 'Wants kids' },
  { value: 'no_kids', label: "Doesn't want kids" },
  { value: 'open', label: 'Open to kids' },
  { value: 'has_kids', label: 'Has kids already' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' }
]

// Sync with onboarding state
watch(kidsPreference, () => {
  state.value.preferences.kids_preference = kidsPreference.value
})

// Check if user has made a selection
const hasSelection = computed(() => !!kidsPreference.value)

const handleContinue = async () => {
  error.value = ''

  // Save to API if selection was made
  if (kidsPreference.value) {
    const success = await savePreferences({
      kids_preference: kidsPreference.value
    })

    if (!success) {
      error.value = state.value.errors.general || 'Failed to save kids preference'
      return
    }
  }

  // Navigate to next step
  goToStepById('preferences-dealbreakers')
}

const handleSkip = () => {
  // Navigate without saving
  goToStepById('preferences-dealbreakers')
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
            <!-- Baby/Family Icon -->
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-900">What's your preference on kids?</h2>
          <p class="text-gray-600 mt-2">Choose what you're open to in the future</p>
        </div>

        <!-- Form -->
        <div class="space-y-5">
          <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p class="text-sm text-red-600">{{ error }}</p>
          </div>

          <RadioOptionCard
            v-model="kidsPreference"
            :options="kidsOptions"
            name="kids-preference"
            :disabled="saving"
          />

          <!-- Action Buttons -->
          <div class="space-y-3">
            <!-- Continue Button (shown when selection made) -->
            <UiButton
              v-if="hasSelection"
              size="lg"
              fullWidth
              :loading="saving"
              :disabled="saving"
              @click="handleContinue"
            >
              {{ saving ? 'Saving...' : 'Continue' }}
            </UiButton>

            <!-- Skip Button (always visible, styled differently when selection exists) -->
            <button
              type="button"
              :disabled="saving"
              :class="[
                'w-full py-3 px-6 rounded-xl font-medium transition-all duration-200',
                hasSelection
                  ? 'text-gray-500 hover:text-gray-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
              @click="handleSkip"
            >
              Skip for now
            </button>
          </div>
        </div>
      </UiCard>
    </div>
  </div>
</template>
