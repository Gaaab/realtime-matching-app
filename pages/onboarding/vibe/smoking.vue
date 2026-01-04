<script setup lang="ts">
/**
 * Onboarding - Smoking Stance Step
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

const { smokingOptions, getAttributeKeyId } = useAttributes()

const smoking = ref('')
const smokingVisibility = ref(true)
const error = ref('')

// Load existing data and sync step on mount
onMounted(async () => {
  syncStepById('vibe-smoking')
  await loadExistingData()

  // Initialize local refs from loaded state
  smoking.value = state.value.vibeLifestyle.smoking
  smokingVisibility.value = state.value.vibeLifestyle.smoking_visibility
})

const radioOptions = computed(() => {
  return smokingOptions.value.map(opt => ({
    value: opt.value,
    label: opt.label
  }))
})

watch(smoking, () => {
  state.value.vibeLifestyle.smoking = smoking.value
})

watch(smokingVisibility, () => {
  state.value.vibeLifestyle.smoking_visibility = smokingVisibility.value
})

const handleContinue = async () => {
  error.value = ''

  // Skip if not selected (optional)
  if (!smoking.value) {
    goToStepById('vibe-religion')
    return
  }

  // Save to API
  const attributeKeyId = getAttributeKeyId('smoking')
  if (!attributeKeyId) {
    error.value = 'Failed to load smoking options'
    return
  }

  const success = await saveAttributes([
    {
      attribute_key_id: attributeKeyId,
      value: smoking.value,
      is_visible_on_profile: smokingVisibility.value
    }
  ])

  if (!success) {
    error.value = state.value.errors.general || 'Failed to save smoking stance'
    return
  }

  // Navigate to next step
  goToStepById('vibe-religion')
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-900">What's your stance on smoking?</h2>
          <p class="text-gray-600 mt-2">Your answer helps match lifestyle compatibility</p>
        </div>

        <!-- Form -->
        <div class="space-y-5">
          <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p class="text-sm text-red-600">{{ error }}</p>
          </div>

          <RadioOptionCard
            v-model="smoking"
            :options="radioOptions"
            name="smoking"
            show-visibility
            :disabled="saving"
            @update:visibility="smokingVisibility = $event"
          />

          <UiButton size="lg" fullWidth :loading="saving" :disabled="saving" @click="handleContinue">
            {{ saving ? 'Saving...' : smoking ? 'Continue' : 'Skip for now' }}
          </UiButton>
        </div>
      </UiCard>
    </div>
  </div>
</template>
