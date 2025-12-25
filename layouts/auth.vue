<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-pink-50 to-purple-50">
    <!-- Simple Header -->
    <header class="absolute top-0 left-0 right-0 z-10 p-6">
      <NuxtLink to="/" class="flex items-center space-x-2">
        <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <span class="text-xl font-bold text-gray-900">IntroMatch</span>
      </NuxtLink>
    </header>

    <!-- Main Content -->
    <div class="flex items-center justify-center min-h-screen p-4">
      <div class="w-full max-w-md">
        <slot />
      </div>
    </div>

    <!-- Decorative Elements -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      <!-- Floating Hearts -->
      <div class="absolute top-20 left-10 text-primary-200 opacity-20">
        <svg class="w-16 h-16 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </div>
      <div class="absolute bottom-20 right-10 text-pink-200 opacity-20">
        <svg class="w-20 h-20 animate-pulse" style="animation-delay: 1s" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </div>
      <div class="absolute top-1/2 right-1/4 text-purple-200 opacity-10">
        <svg class="w-24 h-24 animate-pulse" style="animation-delay: 2s" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </div>
    </div>
  </div>
</template>
