<script setup lang="ts">
/**
 * Onboarding - Interests Selection Step
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
  saveInterests,
  loadExistingData,
  previous,
  goToStepById,
  syncStepById
} = useOnboarding()

const { categorizedInterests, fetchInterests, loading: interestsLoading } = useInterests()

const selectedInterests = ref<number[]>([])
const error = ref('')

// Load existing data and sync step on mount
onMounted(async () => {
  syncStepById('vibe-interests')

  // Load onboarding data and interests in parallel
  await Promise.all([
    loadExistingData(),
    fetchInterests()
  ])

  // Initialize local ref from loaded state
  selectedInterests.value = [...state.value.vibeLifestyle.interests]
})

watch(selectedInterests, () => {
  state.value.vibeLifestyle.interests = selectedInterests.value
}, { deep: true })

const handleContinue = async () => {
  error.value = ''

  // Skip if no interests selected (optional)
  if (selectedInterests.value.length === 0) {
    goToStepById('complete')
    return
  }

  // Save to API
  const success = await saveInterests(selectedInterests.value)

  if (!success) {
    error.value = state.value.errors.general || 'Failed to save interests'
    return
  }

  // Navigate to completion
  goToStepById('complete')
}

const handleBack = () => {
  previous()
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-pink-50 to-purple-50 py-8 px-4">
    <div class="max-w-2xl mx-auto">
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-900">What are you into?</h2>
          <p class="text-gray-600 mt-2">Pick the things you enjoy most - they help find likeminded people</p>
        </div>

        <!-- Loading State -->
        <div v-if="interestsLoading" class="text-center py-8">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p class="text-gray-600 mt-4">Loading interests...</p>
        </div>

        <!-- Interests Selector -->
        <div v-else class="space-y-6">
          <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p class="text-sm text-red-600">{{ error }}</p>
          </div>

          <InterestsSelector
            v-model="selectedInterests"
            :categories="categorizedInterests"
            :disabled="saving"
          />

          <UiButton size="lg" fullWidth :loading="saving" :disabled="saving" @click="handleContinue">
            {{ saving ? 'Saving...' : selectedInterests.length > 0 ? 'Continue' : 'Skip for now' }}
          </UiButton>
        </div>
      </UiCard>
    </div>
  </div>
</template>
