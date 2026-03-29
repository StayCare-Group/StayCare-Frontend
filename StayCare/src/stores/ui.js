import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const toasts = ref([])

  function pushToast({ type = 'error', message = '', timeout = 3000 } = {}) {
    if (!message) return
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    toasts.value.push({ id, type, message })

    if (timeout > 0) {
      setTimeout(() => dismissToast(id), timeout)
    }
  }

  function dismissToast(id) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  function showError(message, timeout = 3500) {
    pushToast({ type: 'error', message, timeout })
  }

  function showSuccess(message, timeout = 2500) {
    pushToast({ type: 'success', message, timeout })
  }

  return { toasts, pushToast, dismissToast, showError, showSuccess }
})
