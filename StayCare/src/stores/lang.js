import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * Manages the app language (English / Spanish).
 * Persists choice in localStorage.
 */
export const useLangStore = defineStore('lang', () => {
  const locale = ref(localStorage.getItem('staycare-lang') || 'en')

  const isSpanish = computed(() => locale.value === 'es')

  function setLocale(lang) {
    locale.value = lang
    localStorage.setItem('staycare-lang', lang)
  }

  function toggle() {
    setLocale(locale.value === 'en' ? 'es' : 'en')
  }

  /**
   * Lookup helper — pass an object like { en: 'Orders', es: 'Pedidos' }
   * and get back the string for the current locale.
   */
  function t(translations) {
    return translations[locale.value] || translations.en || ''
  }

  return { locale, isSpanish, setLocale, toggle, t }
})
