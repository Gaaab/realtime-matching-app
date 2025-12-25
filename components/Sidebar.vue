<script setup lang="ts">
interface Props {
  modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const route = useRoute()

const navItems = [
  {
    name: 'Discover',
    icon: 'compass',
    path: '/dashboard',
    description: 'Find new matches'
  },
  {
    name: 'Matches',
    icon: 'heart',
    path: '/matches',
    description: 'Your connections',
    badge: 12
  },
  {
    name: 'Messages',
    icon: 'chat',
    path: '/chat',
    description: 'Chat with matches',
    badge: 3
  },
  {
    name: 'Profile',
    icon: 'user',
    path: '/profile',
    description: 'Edit your profile'
  },
  {
    name: 'Settings',
    icon: 'settings',
    path: '/settings',
    description: 'Preferences & privacy'
  }
]

const isActive = (path: string) => {
  return route.path === path
}

const closeSidebar = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <!-- Mobile Backdrop -->
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
      class="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
      @click="closeSidebar"
    />
  </Transition>

  <!-- Sidebar -->
  <aside
    :class="[
      'fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-200 transition-transform duration-200',
      modelValue ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]"
  >
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span class="text-lg font-bold text-gray-900">IntroMatch</span>
        </div>
        <button
          @click="closeSidebar"
          class="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
        <NuxtLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :class="[
            'flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200',
            isActive(item.path)
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-700 hover:bg-gray-50'
          ]"
          @click="closeSidebar"
        >
          <div class="flex items-center space-x-3">
            <!-- Icon -->
            <div
              :class="[
                'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                isActive(item.path)
                  ? 'bg-primary-100'
                  : 'bg-gray-100'
              ]"
            >
              <svg
                :class="[
                  'w-5 h-5',
                  isActive(item.path) ? 'text-primary-600' : 'text-gray-600'
                ]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <!-- Compass -->
                <path v-if="item.icon === 'compass'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                <!-- Heart -->
                <path v-else-if="item.icon === 'heart'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                <!-- Chat -->
                <path v-else-if="item.icon === 'chat'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                <!-- User -->
                <path v-else-if="item.icon === 'user'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                <!-- Settings -->
                <path v-else-if="item.icon === 'settings'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
            </div>

            <!-- Text -->
            <div>
              <div class="text-sm font-medium">{{ item.name }}</div>
              <div class="text-xs text-gray-500">{{ item.description }}</div>
            </div>
          </div>

          <!-- Badge -->
          <UiBadge v-if="item.badge" variant="primary" size="sm">
            {{ item.badge }}
          </UiBadge>
        </NuxtLink>
      </nav>

      <!-- Footer -->
      <div class="p-4 border-t border-gray-200">
        <div class="px-4 py-3 bg-gradient-to-br from-primary-50 to-pink-50 rounded-xl">
          <div class="flex items-center space-x-2 mb-2">
            <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <span class="text-sm font-semibold text-primary-900">Go Premium</span>
          </div>
          <p class="text-xs text-gray-600 mb-3">Unlock unlimited likes and more features</p>
          <UiButton variant="primary" size="sm" full-width>
            Upgrade Now
          </UiButton>
        </div>
      </div>
    </div>
  </aside>
</template>
