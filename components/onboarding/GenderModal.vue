<script setup lang="ts">
interface Props {
  show: boolean
  modelValue: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  close: []
}>()

const selectedGender = ref(props.modelValue)

// Extended gender options
const extendedOptions = [
  { value: 'agender', label: 'Agender' },
  { value: 'bigender', label: 'Bigender' },
  { value: 'genderqueer', label: 'Genderqueer' },
  { value: 'intersex', label: 'Intersex' },
  { value: 'trans_woman', label: 'Trans woman' },
  { value: 'trans_man', label: 'Trans man' },
  { value: 'two_spirit', label: 'Two Spirit' },
  { value: 'questioning', label: 'Questioning' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  { value: 'other', label: 'Other' }
]

const handleConfirm = () => {
  emit('update:modelValue', selectedGender.value)
  emit('close')
}

const handleClose = () => {
  emit('close')
}

// Watch for prop changes
watch(() => props.modelValue, (newValue) => {
  selectedGender.value = newValue
})
</script>

<template>
  <UiModal :show="show" @close="handleClose">
    <div class="p-6">
      <h3 class="text-2xl font-bold text-gray-900 mb-4">Select your gender identity</h3>

      <!-- Extended Options -->
      <fieldset class="space-y-3 mb-6 max-h-96 overflow-y-auto" role="radiogroup">
        <label
          v-for="option in extendedOptions"
          :key="option.value"
          :for="`gender-modal-${option.value}`"
          :class="[
            'flex items-center justify-between px-5 py-4 border-2 rounded-2xl cursor-pointer transition-all duration-200',
            selectedGender === option.value
              ? 'border-primary bg-primary-50 text-primary-700'
              : 'border-gray-200 hover:border-gray-300'
          ]"
        >
          <span class="font-medium">{{ option.label }}</span>
          <input
            :id="`gender-modal-${option.value}`"
            type="radio"
            name="gender-modal"
            :value="option.value"
            v-model="selectedGender"
            class="w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500"
          />
        </label>
      </fieldset>

      <!-- Actions -->
      <div class="flex space-x-3">
        <UiButton variant="outline" fullWidth @click="handleClose">
          Cancel
        </UiButton>
        <UiButton fullWidth @click="handleConfirm">
          Confirm
        </UiButton>
      </div>
    </div>
  </UiModal>
</template>
