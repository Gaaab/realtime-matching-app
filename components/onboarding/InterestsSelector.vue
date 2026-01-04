<script setup lang="ts">
/**
 * InterestsSelector Component
 *
 * Categorized multi-select interests with chip-based selection.
 */

import type { InterestCategory } from '~/types/onboarding'

interface Props {
  modelValue: number[] // Array of interest IDs
  categories: InterestCategory[]
  maxSelections?: number
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  maxSelections: undefined,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
}>()

const selectedInterests = ref<number[]>(props.modelValue)

const isSelected = (interestId: number): boolean => {
  return selectedInterests.value.includes(interestId)
}

const canSelect = computed(() => {
  if (!props.maxSelections) return true
  return selectedInterests.value.length < props.maxSelections
})

const selectionCount = computed(() => selectedInterests.value.length)

const toggleInterest = (interestId: number) => {
  if (props.disabled) return

  const index = selectedInterests.value.indexOf(interestId)

  if (index > -1) {
    // Remove if already selected
    selectedInterests.value.splice(index, 1)
  } else {
    // Add if not at max
    if (canSelect.value) {
      selectedInterests.value.push(interestId)
    }
  }

  emit('update:modelValue', selectedInterests.value)
}

// Watch for external prop changes
watch(() => props.modelValue, (newValue) => {
  selectedInterests.value = newValue
}, { deep: true })
</script>

<template>
  <div class="space-y-6">
    <!-- Categories -->
    <div
      v-for="category in categories"
      :key="category.category_id"
      class="space-y-3"
    >
      <!-- Category Header -->
      <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">
        {{ category.category }}
      </h3>

      <!-- Interest Chips -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="interest in category.interests"
          :key="interest.id"
          type="button"
          :disabled="disabled || (!isSelected(interest.id) && !canSelect)"
          :class="[
            'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
            isSelected(interest.id)
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 border border-gray-300 hover:border-gray-400',
            disabled || (!isSelected(interest.id) && !canSelect)
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer'
          ]"
          @click="toggleInterest(interest.id)"
        >
          {{ interest.name }}
        </button>
      </div>
    </div>

    <!-- Selection Count -->
    <div class="sticky bottom-0 bg-white pt-4 border-t border-gray-200">
      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-600">
          {{ selectionCount }} interest{{ selectionCount !== 1 ? 's' : '' }} selected
        </span>
        <span v-if="maxSelections" class="text-gray-500">
          {{ maxSelections - selectionCount }} remaining
        </span>
      </div>
    </div>
  </div>
</template>
