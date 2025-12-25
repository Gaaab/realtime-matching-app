<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

// Mock notifications data
const notifications = ref([
  {
    id: 1,
    type: 'match',
    title: 'New Match!',
    message: 'You matched with Sarah at The Coffee House',
    time: '5 minutes ago',
    read: false,
    avatar: 'https://i.pravatar.cc/150?img=32'
  },
  {
    id: 2,
    type: 'message',
    title: 'New Message',
    message: 'Emma sent you a message',
    time: '1 hour ago',
    read: false,
    avatar: 'https://i.pravatar.cc/150?img=47'
  },
  {
    id: 3,
    type: 'venue',
    title: 'Popular Venue',
    message: 'The Rooftop Bar has 5 people checked in near you',
    time: '2 hours ago',
    read: true,
    avatar: null
  },
  {
    id: 4,
    type: 'system',
    title: 'Profile Complete',
    message: 'Your profile is now 100% complete. Start matching!',
    time: 'Yesterday',
    read: true,
    avatar: null
  }
])

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

const markAsRead = (id: number) => {
  const notification = notifications.value.find(n => n.id === id)
  if (notification) {
    notification.read = true
  }
}

const markAllAsRead = () => {
  notifications.value.forEach(n => n.read = true)
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'match':
      return 'heart'
    case 'message':
      return 'chat'
    case 'venue':
      return 'location'
    default:
      return 'bell'
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="sticky top-0 z-20 bg-white border-b border-gray-200">
      <div class="flex items-center justify-between px-4 py-4 max-w-2xl mx-auto">
        <h1 class="text-xl font-bold text-gray-900">Notifications</h1>
        <button
          v-if="unreadCount > 0"
          @click="markAllAsRead"
          class="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          Mark all as read
        </button>
      </div>
    </header>

    <!-- Notifications List -->
    <div class="max-w-2xl mx-auto">
      <div v-if="notifications.length === 0" class="flex flex-col items-center justify-center py-16 px-4">
        <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">No notifications yet</h3>
        <p class="text-sm text-gray-500 text-center">When you get matches, messages, or updates, they will appear here.</p>
      </div>

      <ul v-else class="divide-y divide-gray-200 bg-white">
        <li
          v-for="notification in notifications"
          :key="notification.id"
          @click="markAsRead(notification.id)"
          class="px-4 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
          :class="{ 'bg-primary-50/50': !notification.read }"
        >
          <div class="flex items-start gap-4">
            <!-- Avatar or Icon -->
            <div class="flex-shrink-0">
              <img
                v-if="notification.avatar"
                :src="notification.avatar"
                :alt="notification.title"
                class="w-12 h-12 rounded-full object-cover"
              />
              <div
                v-else
                class="w-12 h-12 rounded-full flex items-center justify-center"
                :class="{
                  'bg-red-100': notification.type === 'match',
                  'bg-blue-100': notification.type === 'message',
                  'bg-green-100': notification.type === 'venue',
                  'bg-gray-100': notification.type === 'system'
                }"
              >
                <!-- Heart icon for match -->
                <svg
                  v-if="notification.type === 'match'"
                  class="w-6 h-6 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <!-- Chat icon for message -->
                <svg
                  v-else-if="notification.type === 'message'"
                  class="w-6 h-6 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <!-- Location icon for venue -->
                <svg
                  v-else-if="notification.type === 'venue'"
                  class="w-6 h-6 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <!-- Bell icon for system -->
                <svg
                  v-else
                  class="w-6 h-6 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <p class="text-sm font-semibold text-gray-900">{{ notification.title }}</p>
                <!-- Unread indicator -->
                <span
                  v-if="!notification.read"
                  class="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0"
                  aria-label="Unread"
                />
              </div>
              <p class="text-sm text-gray-600 mt-0.5">{{ notification.message }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ notification.time }}</p>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
