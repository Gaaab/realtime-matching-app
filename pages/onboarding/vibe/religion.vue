<script setup lang="ts">
/**
 * Onboarding - Religion/Spirituality Step
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

const { religionOptions, getAttributeKeyId } = useAttributes()

const religion = ref('')
const religionVisibility = ref(true)
const error = ref('')

// Load existing data and sync step on mount
onMounted(async () => {
  syncStepById('vibe-religion')
  await loadExistingData()

  // Initialize local refs from loaded state
  religion.value = state.value.vibeLifestyle.religion
  religionVisibility.value = state.value.vibeLifestyle.religion_visibility
})

const radioOptions = computed(() => {
  return religionOptions.value.map(opt => ({
    value: opt.value,
    label: opt.label
  }))
})

watch(religion, () => {
  state.value.vibeLifestyle.religion = religion.value
})

watch(religionVisibility, () => {
  state.value.vibeLifestyle.religion_visibility = religionVisibility.value
})

const handleContinue = async () => {
  error.value = ''

  // Skip if not selected (optional)
  if (!religion.value) {
    goToStepById('vibe-interests')
    return
  }

  // Save to API
  const attributeKeyId = getAttributeKeyId('religion')
  if (!attributeKeyId) {
    error.value = 'Failed to load religion options'
    return
  }

  const success = await saveAttributes([
    {
      attribute_key_id: attributeKeyId,
      value: religion.value,
      is_visible_on_profile: religionVisibility.value
    }
  ])

  if (!success) {
    error.value = state.value.errors.general || 'Failed to save religion'
    return
  }

  // Navigate to next step
  goToStepById('vibe-interests')
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-900">Do you follow a spiritual or religious path?</h2>
          <p class="text-gray-600 mt-2">Optionally share what's important to you</p>
        </div>

        <!-- Form -->
        <div class="space-y-5">
          <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p class="text-sm text-red-600">{{ error }}</p>
          </div>

          <RadioOptionCard
            v-model="religion"
            :options="radioOptions"
            name="religion"
            show-visibility
            :disabled="saving"
            @update:visibility="religionVisibility = $event"
          />

          <UiButton size="lg" fullWidth :loading="saving" :disabled="saving" @click="handleContinue">
            {{ saving ? 'Saving...' : religion ? 'Continue' : 'Skip for now' }}
          </UiButton>
        </div>
      </UiCard>
    </div>
  </div>
</template>
