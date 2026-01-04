<script setup lang="ts">
/**
 * Onboarding - Section 3 Intro (Vibe & Lifestyle)
 */

definePageMeta({
  layout: 'default',
  middleware: 'auth'
})

const { goToStepById, syncStepById, loadExistingData } = useOnboarding()

// Sync step and load existing data on mount
onMounted(async () => {
  syncStepById('vibe-intro')
  await loadExistingData()
})

const handleContinue = () => {
  goToStepById('vibe-kids')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-pink-50 to-purple-50 py-8 px-4">
    <div class="max-w-md mx-auto">
      <UiCard variant="elevated" padding="lg">
        <SectionIntro
          title="Your Vibe & Lifestyle"
          subtitle="Share how you live, what you enjoy, and what matters most to you. We'll use this to match you with people who fit your world."
          icon-name="heart"
          button-text="Let's do it"
          @continue="handleContinue"
        />
      </UiCard>
    </div>
  </div>
</template>
