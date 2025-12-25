<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const { user, logout } = useAuth()
const router = useRouter()

const handleLogout = async () => {
  try {
    await logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

// Profile completion percentage
const profileCompletion = computed(() => {
  if (!user.value) return 0
  let completed = 0
  const fields = ['first_name', 'profile_picture_url', 'bio', 'date_of_birth']
  fields.forEach(field => {
    if (user.value?.[field as keyof typeof user.value]) completed++
  })
  return Math.round((completed / fields.length) * 100)
})

// Profile menu items
const menuItems = [
  {
    label: 'Edit Profile',
    icon: 'edit',
    action: () => router.push('/profile/edit'),
    description: 'Update your photos and bio'
  },
  {
    label: 'Preferences',
    icon: 'sliders',
    action: () => router.push('/settings/preferences'),
    description: 'Matching preferences'
  },
  {
    label: 'Privacy & Safety',
    icon: 'shield',
    action: () => router.push('/settings/privacy'),
    description: 'Control who can see you'
  },
  {
    label: 'Notifications',
    icon: 'bell',
    action: () => router.push('/settings/notifications'),
    description: 'Manage alerts'
  },
  {
    label: 'Help & Support',
    icon: 'help',
    action: () => router.push('/support'),
    description: 'FAQs and contact us'
  }
]
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Profile Header -->
    <div class="bg-gradient-to-br from-primary-500 to-primary-700 pt-8 pb-24 px-4">
      <div class="max-w-lg mx-auto text-center">
        <!-- Avatar -->
        <div class="relative inline-block mb-4">
          <img
            v-if="user?.profile_picture_url"
            :src="user.profile_picture_url"
            :alt="user?.first_name || 'Profile'"
            class="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
          />
          <div
            v-else
            class="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center border-4 border-white shadow-lg"
          >
            <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <!-- Edit badge -->
          <button
            class="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
            @click="$router.push('/profile/edit')"
            aria-label="Edit profile picture"
          >
            <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>

        <!-- Name and Bio -->
        <h1 class="text-2xl font-bold text-white mb-1">
          {{ user?.first_name || 'User' }}
        </h1>
        <p v-if="user?.bio" class="text-white/80 text-sm">{{ user.bio }}</p>
        <p v-else class="text-white/60 text-sm italic">Add a bio to tell people about yourself</p>
      </div>
    </div>

    <!-- Profile Content Card -->
    <div class="max-w-lg mx-auto px-4 -mt-16 relative z-10 pb-24">
      <!-- Profile Completion Card -->
      <div class="bg-white rounded-2xl shadow-lg p-4 mb-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-700">Profile Completion</span>
          <span class="text-sm font-bold text-primary-600">{{ profileCompletion }}%</span>
        </div>
        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
            :style="{ width: `${profileCompletion}%` }"
          />
        </div>
        <p v-if="profileCompletion < 100" class="text-xs text-gray-500 mt-2">
          Complete your profile to get more matches
        </p>
      </div>

      <!-- Menu Items -->
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
        <button
          v-for="item in menuItems"
          :key="item.label"
          @click="item.action"
          class="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0"
        >
          <!-- Icon -->
          <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <!-- Edit icon -->
            <svg v-if="item.icon === 'edit'" class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <!-- Sliders icon -->
            <svg v-else-if="item.icon === 'sliders'" class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <!-- Shield icon -->
            <svg v-else-if="item.icon === 'shield'" class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <!-- Bell icon -->
            <svg v-else-if="item.icon === 'bell'" class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <!-- Help icon -->
            <svg v-else-if="item.icon === 'help'" class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <!-- Text -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900">{{ item.label }}</p>
            <p class="text-xs text-gray-500">{{ item.description }}</p>
          </div>

          <!-- Arrow -->
          <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Logout Button -->
      <button
        @click="handleLogout"
        class="w-full mt-4 py-3 px-4 bg-white rounded-2xl shadow-lg text-red-600 font-medium hover:bg-red-50 transition-colors"
      >
        Log Out
      </button>

      <!-- Version -->
      <p class="text-center text-xs text-gray-400 mt-6">
        IntroMatch v1.0.0
      </p>
    </div>
  </div>
</template>
