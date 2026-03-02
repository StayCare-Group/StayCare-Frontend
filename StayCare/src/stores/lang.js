import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import i18n from '../i18n/index.js'
import { updateMe } from '../api/users'

export const useLangStore = defineStore('lang', () => {
  const locale = ref(localStorage.getItem('staycare-lang') || 'en')

  const isSpanish = computed(() => locale.value === 'es')

  function setLocale(lang, { persist = true } = {}) {
    locale.value = lang
    i18n.global.locale.value = lang
    localStorage.setItem('staycare-lang', lang)

    if (persist) {
      updateMe({ language: lang }).catch(() => {})
    }
  }

  function toggle() {
    setLocale(locale.value === 'en' ? 'es' : 'en')
  }

  return { locale, isSpanish, setLocale, toggle }
})
