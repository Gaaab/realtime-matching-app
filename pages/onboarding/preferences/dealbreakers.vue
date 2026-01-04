<script setup lang="ts">
/**
 * Onboarding - Dealbreakers Step
 *
 * Allows users to set non-negotiable preferences that will
 * automatically filter out incompatible profiles.
 * Uses expandable cards for Smoking and Religion dealbreakers.
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
  saveDealbreaker,
  loadExistingData,
  previous,
  goToStepById,
  syncStepById
} = useOnboarding()

// Load existing data and sync step on mount
onMounted(async () => {
  syncStepById('preferences-dealbreakers')
  await loadExistingData()
})

// Dealbreaker states
const smokingDealbreaker = ref('')
const religionDealbreaker = ref('')
const smokingExpanded = ref(false)
const religionExpanded = ref(false)
const error = ref('')

// Smoking dealbreaker options per requirements
const smokingOptions = [
  { value: 'smoker', label: 'Smoker' },
  { value: 'occasional_ok', label: 'Occasional smoking is fine' },
  { value: 'no_smokers', label: 'No smokers' }
]

// Religion dealbreaker options per requirements
const religionOptions = [
  { value: 'same_religion', label: 'Same religion only' },
  { value: 'open_to_different', label: 'Open to different religions' },
  { value: 'not_religious', label: 'Not religious' },
  { value: 'prefer_not_religious', label: 'Prefer not religious' },
  { value: 'prefer_religious', label: 'Prefer religious' }
]

// Check if any dealbreaker is selected
const hasAnySelection = computed(() => {
  return !!smokingDealbreaker.value || !!religionDealbreaker.value
})

const handleContinue = async () => {
  error.value = ''

  // Save dealbreakers if selected (both are optional)
  const dealbreakersToSave = []

  if (smokingDealbreaker.value) {
    dealbreakersToSave.push({ id: 1, criteria: smokingDealbreaker.value })
  }

  if (religionDealbreaker.value) {
    dealbreakersToSave.push({ id: 2, criteria: religionDealbreaker.value })
  }

  // Save each dealbreaker
  for (const dealbreaker of dealbreakersToSave) {
    const success = await saveDealbreaker(dealbreaker.id, dealbreaker.criteria)
    if (!success) {
      error.value = state.value.errors.general || 'Failed to save dealbreakers'
      return
    }
  }

  // Navigate to Section 3: Vibe & Lifestyle
  goToStepById('vibe-intro')
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
            <!-- Filter/Shield Icon for dealbreakers -->
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-900">What's a Deal Breaker for you?</h2>
          <p class="text-gray-600 mt-2">Choose some non-negotiables to automatically filter out profiles that don't meet</p>
        </div>

        <!-- Form -->
        <div class="space-y-5">
          <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p class="text-sm text-red-600">{{ error }}</p>
          </div>

          <!-- Dealbreaker Cards -->
          <div class="space-y-3">
            <ExpandableCard
              title="Smoking"
              :options="smokingOptions"
              v-model="smokingDealbreaker"
              :expanded="smokingExpanded"
              :disabled="saving"
              @update:expanded="smokingExpanded = $event"
            />

            <ExpandableCard
              title="Religion"
              :options="religionOptions"
              v-model="religionDealbreaker"
              :expanded="religionExpanded"
              :disabled="saving"
              @update:expanded="religionExpanded = $event"
            />
          </div>

          <UiButton size="lg" fullWidth :loading="saving" :disabled="saving" @click="handleContinue">
            {{ saving ? 'Saving...' : 'Continue' }}
          </UiButton>
        </div>
      </UiCard>
    </div>
  </div>
</template>
