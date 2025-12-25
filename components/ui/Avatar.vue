<script setup lang="ts">
interface Props {
  src?: string
  alt?: string
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  online?: boolean
  shape?: 'circle' | 'rounded' | 'square'
  blurred?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  shape: 'circle',
  online: false,
  blurred: false
})

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
</script>

<template>
  <div class="relative inline-block">
    <div
      :class="[sizeClasses, shapeClasses]"
      class="flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600 text-white font-semibold"
    >
      <img
        v-if="src && !imageError"
        :src="src"
        :alt="alt || name || 'Avatar'"
        :class="{ 'blur-lg': blurred }"
        class="w-full h-full object-cover transition-all duration-300"
        @error="handleImageError"
      />
      <span v-else :class="{ 'blur-sm': blurred }">{{ initials }}</span>
    </div>

    <!-- Blur indicator icon -->
    <div
      v-if="blurred"
      class="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <svg class="w-6 h-6 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    </div>

    <!-- Online indicator -->
    <span
      v-if="online"
      :class="[indicatorSizeClasses]"
      class="absolute bottom-0 right-0 block rounded-full bg-green-500 ring-2 ring-white"
    />
  </div>
</template>
