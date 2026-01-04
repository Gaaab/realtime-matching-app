<script setup lang="ts">
/**
 * WheelDatePicker Component
 *
 * NOTE: This is a simplified version using native date input.
 * TODO: Implement true iOS-style wheel picker for production.
 * Consider libraries like @vueuse/core or a custom implementation with scroll snap.
 */

interface Props {
  modelValue: string // ISO date format YYYY-MM-DD
  minDate?: string
  maxDate?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  minDate: undefined,
  maxDate: undefined,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// SSR-safe unique ID
const inputId = useId()

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

// Calculate min/max dates
const minDateValue = computed(() => {
  if (props.minDate) return props.minDate

  // Default: 100 years ago
  const date = new Date()
  date.setFullYear(date.getFullYear() - 100)
  return date.toISOString().split('T')[0]
})

const maxDateValue = computed(() => {
  if (props.maxDate) return props.maxDate

  // Default: 18 years ago (minimum age)
  const date = new Date()
  date.setFullYear(date.getFullYear() - 18)
  return date.toISOString().split('T')[0]
})
</script>

<template>
  <div class="space-y-2">
    <!-- Native Date Input (styled to match design) -->
    <input
      :id="inputId"
      type="date"
      :value="modelValue"
      :min="minDateValue"
      :max="maxDateValue"
      :disabled="disabled"
      class="block w-full px-4 py-3 text-lg text-gray-900 bg-white border-2 border-gray-300 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      @input="handleInput"
    />

    <p class="text-xs text-gray-500">
      You must be at least 18 years old
    </p>

    <!-- TODO: Future wheel picker implementation -->
    <!--
    <div class="wheel-picker">
      <div class="wheel-column">Day</div>
      <div class="wheel-column">Month</div>
      <div class="wheel-column">Year</div>
    </div>
    -->
  </div>
</template>

<style scoped>
/* Enhanced date input styling */
input[type="date"]::-webkit-calendar-picker-indicator {
  cursor: pointer;
  filter: opacity(0.5);
}

input[type="date"]:hover::-webkit-calendar-picker-indicator {
  filter: opacity(1);
}
</style>
