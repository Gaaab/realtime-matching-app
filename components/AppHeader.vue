<script setup lang="ts">
interface Props {
  transparent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  transparent: false
})

const isMenuOpen = ref(false)
const isLoggedIn = ref(true) // This will be connected to auth store later

const user = ref({
  name: 'Sarah Johnson',
  avatar: 'https://i.pravatar.cc/150?img=47',
  notifications: 3
})

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}

// Close menu when clicking outside
onMounted(() => {
  if (typeof document !== 'undefined') {
    document.addEventListener('click', closeMenu)
  }
})

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('click', closeMenu)
  }
})
</script>

<template>
  <header
    :class="[
      'sticky top-0 z-40 w-full border-b transition-all duration-200',
      transparent ? 'bg-transparent border-transparent' : 'bg-white border-gray-200 shadow-sm'
    ]"
  >
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center space-x-2">
          <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span class="text-xl font-bold text-gray-900">IntroMatch</span>
        </NuxtLink>

        <!-- Desktop Navigation -->
        <nav v-if="isLoggedIn" class="hidden md:flex items-center space-x-1">
          <NuxtLink
            to="/dashboard"
            class="px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            Discover
          </NuxtLink>
          <NuxtLink
            to="/matches"
            class="px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            Matches
          </NuxtLink>
          <NuxtLink
            to="/chat"
            class="px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors relative"
          >
            Messages
            <span v-if="user.notifications > 0" class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </NuxtLink>
        </nav>

        <!-- User Menu / Auth Buttons -->
        <div class="flex items-center space-x-3">
          <template v-if="isLoggedIn">
            <!-- Notifications -->
            <button class="relative p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span v-if="user.notifications > 0" class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <!-- User Avatar & Dropdown -->
            <div class="relative" @click.stop>
              <button
                @click="toggleMenu"
                class="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <UiAvatar
                  :src="user.avatar"
                  :name="user.name"
                  size="sm"
                  online
                />
                <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <!-- Dropdown Menu -->
              <Transition
                enter-active-class="transition duration-100 ease-out"
                enter-from-class="transform scale-95 opacity-0"
                enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-75 ease-in"
                leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0"
              >
                <div
                  v-if="isMenuOpen"
                  class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2"
                >
                  <div class="px-4 py-3 border-b border-gray-100">
                    <p class="text-sm font-medium text-gray-900">{{ user.name }}</p>
                    <p class="text-xs text-gray-500 mt-0.5">View profile</p>
                  </div>
                  <NuxtLink
                    to="/profile"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                  >
                    My Profile
                  </NuxtLink>
                  <NuxtLink
                    to="/settings"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                  >
                    Settings
                  </NuxtLink>
                  <hr class="my-2 border-gray-100" />
                  <button
                    class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </Transition>
            </div>
          </template>

          <template v-else>
            <NuxtLink to="/login">
              <UiButton variant="ghost" size="sm">
                Sign In
              </UiButton>
            </NuxtLink>
            <NuxtLink to="/register">
              <UiButton size="sm">
                Get Started
              </UiButton>
            </NuxtLink>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>
