<script setup lang="ts">
interface Props {
  title: string
  subtitle: string
  iconName?: string
  buttonText?: string
}

const props = withDefaults(defineProps<Props>(), {
  iconName: 'user',
  buttonText: 'Continue'
})

const emit = defineEmits<{
  continue: []
}>()

// Icon SVG paths
const icons: Record<string, string> = {
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  sparkles: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'
}

const iconPath = computed(() => icons[props.iconName] || icons.user)
</script>

<template>
  <div class="text-center">
    <!-- Icon -->
    <div class="w-20 h-20 mx-auto bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center mb-6">
      <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="iconPath" />
      </svg>
    </div>

    <!-- Title -->
    <h2 class="text-3xl font-bold text-gray-900 mb-4">{{ title }}</h2>

    <!-- Subtitle -->
    <p class="text-gray-600 mb-8">{{ subtitle }}</p>

    <!-- CTA Button -->
    <UiButton size="lg" fullWidth @click="emit('continue')">
      {{ buttonText }}
      <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </UiButton>
  </div>
</template>
