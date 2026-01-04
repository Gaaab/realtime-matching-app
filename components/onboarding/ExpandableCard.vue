<script setup lang="ts">
/**
 * ExpandableCard Component
 *
 * Collapsible card with nested radio options, used for dealbreakers.
 */

import type { RadioOption } from '~/types/onboarding'

interface Props {
  title: string
  options: RadioOption[]
  modelValue: string
  expanded?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  expanded: false,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:expanded': [expanded: boolean]
}>()

const isExpanded = ref(props.expanded)

const toggleExpanded = () => {
  if (!props.disabled) {
    isExpanded.value = !isExpanded.value
    emit('update:expanded', isExpanded.value)
  }
}

const handleSelection = (value: string) => {
  emit('update:modelValue', value)
}

// Watch for external prop changes
watch(() => props.expanded, (newValue) => {
  isExpanded.value = newValue
})
</script>

<template>
  <div class="border-2 border-gray-200 rounded-2xl overflow-hidden transition-all duration-300">
    <!-- Card Header -->
    <button
      type="button"
      :disabled="disabled"
      class="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      :class="{ 'cursor-not-allowed opacity-50': disabled }"
      @click="toggleExpanded"
    >
      <span class="font-medium text-gray-900">{{ title }}</span>

      <!-- Expand/Collapse Icon -->
      <svg
        class="w-5 h-5 text-gray-500 transition-transform duration-300"
        :class="{ 'rotate-180': isExpanded }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Expandable Content -->
    <div
      v-if="isExpanded"
      class="border-t border-gray-200 p-4 animate-fadeIn"
    >
      <fieldset class="space-y-2">
        <label
          v-for="option in options"
          :key="option.value"
          :for="`${title}-${option.value}`"
          :class="[
            'flex items-center justify-between px-4 py-3 border rounded-xl cursor-pointer transition-all duration-200',
            modelValue === option.value
              ? 'border-primary bg-primary-50 text-primary-700'
              : 'border-gray-200 hover:border-gray-300',
            disabled ? 'opacity-50 pointer-events-none' : ''
          ]"
        >
          <span class="text-sm font-medium">{{ option.label }}</span>
          <input
            :id="`${title}-${option.value}`"
            type="radio"
            :name="`${title}-options`"
            :value="option.value"
            :checked="modelValue === option.value"
            :disabled="disabled"
            class="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
            @change="handleSelection(option.value)"
          />
        </label>
      </fieldset>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}
</style>
