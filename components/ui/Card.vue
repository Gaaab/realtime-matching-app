<script setup lang="ts">
interface Props {
  variant?: 'default' | 'elevated' | 'outline'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  padding: 'md',
  hoverable: false,
  clickable: false
})

const cardClasses = computed(() => {
  const base = 'rounded-xl transition-all duration-200'

  const variants = {
    default: 'bg-white border border-gray-200',
    elevated: 'bg-white shadow-lg',
    outline: 'bg-transparent border-2 border-gray-300'
  }

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8'
  }

  const interactive = props.hoverable || props.clickable ? 'hover:shadow-xl hover:scale-[1.02]' : ''
  const cursor = props.clickable ? 'cursor-pointer' : ''

  return [
    base,
    variants[props.variant],
    paddings[props.padding],
    interactive,
    cursor
  ].join(' ')
})
</script>

<template>
  <div :class="cardClasses">
    <slot />
  </div>
</template>
