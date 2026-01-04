<script setup lang="ts">
/**
 * Onboarding - Ethnicity Step
 * Multi-select ethnicity with visibility toggle (optional field)
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
  saveAttributes,
  loadExistingData,
  previous,
  goToStepById,
  syncStepById
} = useOnboarding()

const { ethnicityOptions, getAttributeKeyId } = useAttributes()

const ethnicity = ref<string[]>([])
const ethnicityVisibility = ref(true)
const error = ref('')

// Load existing data and sync step on mount
onMounted(async () => {
  syncStepById('ethnicity')
  await loadExistingData()

  // Initialize local refs from loaded state
  ethnicity.value = [...state.value.profileBasics.ethnicity]
  ethnicityVisibility.value = state.value.profileBasics.ethnicity_visibility
})

// Convert attribute options to chip options format
const chipOptions = computed(() => {
  return ethnicityOptions.value.map(opt => ({
    value: opt.value,
    label: opt.label
  }))
})

// Sync local state with composable state
watch(ethnicity, () => {
  state.value.profileBasics.ethnicity = ethnicity.value
}, { deep: true })

watch(ethnicityVisibility, () => {
  state.value.profileBasics.ethnicity_visibility = ethnicityVisibility.value
})

const handleContinue = async () => {
  error.value = ''

  // Skip if no ethnicity selected (optional field)
  if (ethnicity.value.length === 0) {
    goToStepById('work')
    return
  }

  // Save to API
  const attributeKeyId = getAttributeKeyId('ethnicity')
  if (!attributeKeyId) {
    error.value = 'Failed to load ethnicity options'
    return
  }

  const success = await saveAttributes([
    {
      attribute_key_id: attributeKeyId,
      value: ethnicity.value,
      is_visible_on_profile: ethnicityVisibility.value
    }
  ])

  if (!success) {
    error.value = state.value.errors.general || 'Failed to save ethnicity'
    return
  }

  // Navigate to next step
  goToStepById('work')
}

const handleSkip = () => {
  goToStepById('work')
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-gray-900">How do you describe your ethnicity?</h1>
          <p class="text-gray-600 mt-2">This helps with compatibility and representation in your matches</p>
        </div>

        <!-- Form -->
        <div class="space-y-6">
          <!-- Error Message -->
          <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-xl" role="alert">
            <p class="text-sm text-red-600">{{ error }}</p>
          </div>

          <MultiselectChips
            v-model="ethnicity"
            :options="chipOptions"
            show-visibility
            :disabled="saving"
            @update:visibility="ethnicityVisibility = $event"
          />

          <!-- Action Buttons -->
          <div class="space-y-3">
            <UiButton
              v-if="ethnicity.length > 0"
              size="lg"
              fullWidth
              :loading="saving"
              :disabled="saving"
              @click="handleContinue"
            >
              Continue
            </UiButton>

            <UiButton
              v-else
              size="lg"
              fullWidth
              variant="outline"
              :disabled="saving"
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
