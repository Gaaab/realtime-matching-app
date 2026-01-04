<script setup lang="ts">
import type { Icebreaker } from '~/types/icebreaker'

/**
 * IcebreakersSection - Displays suggested conversation starters based on shared interests
 *
 * This component shows horizontally scrollable cards with icebreaker suggestions
 * that help users start conversations based on common interests with their match.
 *
 * Uses the Icebreaker type from the API spec which includes:
 * - id: Unique icebreaker ID
 * - category: Category name (e.g., "Outdoors", "Food & Drink")
 * - category_id: Category ID for grouping
 * - prompt_text: The icebreaker question/prompt
 * - usage_count: How many times used globally
 * - icon_url: URL to category icon (nullable)
 */

interface Props {
  icebreakers: Icebreaker[]
  isVisible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isVisible: true
})

const emit = defineEmits<{
  select: [icebreaker: Icebreaker]
}>()

// Handle icebreaker card click
const handleSelect = (icebreaker: Icebreaker) => {
  emit('select', icebreaker)
}

/**
 * Get icon path based on category_id
 * Maps category IDs to SVG paths for fallback icons when icon_url is not available
 *
 * Category IDs (from API spec):
 * 1 = Outdoors, 2 = Food & Drink, 3 = Entertainment,
 * 4 = Social & Lifestyle, 5 = Travel, 6 = Creative, 7 = General
 */
const getIconPathByCategoryId = (categoryId: number): string => {
  const icons: Record<number, string> = {
    // Outdoors - mountain/hiking icon
    1: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    // Food & Drink - fork/spoon icon
    2: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    // Entertainment - film/media icon
    3: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z',
    // Social & Lifestyle - users icon
    4: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
    // Travel - globe icon
    5: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418',
    // Creative - paintbrush icon
    6: 'M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42',
    // General - chat bubble icon (default)
    7: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z'
  }
  // Default to General category icon
  return icons[categoryId] || icons[7]
}

/**
 * Background color classes for cards based on category_id
 * Colors are semantically mapped to categories for consistency
 */
const getCardColorClasses = (categoryId: number): string => {
  const colorVariants: Record<number, string> = {
    1: 'bg-emerald-50 hover:bg-emerald-100', // Outdoors - green (nature)
    2: 'bg-amber-50 hover:bg-amber-100',     // Food & Drink - amber (warm/inviting)
    3: 'bg-violet-50 hover:bg-violet-100',   // Entertainment - violet (fun/playful)
    4: 'bg-rose-50 hover:bg-rose-100',       // Social & Lifestyle - rose (friendly)
    5: 'bg-sky-50 hover:bg-sky-100',         // Travel - sky blue (adventure)
    6: 'bg-orange-50 hover:bg-orange-100',   // Creative - orange (artistic)
    7: 'bg-slate-50 hover:bg-slate-100'      // General - slate (neutral)
  }
  return colorVariants[categoryId] || colorVariants[7]
}

/**
 * Icon/text color classes based on category_id
 * Matches card background colors for visual coherence
 */
const getIconColorClasses = (categoryId: number): string => {
  const colorVariants: Record<number, string> = {
    1: 'text-emerald-600', // Outdoors
    2: 'text-amber-600',   // Food & Drink
    3: 'text-violet-600',  // Entertainment
    4: 'text-rose-600',    // Social & Lifestyle
    5: 'text-sky-600',     // Travel
    6: 'text-orange-600',  // Creative
    7: 'text-slate-600'    // General
  }
  return colorVariants[categoryId] || colorVariants[7]
}

// Reference to the scroll container for accessibility
const scrollContainer = ref<HTMLElement | null>(null)

// Keyboard navigation for horizontal scrolling
const handleKeyDown = (event: KeyboardEvent) => {
  if (!scrollContainer.value) return

  const scrollAmount = 200

  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    scrollContainer.value.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    scrollContainer.value.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }
}
</script>

<template>
  <section
    v-if="isVisible && icebreakers.length > 0"
    class="border-t border-gray-100 bg-gray-50/50"
    aria-labelledby="icebreakers-heading"
  >
    <!-- Section Header -->
    <div class="px-4 pt-3 pb-2">
      <h3
        id="icebreakers-heading"
        class="text-xs font-semibold text-gray-500 uppercase tracking-wider"
      >
        Icebreakers based on shared interests
      </h3>
    </div>

    <!-- Horizontally Scrollable Cards -->
    <div
      ref="scrollContainer"
      class="flex gap-3 overflow-x-auto px-4 pb-3 scrollbar-hide snap-x snap-mandatory"
      role="list"
      aria-label="Icebreaker suggestions"
      tabindex="0"
      @keydown="handleKeyDown"
    >
      <button
        v-for="icebreaker in icebreakers"
        :key="icebreaker.id"
        :class="[
          'flex-shrink-0 w-64 p-3 rounded-xl border border-gray-200/60',
          'transition-all duration-200 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
          'active:scale-[0.98] snap-start',
          'text-left',
          getCardColorClasses(icebreaker.category_id)
        ]"
        role="listitem"
        :aria-label="`${icebreaker.category}: ${icebreaker.prompt_text}. Click to use this icebreaker`"
        @click="handleSelect(icebreaker)"
      >
        <!-- Icon and Category Header -->
        <div class="flex items-center gap-2 mb-2">
          <div
            :class="[
              'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center',
              'bg-white/80 shadow-sm'
            ]"
          >
            <!-- Use icon_url if available, otherwise fallback to SVG icon -->
            <img
              v-if="icebreaker.icon_url"
              :src="icebreaker.icon_url"
              :alt="`${icebreaker.category} icon`"
              class="w-4 h-4 object-contain"
            />
            <svg
              v-else
              :class="['w-4 h-4', getIconColorClasses(icebreaker.category_id)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                :d="getIconPathByCategoryId(icebreaker.category_id)"
              />
            </svg>
          </div>
          <span
            :class="[
              'text-xs font-bold uppercase tracking-wide',
              getIconColorClasses(icebreaker.category_id)
            ]"
          >
            {{ icebreaker.category }}
          </span>
        </div>

        <!-- Suggested Message (prompt_text from API) -->
        <p class="text-sm text-gray-700 leading-snug line-clamp-2">
          {{ icebreaker.prompt_text }}
        </p>
      </button>
    </div>
  </section>
</template>

<style scoped>
/* Hide scrollbar but keep functionality */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Ensure line clamping works */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
