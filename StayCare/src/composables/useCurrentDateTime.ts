import { ref, computed, onUnmounted, type Ref } from 'vue'

export function useCurrentDateTime(locale: Ref<string>) {
  const currentNow = ref(new Date())
  const timer = setInterval(() => {
    currentNow.value = new Date()
  }, 15000)

  onUnmounted(() => {
    clearInterval(timer)
  })

  const currentDateTimeLabel = computed(() =>
    new Intl.DateTimeFormat(locale.value || 'en', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(currentNow.value)
  )

  return { currentDateTimeLabel }
}

