<script setup lang="ts">
/**
 * ReportModal - Modal for reporting and unmatching a user
 *
 * This component provides an accessible modal with:
 * - Radio button selection for report categories (fetched from API)
 * - Optional text area for additional details
 * - Loading state during API submission
 * - Focus trapping and ESC key handling
 *
 * Note: Reporting will also unmatch the user automatically
 */

import type { ReportCategory } from '~/types/report'

export interface ReportData {
  reasonId: number
  description?: string
}

interface Props {
  modelValue: boolean
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': [data: ReportData]
}>()

// Fetch report categories
const { categories, loading: loadingCategories, fetchReportCategories } = useReport()

// Form state
const selectedReasonId = ref<string>('')
const additionalDetails = ref<string>('')

// Modal reference for focus trapping
const modalRef = ref<HTMLElement | null>(null)
const firstFocusableRef = ref<HTMLElement | null>(null)

// Computed properties
const isFormValid = computed(() => {
  return selectedReasonId.value !== ''
})

const confirmButtonClass = computed(() => {
  const baseClasses = 'w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
  return `${baseClasses} bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500`
})

// Methods
const close = () => {
  if (props.isLoading) return
  emit('update:modelValue', false)
  resetForm()
}

const resetForm = () => {
  selectedReasonId.value = ''
  additionalDetails.value = ''
}

const handleConfirm = () => {
  if (!isFormValid.value || props.isLoading) return

  const reasonId = parseInt(selectedReasonId.value, 10)

  emit('confirm', {
    reasonId,
    description: additionalDetails.value.trim() || undefined
  })
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && !props.isLoading) {
    close()
  }
}

// Fetch categories when modal opens
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    // Fetch categories if not already loaded
    if (categories.value.length === 0) {
      await fetchReportCategories()
    }
    nextTick(() => {
      firstFocusableRef.value?.focus()
    })
  } else {
    resetForm()
  }
})

// Prevent body scroll when modal is open
watch(() => props.modelValue, (isOpen) => {
  if (typeof document !== 'undefined') {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
})

// Cleanup on unmount
onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="close"
        @keydown="handleKeydown"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title-report"
      >
        <Transition
          enter-active-class="transition-all duration-200"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-200"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="modelValue"
            ref="modalRef"
            class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
          >
            <!-- Header -->
            <div class="flex items-center justify-between p-5 border-b border-gray-200">
              <div class="flex items-center gap-3">
                <!-- Report Icon (flag) -->
                <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <svg
                    class="w-5 h-5 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                    />
                  </svg>
                </div>

                <h2 id="modal-title-report" class="text-lg font-semibold text-gray-900">
                  Report and Unmatch
                </h2>
              </div>

              <button
                ref="firstFocusableRef"
                @click="close"
                :disabled="isLoading"
                class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Close modal"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Body -->
            <div class="p-5 overflow-y-auto flex-1">
              <!-- Info Banner -->
              <div class="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p class="text-sm text-amber-800">
                  This will report and unmatch this person. They won't be able to contact you anymore.
                </p>
              </div>

              <!-- Loading State -->
              <div v-if="loadingCategories" class="flex items-center justify-center py-8">
                <svg class="w-8 h-8 animate-spin text-amber-600" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>

              <!-- Reason Selection -->
              <fieldset v-else>
                <legend class="text-sm font-medium text-gray-700 mb-3">
                  Please select a reason
                </legend>

                <div class="space-y-2">
                  <label
                    v-for="category in categories"
                    :key="category.id"
                    :class="[
                      'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                      selectedReasonId === String(category.id)
                        ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    ]"
                  >
                    <input
                      type="radio"
                      name="reason-report"
                      :value="String(category.id)"
                      v-model="selectedReasonId"
                      :disabled="isLoading"
                      class="w-4 h-4 mt-0.5 border-gray-300 text-amber-600 focus:ring-2 focus:ring-amber-500"
                    />
                    <div class="flex-1 min-w-0">
                      <span class="text-sm font-medium text-gray-700">{{ category.label }}</span>
                      <p v-if="category.description" class="text-xs text-gray-500 mt-0.5">
                        {{ category.description }}
                      </p>
                    </div>
                  </label>
                </div>
              </fieldset>

              <!-- Additional Details -->
              <div class="mt-5">
                <label
                  for="details-report"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Additional details (optional)
                </label>
                <textarea
                  id="details-report"
                  v-model="additionalDetails"
                  :disabled="isLoading"
                  rows="3"
                  maxlength="1000"
                  placeholder="Please provide any additional context that might help us investigate..."
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:bg-gray-50 resize-none"
                />
                <p class="mt-1 text-xs text-gray-500 text-right">
                  {{ additionalDetails.length }}/1000
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div class="p-5 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                @click="close"
                :disabled="isLoading"
                class="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                @click="handleConfirm"
                :disabled="!isFormValid || isLoading || loadingCategories"
                :class="confirmButtonClass"
              >
                <svg
                  v-if="isLoading"
                  class="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {{ isLoading ? 'Reporting...' : 'Report and Unmatch' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
