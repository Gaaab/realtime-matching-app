<script setup lang="ts">
interface Props {
  length?: number
  modelValue?: string
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  length: 5,
  modelValue: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  complete: [value: string]
}>()

const inputs = ref<(HTMLInputElement | null)[]>([])
const values = ref<string[]>(Array(props.length).fill(''))
const isInternalUpdate = ref(false)

// Initialize and sync values from modelValue
watch(() => props.modelValue, (newVal) => {
  // Skip if this update came from our own handleInput
  if (isInternalUpdate.value) {
    isInternalUpdate.value = false
    return
  }

  // Create array of correct length, filling with characters from newVal or empty strings
  const newValues = Array(props.length).fill('')
  if (newVal) {
    const chars = newVal.split('').slice(0, props.length)
    chars.forEach((char, i) => {
      newValues[i] = char
    })
  }
  values.value = newValues
}, { immediate: true })

const handleInput = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement
  let value = target.value

  // Only allow numeric values
  value = value.replace(/\D/g, '')

  if (value.length > 1) {
    // Handle paste or multiple characters
    const digits = value.slice(0, props.length).split('')

    digits.forEach((digit, i) => {
      if (index + i < props.length) {
        values.value[index + i] = digit
      }
    })

    // Focus last filled input
    const lastIndex = Math.min(index + digits.length - 1, props.length - 1)
    inputs.value[lastIndex]?.focus()

    // Update target value to match what we stored
    target.value = values.value[index] || ''
  } else {
    // Single character input
    values.value[index] = value
    target.value = value

    // Move to next input if value was entered
    if (value && index < props.length - 1) {
      inputs.value[index + 1]?.focus()
    }
  }

  const otpValue = values.value.join('')
  isInternalUpdate.value = true
  emit('update:modelValue', otpValue)

  if (otpValue.length === props.length && otpValue.replace(/\s/g, '').length === props.length) {
    emit('complete', otpValue)
  }
}

const handleKeydown = (index: number, event: KeyboardEvent) => {
  if (event.key === 'Backspace' && !values.value[index] && index > 0) {
    inputs.value[index - 1]?.focus()
  } else if (event.key === 'ArrowLeft' && index > 0) {
    inputs.value[index - 1]?.focus()
  } else if (event.key === 'ArrowRight' && index < props.length - 1) {
    inputs.value[index + 1]?.focus()
  }
}

const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const pasteData = event.clipboardData?.getData('text') || ''
  const digits = pasteData.replace(/\D/g, '').slice(0, props.length).split('')

  // Fill values array with pasted digits
  digits.forEach((digit, i) => {
    values.value[i] = digit
  })
  // Fill remaining with empty strings
  for (let i = digits.length; i < props.length; i++) {
    values.value[i] = ''
  }

  const otpValue = values.value.join('')
  isInternalUpdate.value = true
  emit('update:modelValue', otpValue)

  if (otpValue.length === props.length) {
    emit('complete', otpValue)
  }

  // Focus last input
  inputs.value[digits.length - 1]?.focus()
}

const setInputRef = (index: number) => (el: any) => {
  inputs.value[index] = el
}
</script>

<template>
  <div class="w-full">
    <div class="flex justify-center gap-3">
      <input
        v-for="(value, index) in values"
        :key="index"
        :ref="setInputRef(index)"
        type="text"
        inputmode="numeric"
        maxlength="1"
        :value="value"
        :class="[
          'w-14 h-14 text-center text-2xl font-semibold border-2 rounded-2xl transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
          error 
            ? 'border-red-300 bg-red-50' 
            : value 
              ? 'border-primary bg-primary-50' 
              : 'border-gray-300 bg-white hover:border-gray-400'
        ]"
        @input="handleInput(index, $event)"
        @keydown="handleKeydown(index, $event)"
        @paste="handlePaste"
      />
    </div>
    <p v-if="error" class="mt-3 text-center text-sm text-red-600">{{ error }}</p>
  </div>
</template>
