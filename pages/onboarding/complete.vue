<script setup lang="ts">
/**
 * Onboarding - Completion Screen
 */

definePageMeta({
  layout: 'default',
  middleware: 'auth'
})

const router = useRouter()
const { completeOnboarding, saving, syncStepById, loadExistingData } = useOnboarding()
const error = ref('')

// Sync step and load existing data on mount
onMounted(async () => {
  syncStepById('complete')
  await loadExistingData()
})

const handleStartExploring = async () => {
  error.value = ''

  // Mark onboarding as complete
  const success = await completeOnboarding()

  if (!success) {
    error.value = 'Failed to complete onboarding. Please try again.'
    return
  }

  // Navigate to dashboard
  router.push('/dashboard')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-pink-50 to-purple-50 py-8 px-4 flex items-center justify-center">
    <div class="max-w-md mx-auto w-full">
      <UiCard variant="elevated" padding="lg">
        <div class="text-center">
          <!-- Success Icon -->
          <div class="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center mb-6">
            <svg class="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <!-- Title -->
          <h2 class="text-4xl font-bold text-gray-900 mb-4">You're all set!</h2>

          <!-- Subtitle -->
          <p class="text-lg text-gray-600 mb-8">
            Your profile is ready. Let's find your people.
          </p>

          <!-- Error Message -->
          <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
            <p class="text-sm text-red-600">{{ error }}</p>
          </div>

          <!-- CTA Button -->
          <UiButton
            size="lg"
            fullWidth
            :loading="saving"
            :disabled="saving"
            @click="handleStartExploring"
          >
            {{ saving ? 'Completing...' : 'Start Exploring' }}
          </UiButton>

          <!-- Celebratory Message -->
          <div class="mt-8 p-4 bg-primary-50 rounded-xl">
            <p class="text-sm text-primary-700">
              Your profile is ready! You can always update your preferences and details from your profile settings.
            </p>
          </div>
        </div>
      </UiCard>
    </div>
  </div>
</template>
