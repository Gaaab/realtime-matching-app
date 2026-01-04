<script setup lang="ts">
import type { ChipOption } from '~/types/onboarding'

interface Props {
  modelValue: string[]
  options: ChipOption[]
  maxSelections?: number
  showVisibility?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  maxSelections: undefined,
  showVisibility: false,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  'update:visibility': [visible: boolean]
}>()

const visibility = ref(true)

// SSR-safe unique ID for the visibility checkbox
const visibilityCheckboxId = useId()

const isSelected = (value: string): boolean => {
  return props.modelValue.includes(value)
}

const canSelect = computed(() => {
  if (!props.maxSelections) return true
  return props.modelValue.length < props.maxSelections
})

const toggleSelection = (value: string) => {
  if (props.disabled) return

  const selected = [...props.modelValue]
  const index = selected.indexOf(value)

  if (index > -1) {
    // Remove if already selected
    selected.splice(index, 1)
  } else {
    // Add if not at max
    if (canSelect.value) {
      selected.push(value)
    }
  }

  emit('update:modelValue', selected)
}

const updateVisibility = (event: Event) => {
  const target = event.target as HTMLInputElement
  visibility.value = target.checked
  emit('update:visibility', target.checked)
}
</script>

<template>
  <div class="space-y-4">
    <!-- Chips Grid -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        :disabled="disabled || (!isSelected(option.value) && !canSelect)"
        :class="[
          'px-4 py-2 rounded-full border-2 text-sm font-medium transition-all duration-200',
          isSelected(option.value)
            ? 'bg-primary text-white border-primary'
            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400',
          disabled || (!isSelected(option.value) && !canSelect)
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer'
        ]"
        @click="toggleSelection(option.value)"
      >
        {{ option.label }}
      </button>
    </div>

    <!-- Max Selection Warning -->
    <p v-if="maxSelections && modelValue.length >= maxSelections" class="text-sm text-gray-500">
      Maximum {{ maxSelections }} selection{{ maxSelections > 1 ? 's' : '' }} reached
    </p>

    <!-- Visibility Checkbox -->
    <div v-if="showVisibility" class="flex items-center space-x-2 text-sm text-gray-600 pt-2">
      <input
        type="checkbox"
        :id="visibilityCheckboxId"
        class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
        :disabled="disabled"
        :checked="visibility"
        @change="updateVisibility"
      />
      <label :for="visibilityCheckboxId">Visible on profile</label>
    </div>
  </div>
</template>
