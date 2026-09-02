import { defineNuxtConfig } from 'nuxt/config'
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  css: ['~/assets/main.css'],
  vite: { plugins: [tailwindcss()] },
  // only index.vue files become routes - sibling .vue/.js files are plain imports
  pages: { pattern: '**/index.vue' },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'author', content: 'Spencer Kelly' },
        { name: 'description', content: 'Spencer Kelly' },
        { name: 'keywords', content: 'spencer kelly, toronto, javascript' }
      ],
      link: [{ rel: 'icon', href: '/favicon.ico' }]
    }
  }
})
