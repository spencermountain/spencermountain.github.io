import { defineNuxtConfig } from 'nuxt/config'
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: {
    enabled: false
  },
  css: ['~/assets/main.css'],
  vite: { plugins: [tailwindcss()] },
  pages: { pattern: '**/index.vue' }, // only index.vue files become routes
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'author', content: 'Spencer Kelly' },
        { name: 'description', content: 'Spencer Kelly' },
        { name: 'keywords', content: 'spencer kelly, toronto, javascript' },
        { rel: 'manifest', href: '/manifest.json' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#0f172a' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
      ],
      link: [{ rel: 'icon', href: '/favicon.ico' }]
    }
  }
})
