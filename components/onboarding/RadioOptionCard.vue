<script setup lang="ts">
import type { RadioOption } from '~/types/onboarding'

interface Props {
  modelValue: string
  options: RadioOption[]
  name: string
  showVisibility?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showVisibility: false,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:visibility': [visible: boolean]
}>()

const visibility = ref(true)

// SSR-safe unique ID for the visibility checkbox
const visibilityCheckboxId = useId()

const updateValue = (value: string) => {
  emit('update:modelValue', value)
}

const updateVisibility = (event: Event) => {
  const target = event.target as HTMLInputElement
  visibility.value = target.checked
  emit('update:visibility', target.checked)
}
</script>

<template>
  <div class="space-y-4">
    <!-- Radio Options -->
    <fieldset class="space-y-3" role="radiogroup" :aria-labelledby="`${name}-legend`">
      <legend :id="`${name}-legend`" class="sr-only">Select an option</legend>
      <label
        v-for="option in options"
        :key="option.value"
        :for="`${name}-${option.value}`"
        :class="[
          'flex items-center justify-between px-5 py-4 border-2 rounded-2xl cursor-pointer transition-all duration-200',
          modelValue === option.value
            ? 'border-primary bg-primary-50 text-primary-700'
            : 'border-gray-200 hover:border-gray-300',
          disabled ? 'opacity-50 pointer-events-none' : ''
        ]"
      >
        <div class="flex items-center space-x-3">
          <!-- Optional Icon -->
          <svg
            v-if="option.icon"
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="option.icon" />
          </svg>

          <div>
            <span class="font-medium">{{ option.label }}</span>
            <p v-if="option.description" class="text-sm text-gray-500 mt-0.5">
              {{ option.description }}
            </p>
          </div>
        </div>

        <input
          :id="`${name}-${option.value}`"
          type="radio"
          :name="name"
          :value="option.value"
          :checked="modelValue === option.value"
          :disabled="disabled"
          class="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500"
          @change="updateValue(option.value)"
        />
      </label>
    </fieldset>

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
