<script setup lang="ts">
/**
 * Onboarding - Gender Identity Step
 * Allows user to select gender identity with "More" modal for extended options
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
  validateGender,
  saveProfileBasics,
  loadExistingData,
  previous,
  goToStepById,
  syncStepById
} = useOnboarding()

const { genderOptions } = useAttributes()

const gender = ref('')
const genderVisibility = ref(true)
const showGenderModal = ref(false)
const error = ref('')
const isDataLoaded = ref(false)

// Load existing data and sync step on mount
onMounted(async () => {
  syncStepById('gender')
  await loadExistingData()

  // Initialize local refs from loaded state
  gender.value = state.value.profileBasics.gender || ''
  genderVisibility.value = state.value.profileBasics.gender_visibility ?? true
  isDataLoaded.value = true
})

// Convert attribute options to radio options format
const radioOptions = computed(() => {
  return genderOptions.value.map(opt => ({
    value: opt.value,
    label: opt.label
  }))
})

// Sync local state with composable state (only after data is loaded)
watch(gender, () => {
  if (isDataLoaded.value) {
    state.value.profileBasics.gender = gender.value
  }
})

watch(genderVisibility, () => {
  if (isDataLoaded.value) {
    state.value.profileBasics.gender_visibility = genderVisibility.value
  }
})

const handleGenderSelect = (value: string) => {
  if (value === 'more') {
    showGenderModal.value = true
  } else {
    gender.value = value
  }
}

const handleModalUpdate = (value: string) => {
  gender.value = value
}

const handleContinue = async () => {
  error.value = ''

  // Validate
  const validation = validateGender()
  if (!validation.valid) {
    error.value = Object.values(validation.errors)[0]
    return
  }

  // Save to API (only gender)
  const success = await saveProfileBasics({
    gender: gender.value
  })
  if (!success) {
    error.value = state.value.errors.general || 'Failed to save gender'
    return
  }

  // Navigate to next step
  goToStepById('ethnicity')
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-gray-900">How do you identify?</h1>
          <p class="text-gray-600 mt-2">Choose the option that feels right. You can change this in settings.</p>
        </div>

        <!-- Form -->
        <div class="space-y-6">
          <!-- Error Message -->
          <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-xl" role="alert">
            <p class="text-sm text-red-600">{{ error }}</p>
          </div>

          <RadioOptionCard
            :model-value="gender"
            :options="radioOptions"
            name="gender"
            show-visibility
            :disabled="saving"
            @update:model-value="handleGenderSelect"
            @update:visibility="genderVisibility = $event"
          />

          <UiButton
            size="lg"
            fullWidth
            :loading="saving"
            :disabled="saving"
            @click="handleContinue"
          >
            Continue
          </UiButton>
        </div>
      </UiCard>

      <!-- Gender Modal for Extended Options -->
      <GenderModal
        :show="showGenderModal"
        :model-value="gender"
        @update:model-value="handleModalUpdate"
        @close="showGenderModal = false"
      />
    </div>
  </div>
</template>
