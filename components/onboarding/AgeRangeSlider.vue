<script setup lang="ts">
/**
 * AgeRangeSlider Component
 *
 * Dual-handle range slider for selecting minimum and maximum age preferences.
 * Uses two overlapping HTML5 range inputs for accessibility and native behavior.
 */

import type { AgeRange } from '~/types/onboarding'

interface Props {
  modelValue: AgeRange
  minAge?: number
  maxAge?: number
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  minAge: 18,
  maxAge: 80,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: AgeRange]
}>()

const minValue = ref(props.modelValue.min)
const maxValue = ref(props.modelValue.max)

// Calculate range bar position
const rangePercent = computed(() => {
  const range = props.maxAge - props.minAge
  const minPercent = ((minValue.value - props.minAge) / range) * 100
  const maxPercent = ((maxValue.value - props.minAge) / range) * 100
  return {
    left: `${minPercent}%`,
    width: `${maxPercent - minPercent}%`
  }
})

const updateMinValue = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = parseInt(target.value)

  // Ensure min doesn't exceed max - 1
  if (value < maxValue.value) {
    minValue.value = value
    emit('update:modelValue', { min: minValue.value, max: maxValue.value })
  }
}

const updateMaxValue = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = parseInt(target.value)

  // Ensure max doesn't go below min + 1
  if (value > minValue.value) {
    maxValue.value = value
    emit('update:modelValue', { min: minValue.value, max: maxValue.value })
  }
}

// Watch for external prop changes
watch(() => props.modelValue, (newValue) => {
  minValue.value = newValue.min
  maxValue.value = newValue.max
}, { deep: true })
</script>

<template>
  <div class="space-y-6">
    <!-- Display Current Range -->
    <div class="text-center">
      <p class="text-2xl font-bold text-gray-900">
        {{ minValue }} - {{ maxValue }} years old
      </p>
    </div>

    <!-- Dual Range Slider -->
    <div class="relative pt-6 pb-2">
      <!-- Track Background -->
      <div class="absolute w-full h-2 bg-gray-200 rounded-full top-1/2 -translate-y-1/2"></div>

      <!-- Active Range Track -->
      <div
        class="absolute h-2 bg-primary rounded-full top-1/2 -translate-y-1/2 transition-all"
        :style="{ left: rangePercent.left, width: rangePercent.width }"
      ></div>

      <!-- Min Handle Slider -->
      <input
        type="range"
        :min="minAge"
        :max="maxAge"
        :value="minValue"
        :disabled="disabled"
        class="absolute w-full h-2 appearance-none bg-transparent pointer-events-none focus:outline-none"
        style="z-index: 2"
        :aria-label="`Minimum age: ${minValue}`"
        @input="updateMinValue"
      />

      <!-- Max Handle Slider -->
      <input
        type="range"
        :min="minAge"
        :max="maxAge"
        :value="maxValue"
        :disabled="disabled"
        class="absolute w-full h-2 appearance-none bg-transparent pointer-events-none focus:outline-none"
        style="z-index: 2"
        :aria-label="`Maximum age: ${maxValue}`"
        @input="updateMaxValue"
      />
    </div>

    <!-- Min/Max Labels -->
    <div class="flex justify-between text-sm text-gray-500">
      <span>{{ minAge }}</span>
      <span>{{ maxAge }}</span>
    </div>
  </div>
</template>

<style scoped>
/* Custom slider styling for range inputs */
input[type="range"] {
  pointer-events: all;
}

/* Webkit (Chrome, Safari) */
input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 24px;
  height: 24px;
  background: white;
  border: 2px solid #0050FF;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  pointer-events: all;
  transition: transform 0.2s, box-shadow 0.2s;
}

input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 80, 255, 0.3);
}

input[type="range"]:focus::-webkit-slider-thumb {
  outline: 2px solid #0050FF;
  outline-offset: 2px;
}

input[type="range"]:disabled::-webkit-slider-thumb {
  cursor: not-allowed;
  opacity: 0.5;
}

/* Firefox */
input[type="range"]::-moz-range-thumb {
  width: 24px;
  height: 24px;
  background: white;
  border: 2px solid #0050FF;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  pointer-events: all;
  transition: transform 0.2s, box-shadow 0.2s;
}

input[type="range"]::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 80, 255, 0.3);
}

input[type="range"]:focus::-moz-range-thumb {
  outline: 2px solid #0050FF;
  outline-offset: 2px;
}

input[type="range"]:disabled::-moz-range-thumb {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
