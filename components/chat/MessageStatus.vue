<script setup lang="ts">
type MessageStatusType = 'pending' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

interface Props {
  status: MessageStatusType
  size?: 'sm' | 'md'
  showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
  showLabel: false
})

const emit = defineEmits<{
  retry: []
}>()

const statusConfig = computed(() => {
  const configs: Record<MessageStatusType, {
    icon: string
    label: string
    color: string
    animate?: boolean
  }> = {
    pending: {
      icon: 'clock',
      label: 'Pending',
      color: 'text-gray-400',
      animate: true
    },
    sending: {
      icon: 'spinner',
      label: 'Sending',
      color: 'text-gray-400',
      animate: true
    },
    sent: {
      icon: 'check',
      label: 'Sent',
      color: 'text-gray-400'
    },
    delivered: {
      icon: 'check-double',
      label: 'Delivered',
      color: 'text-gray-400'
    },
    read: {
      icon: 'check-double',
      label: 'Read',
      color: 'text-primary-500'
    },
    failed: {
      icon: 'x-circle',
      label: 'Failed to send',
      color: 'text-red-500'
    }
  }
  return configs[props.status]
})

const iconSize = computed(() => {
  return props.size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
})
</script>

<template>
  <div
    class="inline-flex items-center gap-1"
    :class="statusConfig.color"
    role="status"
  >
    <!-- Pending/Clock Icon -->
    <svg
      v-if="statusConfig.icon === 'clock'"
      :class="[iconSize, { 'animate-pulse': statusConfig.animate }]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>

    <!-- Spinner Icon -->
    <svg
      v-else-if="statusConfig.icon === 'spinner'"
      :class="[iconSize, 'animate-spin']"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>

    <!-- Single Check Icon -->
    <svg
      v-else-if="statusConfig.icon === 'check'"
      :class="iconSize"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
    </svg>

    <!-- Double Check Icon -->
    <div
      v-else-if="statusConfig.icon === 'check-double'"
      class="flex -space-x-1.5"
      aria-hidden="true"
    >
      <svg :class="iconSize" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
      </svg>
      <svg :class="iconSize" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
      </svg>
    </div>

    <!-- Failed/Error Icon -->
    <button
      v-else-if="statusConfig.icon === 'x-circle'"
      type="button"
      :class="iconSize"
      class="hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded-full"
      aria-label="Message failed. Click to retry."
      @click="emit('retry')"
    >
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>

    <!-- Label -->
    <span v-if="showLabel" class="text-xs">
      {{ statusConfig.label }}
    </span>

    <!-- Screen Reader Text -->
    <span class="sr-only">{{ statusConfig.label }}</span>
  </div>
</template>
