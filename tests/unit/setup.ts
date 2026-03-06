import { ref, computed, onBeforeUnmount } from 'vue'
import { vi } from 'vitest'

// Provide Nuxt auto-imports for vitest
globalThis.ref = ref
globalThis.computed = computed
globalThis.onBeforeUnmount = onBeforeUnmount
globalThis.useNuxtApp = vi.fn(() => ({ $ably: null }))
globalThis.useRuntimeConfig = vi.fn(() => ({ public: { apiBase: '' } }))
globalThis.navigateTo = vi.fn()
