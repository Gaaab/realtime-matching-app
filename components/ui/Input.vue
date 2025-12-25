<script setup lang="ts">
interface Props {
  modelValue?: string | number
  type?: string
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  required?: boolean
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  fullWidth: true,
  disabled: false,
  required: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

// Use Vue's useId() for SSR-safe unique IDs to prevent hydration mismatches
const inputId = useId()

const inputClasses = computed(() => {
  const base = 'block px-4 py-2.5 text-gray-900 bg-white border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1'
  const normalState = 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
  const errorState = 'border-red-500 focus:border-red-500 focus:ring-red-500'
  const disabledState = 'bg-gray-100 cursor-not-allowed'

  return [
    base,
    props.error ? errorState : normalState,
    props.disabled ? disabledState : '',
    props.fullWidth ? 'w-full' : ''
  ].join(' ')
})
</script>

<template>
  <div :class="fullWidth ? 'w-full' : ''">
    <label
      v-if="label"
      :for="inputId"
      class="block mb-2 text-sm font-medium text-gray-700"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :class="inputClasses"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" class="mt-1 text-sm text-red-600">
      {{ error }}
    </p>
  </div>
</template>
