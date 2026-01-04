<script setup lang="ts">
import type { VenueUser } from '~/types/venue'

interface Props {
  user: VenueUser
  venueId: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  reveal: [userId: number]
  viewProfile: [userId: number]
}>()

// Track expanded state for showing all attributes/interests
const isExpanded = ref(false)

// Number of items to show before "+ X more" button
const VISIBLE_ITEMS_COUNT = 5

// Compute visible and hidden counts
const visibleAttributes = computed(() => {
  if (isExpanded.value) {
    return props.user.lifestyle_attributes
  }
  return props.user.lifestyle_attributes.slice(0, VISIBLE_ITEMS_COUNT)
})

const visibleInterests = computed(() => {
  if (isExpanded.value) {
    return props.user.interests
  }
  const remainingSlots = VISIBLE_ITEMS_COUNT - visibleAttributes.value.length
  return props.user.interests.slice(0, Math.max(0, remainingSlots))
})

const hiddenCount = computed(() => {
  if (isExpanded.value) return 0

  const totalItems = props.user.lifestyle_attributes.length + props.user.interests.length
  const visibleCount = visibleAttributes.value.length + visibleInterests.value.length
  return Math.max(0, totalItems - visibleCount)
})

// Gender icon
const genderIcon = computed(() => {
  const gender = props.user.gender?.toLowerCase()
  if (gender === 'male' || gender === 'man') {
    return 'M♂'
  }
  if (gender === 'female' || gender === 'woman') {
    return 'F♀'
  }
  return gender
})

// Handle reveal button click
const handleReveal = () => {
  emit('reveal', props.user.id)
}

// Toggle expansion
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

// Handle view profile action
const handleViewProfile = () => {
  emit('viewProfile', props.user.id)
}

// Get icon for lifestyle attribute
const getAttributeIcon = (key: string) => {
  const iconMap: Record<string, string> = {
    smoking: '🚭',
    drinking: '🍷',
    religion: '🙏',
    exercise: '💪',
    diet: '🥗',
    pets: '🐾',
    kids: '👶',
  }

  const normalizedKey = key.toLowerCase()
  for (const [k, icon] of Object.entries(iconMap)) {
    if (normalizedKey.includes(k)) {
      return icon
    }
  }
  return '✨'
}

// Get icon for interest category
const getInterestIcon = (interest: string, category?: string | null) => {
  const interestLower = interest.toLowerCase()

  // Activity-based icons
  if (interestLower.includes('camp')) return '⛺'
  if (interestLower.includes('backpack')) return '🎒'
  if (interestLower.includes('travel') || interestLower.includes('trip')) return '✈️'
  if (interestLower.includes('photo')) return '📸'
  if (interestLower.includes('music')) return '🎵'
  if (interestLower.includes('cook')) return '🍳'
  if (interestLower.includes('read')) return '📚'
  if (interestLower.includes('game') || interestLower.includes('gaming')) return '🎮'
  if (interestLower.includes('sport')) return '⚽'
  if (interestLower.includes('art')) return '🎨'
  if (interestLower.includes('wine')) return '🍷'
  if (interestLower.includes('beer') || interestLower.includes('craft beer')) return '🍺'
  if (interestLower.includes('coffee')) return '☕'
  if (interestLower.includes('yoga')) return '🧘'
  if (interestLower.includes('run')) return '🏃'
  if (interestLower.includes('hik')) return '🥾'
  if (interestLower.includes('swim')) return '🏊'
  if (interestLower.includes('bike') || interestLower.includes('cycl')) return '🚴'
  if (interestLower.includes('dance')) return '💃'
  if (interestLower.includes('movie') || interestLower.includes('film')) return '🎬'

  return '🎯'
}
</script>

<template>
  <article
    class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-shadow hover:shadow-md"
  >
    <!-- Avatar and Similarities -->
    <div class="flex flex-col items-center mb-4">
      <!-- Avatar with optional blur - clickable to view profile -->
      <button
        type="button"
        @click="handleViewProfile"
        class="relative mb-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-full"
        :aria-label="`View ${user.first_name}'s profile`"
      >
        <div
          :class="[
            'w-24 h-24 rounded-full overflow-hidden ring-4 ring-white shadow-md transition-all group-hover:ring-primary-200 group-hover:shadow-lg',
            !user.is_revealed ? 'relative' : ''
          ]"
        >
          <img
            v-if="user.avatar_url"
            :src="user.avatar_url"
            :alt="`${user.first_name}'s avatar`"
            class="w-full h-full object-cover"
            :class="{ 'filter blur-2xl scale-110': !user.is_revealed }"
          />
          <div
            v-else
            class="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold"
          >
            {{ user.first_name.charAt(0).toUpperCase() }}
          </div>
        </div>

        <!-- Hover overlay indicator -->
        <div
          class="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center"
        >
          <svg
            class="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>

        <!-- Match indicator (if exists) -->
        <div
          v-if="user.has_match"
          class="absolute -top-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center"
          title="You matched!"
        >
          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </div>
      </button>

      <!-- Name - clickable link to profile -->
      <button
        type="button"
        @click="handleViewProfile"
        :class="[
          'text-sm font-medium mb-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded px-1',
          user.is_revealed
            ? 'text-primary-600 hover:text-primary-700 hover:underline cursor-pointer'
            : 'text-gray-600 filter blur-sm cursor-pointer'
        ]"
        :aria-label="`View ${user.first_name}'s profile`"
      >
        {{ user.first_name }}
      </button>

      <!-- Similarities Badge -->
      <div
        v-if="user.similarities_count > 0"
        class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border-2 border-primary-600 text-primary-600 bg-white"
      >
        <span class="text-sm font-bold">{{ user.similarities_count }}</span>
        <span class="text-sm font-medium">Similarit{{ user.similarities_count === 1 ? 'y' : 'ies' }}</span>
      </div>
    </div>

    <!-- Age and Gender -->
    <div class="flex items-center justify-center gap-4 mb-4">
      <!-- Age -->
      <div class="flex items-center gap-1.5 text-sm text-gray-700">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
        </svg>
        <span class="font-medium">{{ user.age }} years old</span>
      </div>

      <!-- Gender -->
      <div class="flex items-center gap-1.5 text-sm text-gray-700">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span class="font-medium">{{ user.gender }}</span>
      </div>
    </div>

    <!-- Lifestyle Attributes and Interests -->
    <div class="flex flex-wrap gap-2 mb-4 justify-center">
      <!-- Lifestyle Attributes -->
      <div
        v-for="attr in visibleAttributes"
        :key="`attr-${attr.key}`"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
      >
        <span>{{ getAttributeIcon(attr.key) }}</span>
        <span>{{ attr.label }}</span>
      </div>

      <!-- Interests -->
      <div
        v-for="interest in visibleInterests"
        :key="`interest-${interest.id}`"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-xs font-medium"
      >
        <span>{{ getInterestIcon(interest.name, interest.category) }}</span>
        <span>{{ interest.name }}</span>
      </div>

      <!-- "+ X more" button -->
      <button
        v-if="hiddenCount > 0"
        @click="toggleExpanded"
        class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            :d="isExpanded ? 'M5 15l7-7 7 7' : 'M12 4v16m8-8H4'"
          />
        </svg>
        <span>{{ isExpanded ? 'Show less' : `+ ${hiddenCount} more` }}</span>
      </button>
    </div>

    <!-- Action Buttons -->
    <div class="space-y-2">
      <!-- Reveal My Profile Button - shown when not revealed -->
      <button
        v-if="!user.is_revealed"
        type="button"
        @click="handleReveal"
        class="w-full py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        Reveal My Profile
      </button>

      <!-- View Full Profile Button - always visible, secondary style when not revealed -->
      <button
        type="button"
        @click="handleViewProfile"
        :class="[
          'w-full py-3 px-6 font-semibold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 inline-flex items-center justify-center gap-2',
          user.is_revealed
            ? 'bg-primary-600 hover:bg-primary-700 text-white'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        ]"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span>View Profile</span>
      </button>
    </div>
  </article>
</template>
