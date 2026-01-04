<script setup lang="ts">
/**
 * Onboarding - Work/Occupation Step
 * Radio selection for work category (optional field)
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

const { workOptions, getAttributeKeyId } = useAttributes()

const work = ref('')
const workVisibility = ref(true)
const error = ref('')

// Load existing data and sync step on mount
onMounted(async () => {
  syncStepById('work')
  await loadExistingData()

  // Initialize local refs from loaded state
  work.value = state.value.profileBasics.work
  workVisibility.value = state.value.profileBasics.work_visibility
})

// Convert attribute options to radio options format
const radioOptions = computed(() => {
  return workOptions.value.map(opt => ({
    value: opt.value,
    label: opt.label
  }))
})

// Sync local state with composable state
watch(work, () => {
  state.value.profileBasics.work = work.value
})

watch(workVisibility, () => {
  state.value.profileBasics.work_visibility = workVisibility.value
})

const handleContinue = async () => {
  error.value = ''

  // Skip if no work selected (optional field)
  if (!work.value) {
    goToStepById('photo')
    return
  }

  // Save to API
  const attributeKeyId = getAttributeKeyId('work')
  if (!attributeKeyId) {
    error.value = 'Failed to load work options'
    return
  }

  const success = await saveAttributes([
    {
      attribute_key_id: attributeKeyId,
      value: work.value,
      is_visible_on_profile: workVisibility.value
    }
  ])

  if (!success) {
    error.value = state.value.errors.general || 'Failed to save work information'
    return
  }

  // Navigate to next step
  goToStepById('photo')
}

const handleSkip = () => {
  goToStepById('photo')
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-gray-900">What do you do for work?</h1>
          <p class="text-gray-600 mt-2">This helps with compatibility and gives people context on your life</p>
        </div>

        <!-- Form -->
        <div class="space-y-6">
          <!-- Error Message -->
          <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-xl" role="alert">
            <p class="text-sm text-red-600">{{ error }}</p>
          </div>

          <RadioOptionCard
            v-model="work"
            :options="radioOptions"
            name="work"
            show-visibility
            :disabled="saving"
            @update:visibility="workVisibility = $event"
          />

          <!-- Action Buttons -->
          <div class="space-y-3">
            <UiButton
              v-if="work"
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
