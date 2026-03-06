<script setup lang="ts">
import { useVenuesStore } from '~/stores/venues'
import { useChatStore } from '~/stores/chat'
import { useNotificationsStore } from '~/stores/notifications'

const route = useRoute()
const venuesStore = useVenuesStore()
const chatStore = useChatStore()
const notificationsStore = useNotificationsStore()

// Navigation items matching the reference design
const navItems = [
  {
    name: 'Explore',
    icon: 'explore',
    path: '/explore',
    ariaLabel: 'Explore venues on map'
  },
  {
    name: 'Chat',
    icon: 'chat',
    path: '/chat',
    ariaLabel: 'View messages',
  },
  {
    name: 'Notifications',
    icon: 'notifications',
    path: '/notifications',
    ariaLabel: 'View notifications',
  },
  {
    name: 'Profile',
    icon: 'profile',
    path: '/profile',
    ariaLabel: 'View your profile'
  }
]

const chatBadge = computed(() => chatStore.unreadCount || null)
const notificationBadge = computed(() => notificationsStore.unreadCount || null)

const isActive = (path: string) => {
  // Handle both exact match and sub-routes
  if (path === '/explore') {
    return route.path === '/explore' || route.path === '/dashboard'
  }
  return route.path.startsWith(path)
}

// Computed property to show active venues badge on Explore tab
const activeVenuesBadge = computed(() => {
  const count = venuesStore.activeVenues?.length || 0
  return count > 0 ? count : null
})
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-bottom"
    role="navigation"
    aria-label="Main navigation"
  >
    <!-- Bottom tabs - consistent on all screen sizes for app-like feel -->
    <div class="flex items-center justify-around h-16 max-w-lg mx-auto px-2 lg:max-w-xl">
      <NuxtLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        :aria-label="item.ariaLabel"
        :aria-current="isActive(item.path) ? 'page' : undefined"
        class="relative flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors duration-200 group"
        :class="[
          isActive(item.path)
            ? 'text-primary-600'
            : 'text-gray-500 hover:text-gray-700'
        ]"
      >
        <!-- Icon Container -->
        <div class="relative">
          <!-- Explore Icon -->
          <svg
            v-if="item.icon === 'explore'"
            class="w-6 h-6 transition-transform duration-200 group-hover:scale-110"
            :class="isActive(item.path) ? 'text-primary-600' : 'text-gray-500'"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          <!-- Chat Icon -->
          <svg
            v-else-if="item.icon === 'chat'"
            class="w-6 h-6 transition-transform duration-200 group-hover:scale-110"
            :class="isActive(item.path) ? 'text-primary-600' : 'text-gray-500'"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>

          <!-- Notifications Icon -->
          <svg
            v-else-if="item.icon === 'notifications'"
            class="w-6 h-6 transition-transform duration-200 group-hover:scale-110"
            :class="isActive(item.path) ? 'text-primary-600' : 'text-gray-500'"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>

          <!-- Profile Icon -->
          <svg
            v-else-if="item.icon === 'profile'"
            class="w-6 h-6 transition-transform duration-200 group-hover:scale-110"
            :class="isActive(item.path) ? 'text-primary-600' : 'text-gray-500'"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>

          <!-- Badge for chat -->
          <span
            v-if="item.icon === 'chat' && chatBadge"
            class="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full"
            :aria-label="`${chatBadge} unread messages`"
          >
            {{ chatBadge > 99 ? '99+' : chatBadge }}
          </span>

          <!-- Badge for notifications -->
          <span
            v-if="item.icon === 'notifications' && notificationBadge"
            class="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full"
            :aria-label="`${notificationBadge} new notifications`"
          >
            {{ notificationBadge > 99 ? '99+' : notificationBadge }}
          </span>

          <!-- Active venues badge for Explore tab -->
          <span
            v-if="item.icon === 'explore' && activeVenuesBadge"
            class="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-primary-500 rounded-full"
            :aria-label="`${activeVenuesBadge} active venues`"
          >
            {{ activeVenuesBadge > 99 ? '99+' : activeVenuesBadge }}
          </span>
        </div>

        <!-- Label -->
        <span
          class="mt-1 text-xs font-medium transition-colors duration-200"
          :class="isActive(item.path) ? 'text-primary-600' : 'text-gray-500'"
        >
          {{ item.name }}
        </span>

        <!-- Active indicator dot -->
        <span
          v-if="isActive(item.path)"
          class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-600 rounded-full"
          aria-hidden="true"
        />
      </NuxtLink>
    </div>
  </nav>
</template>

<style scoped>
/* Safe area padding for devices with notches/home indicators */
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* Ensure the navigation has proper backdrop blur on scroll */
nav {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.95);
}

/* Focus styles for accessibility */
nav a:focus-visible {
  outline: 2px solid theme('colors.primary.500');
  outline-offset: -2px;
  border-radius: 0.5rem;
}
</style>
