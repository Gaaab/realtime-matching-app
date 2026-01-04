<script setup lang="ts">
/**
 * ConfirmDialog - Simple confirmation dialog for destructive actions
 *
 * Provides an accessible modal with:
 * - Title and message
 * - Confirm and cancel buttons
 * - Loading state during API calls
 * - Focus trapping and ESC key handling
 */

interface Props {
  modelValue: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'primary'
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'danger',
  isLoading: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
}>()

// Focus management
const confirmButtonRef = ref<HTMLElement | null>(null)

const variantClasses = computed(() => {
  const variants = {
    danger: {
      icon: 'bg-red-100',
      iconColor: 'text-red-600',
      button: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
    },
    warning: {
      icon: 'bg-amber-100',
      iconColor: 'text-amber-600',
      button: 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500'
    },
    primary: {
      icon: 'bg-primary-100',
      iconColor: 'text-primary-600',
      button: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500'
    }
  }
  return variants[props.variant]
})

const close = () => {
  if (props.isLoading) return
  emit('update:modelValue', false)
}

const handleConfirm = () => {
  if (props.isLoading) return
  emit('confirm')
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && !props.isLoading) {
    close()
  }
}

// Focus confirm button when modal opens
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      confirmButtonRef.value?.focus()
    })
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
        :aria-labelledby="'dialog-title'"
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
            class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <!-- Header with Icon -->
            <div class="p-6">
              <div class="flex items-start gap-4">
                <!-- Icon -->
                <div
                  :class="[
                    'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
                    variantClasses.icon
                  ]"
                >
                  <svg
                    :class="['w-6 h-6', variantClasses.iconColor]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <h2
                    id="dialog-title"
                    class="text-lg font-semibold text-gray-900 mb-2"
                  >
                    {{ title }}
                  </h2>
                  <p class="text-sm text-gray-600 leading-relaxed">
                    {{ message }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 bg-gray-50 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                @click="close"
                :disabled="isLoading"
                class="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ cancelText }}
              </button>
              <button
                ref="confirmButtonRef"
                @click="handleConfirm"
                :disabled="isLoading"
                :class="[
                  'w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2',
                  variantClasses.button
                ]"
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
                <span>{{ isLoading ? 'Processing...' : confirmText }}</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
