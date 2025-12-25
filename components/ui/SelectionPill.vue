<template>
  <button
    :type="type"
    :class="pillClasses"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
interface Props {
  selected?: boolean
  type?: 'button' | 'submit'
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  type: 'button',
  size: 'md',
})

defineEmits<{
  click: []
}>()

const pillClasses = computed(() => {
  const base = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-full border-2'

  const state = props.selected
    ? 'bg-transparent border-primary text-primary'
    : 'bg-gray-100 border-gray-100 text-gray-900 hover:border-gray-300'

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
  }

  return `${base} ${state} ${sizes[props.size]}`
})
</script>
