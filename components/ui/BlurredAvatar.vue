<script setup lang="ts">
/**
 * BlurredAvatar Component
 *
 * Displays a user avatar with optional blur effect for privacy.
 * Supports animated reveal transitions when blur is removed.
 */

interface Props {
  src?: string | null
  alt?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  blurred?: boolean
  online?: boolean
  shape?: 'circle' | 'rounded' | 'square'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  blurred: true,
  online: false,
  shape: 'circle'
})

const emit = defineEmits<{
  click: []
}>()

const sizeClasses = computed(() => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
    '2xl': 'w-32 h-32 text-3xl'
  }
  return sizes[props.size]
})

const shapeClasses = computed(() => {
  const shapes = {
    circle: 'rounded-full',
    rounded: 'rounded-lg',
    square: 'rounded-none'
  }
  return shapes[props.shape]
})

const indicatorSizeClasses = computed(() => {
  const sizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
    '2xl': 'w-6 h-6'
  }
  return sizes[props.size]
})

const blurIntensity = computed(() => {
  // Higher blur for larger avatars to maintain privacy
  const intensities = {
    xs: 'blur-[4px]',
    sm: 'blur-[6px]',
    md: 'blur-[8px]',
    lg: 'blur-[10px]',
    xl: 'blur-[12px]',
    '2xl': 'blur-[16px]'
  }
  return intensities[props.size]
})

const initials = computed(() => {
  if (!props.name) return '?'
  const parts = props.name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return props.name.substring(0, 2).toUpperCase()
})

const imageError = ref(false)

const handleImageError = () => {
  imageError.value = true
}

const handleClick = () => {
  emit('click')
}
</script>

<template>
  <div
    class="relative inline-block cursor-pointer group"
    @click="handleClick"
  >
    <!-- Avatar Container -->
    <div
      :class="[
        sizeClasses,
        shapeClasses,
        'relative overflow-hidden transition-all duration-300'
      ]"
    >
      <!-- Blurred overlay effect -->
      <div
        v-if="blurred"
        class="absolute inset-0 z-10 flex items-center justify-center"
        :class="shapeClasses"
      >
        <!-- Frosted glass effect -->
        <div
          class="absolute inset-0 bg-gradient-to-br from-gray-200/80 to-gray-300/80 backdrop-blur-sm"
          :class="shapeClasses"
        />
        <!-- Question mark or silhouette icon -->
        <svg
          class="relative z-20 text-gray-500 opacity-60"
          :class="{
            'w-3 h-3': size === 'xs',
            'w-4 h-4': size === 'sm',
            'w-5 h-5': size === 'md',
            'w-6 h-6': size === 'lg',
            'w-8 h-8': size === 'xl',
            'w-10 h-10': size === '2xl'
          }"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clip-rule="evenodd"
          />
        </svg>
      </div>

      <!-- Actual Avatar Content -->
      <div
        :class="[
          sizeClasses,
          shapeClasses,
          'flex items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600 text-white font-semibold',
          blurred ? blurIntensity : ''
        ]"
        class="transition-all duration-500"
      >
        <img
          v-if="src && !imageError"
          :src="src"
          :alt="alt || name || 'Avatar'"
          class="w-full h-full object-cover"
          :class="blurred ? blurIntensity : ''"
          @error="handleImageError"
        />
        <span v-else :class="blurred ? 'opacity-0' : 'opacity-100'">
          {{ initials }}
        </span>
      </div>

      <!-- Reveal hint on hover (when blurred) -->
      <div
        v-if="blurred"
        class="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        :class="shapeClasses"
      >
        <div
          class="absolute inset-0 bg-black/20"
          :class="shapeClasses"
        />
        <svg
          class="relative z-30 text-white"
          :class="{
            'w-2 h-2': size === 'xs',
            'w-3 h-3': size === 'sm',
            'w-4 h-4': size === 'md',
            'w-5 h-5': size === 'lg',
            'w-6 h-6': size === 'xl',
            'w-8 h-8': size === '2xl'
          }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      </div>
    </div>

    <!-- Online indicator -->
    <span
      v-if="online"
      :class="[indicatorSizeClasses]"
      class="absolute bottom-0 right-0 block rounded-full bg-green-500 ring-2 ring-white"
    />

    <!-- Blurred indicator badge (optional visual cue) -->
    <span
      v-if="blurred"
      class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center"
    >
      <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-50" />
      <span class="relative inline-flex h-3 w-3 rounded-full bg-primary-500 border border-white" />
    </span>
  </div>
</template>

<style scoped>
/* Smooth blur transition */
.blur-transition {
  transition: filter 0.5s ease-in-out;
}
</style>
