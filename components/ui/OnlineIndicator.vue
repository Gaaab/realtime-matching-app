<script setup lang="ts">
const props = defineProps<{
  userId: number
  size?: 'sm' | 'md' | 'lg'
}>()

const presenceStore = usePresenceStore()
const isOnline = computed(() => presenceStore.isOnline(props.userId))

const sizeClasses = computed(() => {
  switch (props.size || 'sm') {
    case 'sm': return 'w-2.5 h-2.5'
    case 'md': return 'w-3 h-3'
    case 'lg': return 'w-3.5 h-3.5'
  }
})
</script>

<template>
  <span
    v-if="isOnline"
    :class="[sizeClasses, 'inline-block rounded-full bg-green-500 ring-2 ring-white']"
    aria-label="Online"
  />
</template>
