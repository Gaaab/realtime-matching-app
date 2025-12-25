<script setup lang="ts">
interface Props {
  isLoading?: boolean
  isSending?: boolean
  disabled?: boolean
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  isSending: false,
  disabled: false,
  placeholder: 'Type a message...'
})

const emit = defineEmits<{
  send: [message: string]
  typing: [isTyping: boolean]
}>()

const message = ref('')
const textarea = ref<HTMLTextAreaElement | null>(null)
let typingTimeout: NodeJS.Timeout | null = null

const handleInput = () => {
  // Auto-grow textarea
  if (textarea.value) {
    textarea.value.style.height = 'auto'
    textarea.value.style.height = Math.min(textarea.value.scrollHeight, 120) + 'px'
  }

  // Emit typing indicator
  emit('typing', message.value.length > 0)

  // Reset typing timeout
  if (typingTimeout) clearTimeout(typingTimeout)
  typingTimeout = setTimeout(() => {
    emit('typing', false)
  }, 3000)
}

const handleSend = () => {
  if (!message.value.trim() || props.isLoading || props.isSending || props.disabled) return

  const content = message.value.trim()
  message.value = ''

  // Reset textarea height
  if (textarea.value) {
    textarea.value.style.height = 'auto'
  }

  // Reset typing indicator
  if (typingTimeout) clearTimeout(typingTimeout)
  emit('typing', false)

  emit('send', content)
}

const handleKeyPress = (e: KeyboardEvent) => {
  // Send on Ctrl+Enter or Cmd+Enter
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    handleSend()
  }
  // Send on Enter (mobile/simple mode)
  // Note: Shift+Enter for new line
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

const focusInput = () => {
  textarea.value?.focus()
}

defineExpose({
  focusInput
})
</script>

<template>
  <div class="border-t border-gray-200 bg-white p-4 space-y-3">
    <!-- Attachment/Action Buttons (optional) -->
    <div class="flex gap-2 justify-between items-center text-sm text-gray-500">
      <div class="flex gap-2">
        <button
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors hover:text-gray-700"
          title="Attach file"
          :disabled="disabled || isSending"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
        <button
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors hover:text-gray-700"
          title="Send emoji"
          :disabled="disabled || isSending"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      <span v-if="isSending" class="text-xs text-primary-600 font-medium">Sending...</span>
    </div>

    <!-- Input Area -->
    <div class="flex gap-3 items-end">
      <!-- Textarea -->
      <div class="flex-1 relative">
        <textarea
          ref="textarea"
          v-model="message"
          :placeholder="placeholder"
          :disabled="disabled || isSending"
          @input="handleInput"
          @keypress="handleKeyPress"
          class="w-full bg-gray-100 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white resize-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          rows="1"
          style="max-height: 120px;"
        ></textarea>
      </div>

      <!-- Send Button -->
      <button
        @click="handleSend"
        :disabled="!message.trim() || disabled || isSending || isLoading"
        class="flex-shrink-0 p-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        title="Send message (Ctrl/Cmd + Enter)"
      >
        <svg
          v-if="!isSending"
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        <svg
          v-else
          class="w-5 h-5 animate-spin"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </button>
    </div>

    <!-- Help Text -->
    <p class="text-xs text-gray-400">Press Ctrl+Enter to send</p>
  </div>
</template>
