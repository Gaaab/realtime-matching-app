<script setup lang="ts">
import type { ProfilePreview } from '~/types/profile'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const route = useRoute()
const router = useRouter()
const { fetchUserProfile, revealProfile } = useProfile()

// State
const profile = ref<ProfilePreview | null>(null)
const isLoading = ref(false)
const isRevealing = ref(false)
const error = ref<string | null>(null)

// Computed properties
const userId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? parseInt(id, 10) : null
})

const isRevealed = computed(() => profile.value?.access_context.is_revealed ?? false)

const avatarClass = computed(() => {
  return isRevealed.value ? '' : 'blur-avatar'
})

const visibleAttributes = computed(() => {
  return profile.value?.attributes.filter(attr => attr.is_visible_on_profile) || []
})

const similaritiesCount = computed(() => {
  // This would ideally be calculated based on shared attributes/interests
  // For now, we'll use a placeholder count
  const sharedAttributes = visibleAttributes.value.length > 0 ? Math.floor(Math.random() * 5) + 1 : 0
  const sharedInterests = profile.value?.interests.length || 0
  return Math.min(sharedAttributes + Math.floor(sharedInterests / 2), 10)
})

const locationDisplay = computed(() => {
  const city = profile.value?.location_city
  const state = profile.value?.location_state
  if (city && state) return `${city}, ${state}`
  if (city) return city
  if (state) return state
  return null
})

const ctaButtonText = computed(() => {
  return isRevealed.value ? 'Send Message' : 'Reveal My Profile'
})

// Methods
const loadProfile = async () => {
  if (!userId.value) {
    error.value = 'Invalid user ID'
    return
  }

  try {
    isLoading.value = true
    error.value = null
    profile.value = await fetchUserProfile(userId.value)
  } catch (err: any) {
    error.value = err.message || 'Failed to load profile'
    console.error('Profile load error:', err)
  } finally {
    isLoading.value = false
  }
}

const handleRevealProfile = async () => {
  if (!userId.value || isRevealed.value) return

  try {
    isRevealing.value = true
    await revealProfile(userId.value)
    // Reload profile to get updated data
    await loadProfile()
  } catch (err: any) {
    error.value = err.message || 'Failed to reveal profile'
    console.error('Reveal profile error:', err)
  } finally {
    isRevealing.value = false
  }
}

const handleSendMessage = () => {
  if (!userId.value) return
  router.push('/chat')
}

const handleCTA = () => {
  if (isRevealed.value) {
    handleSendMessage()
  } else {
    handleRevealProfile()
  }
}

const goBack = () => {
  router.back()
}

// Load profile on mount
onMounted(() => {
  loadProfile()
})
</script>

<template>
  <div class="profile-preview-page">
    <!-- Header -->
    <div class="header">
      <button class="back-button" @click="goBack" aria-label="Go back">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="header-title">{{ profile?.first_name || 'Profile' }}</h1>
      <button class="menu-button" aria-label="More options">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading profile...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="loadProfile" class="retry-button">Retry</button>
    </div>

    <!-- Profile Content -->
    <div v-else-if="profile" class="profile-content">
      <!-- Avatar Section -->
      <div class="avatar-section">
        <div class="avatar-container">
          <img
            v-if="profile.avatar_url"
            :src="profile.avatar_url"
            :alt="`${profile.full_name}'s avatar`"
            :class="['avatar', avatarClass]"
          />
          <div v-else :class="['avatar-placeholder', avatarClass]">
            {{ profile.first_name[0] }}{{ profile.last_name[0] }}
          </div>
          <div v-if="profile.is_premium" class="premium-badge">Premium</div>
        </div>

        <h2 class="profile-name">{{ profile.full_name }}</h2>

        <div v-if="similaritiesCount > 0" class="similarities-badge">
          {{ similaritiesCount }} Similarities
        </div>
      </div>

      <!-- About Me Section -->
      <section v-if="profile.description" class="profile-section">
        <h3 class="section-title">About me</h3>
        <p class="description">{{ profile.description }}</p>
      </section>

      <!-- Basic Info -->
      <div class="basic-info">
        <div class="info-item">
          <svg class="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{{ profile.age }} years old</span>
        </div>

        <div class="info-item">
          <svg class="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>{{ profile.gender }}</span>
        </div>

        <div v-if="locationDisplay" class="info-item">
          <svg class="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{{ locationDisplay }}</span>
        </div>

        <div v-if="profile.ethnicity" class="info-item">
          <svg class="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span>{{ profile.ethnicity }}</span>
        </div>
      </div>

      <!-- My Lifestyle Section -->
      <section v-if="visibleAttributes.length > 0" class="profile-section">
        <h3 class="section-title">My Lifestyle</h3>
        <div class="chips-container">
          <div
            v-for="attribute in visibleAttributes"
            :key="attribute.id"
            class="chip"
          >
            <span class="chip-icon">{{ getAttributeIcon(attribute.attribute_key.key) }}</span>
            <span class="chip-label">{{ attribute.attribute_key.label }}</span>
          </div>
        </div>
      </section>

      <!-- My Vibe Section -->
      <section v-if="profile.interests.length > 0" class="profile-section">
        <h3 class="section-title">My Vibe</h3>
        <div class="chips-container">
          <div
            v-for="interest in profile.interests"
            :key="interest.id"
            class="chip"
          >
            <span class="chip-icon">{{ getInterestIcon(interest.interest.category) }}</span>
            <span class="chip-label">{{ interest.interest.name }}</span>
          </div>
        </div>
      </section>

      <!-- CTA Button -->
      <div class="cta-container">
        <button
          @click="handleCTA"
          :disabled="isRevealing"
          :class="['cta-button', { 'revealed': isRevealed }]"
        >
          {{ isRevealing ? 'Revealing...' : ctaButtonText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// Helper functions for icons
function getAttributeIcon(key: string): string {
  const iconMap: Record<string, string> = {
    smoking: '🚬',
    drinking: '🍷',
    religion: '🙏',
    exercise: '💪',
    education: '🎓',
    occupation: '💼',
    height: '📏',
    body_type: '🏃',
    children: '👶',
    relationship_status: '💑'
  }
  return iconMap[key] || '✨'
}

function getInterestIcon(category: string | null): string {
  const iconMap: Record<string, string> = {
    sports: '⚽',
    music: '🎵',
    travel: '✈️',
    food: '🍽️',
    arts: '🎨',
    outdoors: '🏔️',
    entertainment: '🎬',
    reading: '📚',
    fitness: '💪',
    gaming: '🎮'
  }
  return iconMap[category || ''] || '⭐'
}
</script>

<style scoped>
.profile-preview-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 100px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: white;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-button,
.menu-button {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-button:hover,
.menu-button:hover {
  background-color: #f0f0f0;
  border-radius: 50%;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state p {
  color: #ef4444;
  margin-bottom: 16px;
}

.retry-button {
  padding: 10px 24px;
  background-color: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}

.retry-button:hover {
  background-color: #5558e3;
}

.profile-content {
  padding: 0 0 24px 0;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  background-color: white;
  border-bottom: 1px solid #e0e0e0;
}

.avatar-container {
  position: relative;
  margin-bottom: 16px;
}

.avatar,
.avatar-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #e0e0e0;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #6366f1;
  color: white;
  font-size: 36px;
  font-weight: 600;
}

.blur-avatar {
  filter: blur(20px);
}

.premium-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #333;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.profile-name {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0 0 12px 0;
  text-align: center;
}

.similarities-badge {
  background-color: #6366f1;
  color: white;
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
}

.basic-info {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 20px 16px;
  background-color: white;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
  min-width: fit-content;
}

.info-icon {
  stroke-width: 2;
  color: #6366f1;
}

.profile-section {
  background-color: white;
  padding: 24px 16px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.description {
  font-size: 15px;
  line-height: 1.6;
  color: #555;
  margin: 0;
}

.chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  font-size: 14px;
  color: #333;
}

.chip-icon {
  font-size: 16px;
}

.chip-label {
  font-weight: 500;
}

.cta-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: linear-gradient(to top, white 80%, transparent);
  z-index: 5;
}

.cta-button {
  width: 100%;
  padding: 16px;
  background-color: #6366f1;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.cta-button:hover:not(:disabled) {
  background-color: #5558e3;
}

.cta-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cta-button.revealed {
  background-color: #10b981;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.cta-button.revealed:hover:not(:disabled) {
  background-color: #059669;
}
</style>
