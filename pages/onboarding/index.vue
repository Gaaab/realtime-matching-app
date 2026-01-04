<script setup lang="ts">
/**
 * Onboarding - Section 1 Intro
 * First screen of the Profile Basics section
 */

definePageMeta({
  layout: 'default',
  middleware: 'auth'
})

const { goToStepById, syncStepById, loadExistingData } = useOnboarding()

// Sync step and load existing data on mount
onMounted(async () => {
  syncStepById('intro')
  await loadExistingData()
})

const handleContinue = () => {
  goToStepById('name')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-pink-50 to-purple-50 py-8 px-4">
    <div class="max-w-md mx-auto">
      <UiCard variant="elevated" padding="lg">
        <SectionIntro
          title="Let's set up the essentials"
          subtitle="A few quick details to help people get to know the real you"
          icon-name="user"
          button-text="Let's do it"
          @continue="handleContinue"
        />
      </UiCard>
    </div>
  </div>
</template>
