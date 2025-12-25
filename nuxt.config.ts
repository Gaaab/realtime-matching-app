// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],

  components: [
    // UI components keep their prefix (UiButton, UiCard, etc.)
    {
      path: '~/components/ui',
      prefix: 'Ui'
    },
    // All other components without directory prefix
    // (chat, venue, and root components use their filename as-is)
    {
      path: '~/components',
      pathPrefix: false
    }
  ],

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1',
      ably: {
        key: process.env.NUXT_PUBLIC_ABLY_KEY || process.env.ABLY_KEY
      },
      googleMapsApiKey: process.env.NUXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.PLACES_API_KEY
    }
  },

  app: {
    head: {
      title: 'Intro.u',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Modern dating and matching application' }
      ]
    }
  }
})
