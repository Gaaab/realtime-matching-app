<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const features = [
  {
    icon: 'verified',
    title: 'Verified Profiles',
    description: 'All users are verified to ensure authenticity and safety'
  },
  {
    icon: 'match',
    title: 'Smart Matching',
    description: 'Our AI algorithm finds your most compatible matches'
  },
  {
    icon: 'chat',
    title: 'Real-time Chat',
    description: 'Connect instantly with your matches via messaging'
  },
  {
    icon: 'venue',
    title: 'Venue Check-ins',
    description: 'Meet in person at verified safe venues'
  }
]

const testimonials = [
  {
    name: 'Emma & James',
    image: 'https://i.pravatar.cc/150?img=47',
    story: 'We met on IntroMatch 6 months ago and got engaged last week! Thank you for bringing us together.',
    rating: 5
  },
  {
    name: 'Sarah & Michael',
    image: 'https://i.pravatar.cc/150?img=32',
    story: 'The matching algorithm is incredible. We had so much in common from day one!',
    rating: 5
  },
  {
    name: 'Lisa & David',
    image: 'https://i.pravatar.cc/150?img=23',
    story: 'Best dating app experience ever. The venue check-in feature made meeting up so easy and safe.',
    rating: 5
  }
]
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-gradient-to-br from-primary-50 via-pink-50 to-purple-50 py-20 lg:py-32">
      <div class="container mx-auto px-4">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <!-- Hero Content -->
          <div class="text-center lg:text-left">
            <h1 class="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Find Your
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-pink-600">
                Perfect Match
              </span>
            </h1>
            <p class="text-xl text-gray-600 mb-8">
              Join thousands of singles finding meaningful connections. Start your journey to love today.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <NuxtLink to="/register">
                <UiButton size="lg" class="w-full sm:w-auto">
                  Get Started Free
                </UiButton>
              </NuxtLink>
              <NuxtLink to="/login">
                <UiButton variant="outline" size="lg" class="w-full sm:w-auto">
                  Sign In
                </UiButton>
              </NuxtLink>
            </div>
            <p class="text-sm text-gray-500 mt-4">
              No credit card required. Free to join and browse.
            </p>
          </div>

          <!-- Hero Image/Illustration -->
          <div class="relative">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-4">
                <img
                  src="https://i.pravatar.cc/300?img=47"
                  alt="Profile 1"
                  class="w-full rounded-2xl shadow-xl transform hover:scale-105 transition-transform duration-300"
                />
                <img
                  src="https://i.pravatar.cc/300?img=32"
                  alt="Profile 2"
                  class="w-full rounded-2xl shadow-xl transform hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div class="space-y-4 mt-8">
                <img
                  src="https://i.pravatar.cc/300?img=12"
                  alt="Profile 3"
                  class="w-full rounded-2xl shadow-xl transform hover:scale-105 transition-transform duration-300"
                />
                <img
                  src="https://i.pravatar.cc/300?img=23"
                  alt="Profile 4"
                  class="w-full rounded-2xl shadow-xl transform hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Decorative Elements -->
      <div class="absolute top-0 right-0 -z-10 opacity-10">
        <svg class="w-96 h-96 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-20 bg-white">
      <div class="container mx-auto px-4">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold text-gray-900 mb-4">
            Why Choose IntroMatch?
          </h2>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            We make online dating safe, easy, and fun with powerful features designed for your success.
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <UiCard
            v-for="feature in features"
            :key="feature.title"
            variant="elevated"
            hoverable
            class="text-center"
          >
            <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path v-if="feature.icon === 'verified'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path v-else-if="feature.icon === 'match'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                <path v-else-if="feature.icon === 'chat'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                <path v-else-if="feature.icon === 'venue'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">
              {{ feature.title }}
            </h3>
            <p class="text-gray-600">
              {{ feature.description }}
            </p>
          </UiCard>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section class="py-20 bg-gray-50">
      <div class="container mx-auto px-4">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold text-gray-900 mb-4">
            Success Stories
          </h2>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            Join thousands of happy couples who found love on IntroMatch.
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <UiCard
            v-for="testimonial in testimonials"
            :key="testimonial.name"
            variant="elevated"
            hoverable
          >
            <div class="flex items-center mb-4">
              <UiAvatar
                :src="testimonial.image"
                :name="testimonial.name"
                size="lg"
              />
              <div class="ml-4">
                <h4 class="font-semibold text-gray-900">{{ testimonial.name }}</h4>
                <div class="flex text-yellow-400">
                  <svg v-for="i in testimonial.rating" :key="i" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>
            </div>
            <p class="text-gray-600 italic">
              "{{ testimonial.story }}"
            </p>
          </UiCard>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-20 bg-gradient-to-br from-primary-600 to-pink-600">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-4xl font-bold text-white mb-6">
          Ready to Find Your Match?
        </h2>
        <p class="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
          Join IntroMatch today and start your journey to finding meaningful connections.
        </p>
        <NuxtLink to="/register">
          <UiButton variant="secondary" size="lg">
            Create Free Account
          </UiButton>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
