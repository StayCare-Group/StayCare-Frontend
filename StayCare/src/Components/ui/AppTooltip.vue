<template>
  <div
    ref="triggerRef"
    class="inline-block relative"
    @mouseenter="showTooltip"
    @mouseleave="scheduleHide"
    @focusin="showTooltip"
    @focusout="scheduleHide"
    @click="toggleTooltip"
  >
    <slot />

    <Teleport to="body">
      <div
        v-if="visible && formattedText"
        ref="tooltipRef"
        :style="tooltipStyle"
        class="fixed z-50 p-2.5 bg-gray-900 text-white text-xs rounded-lg shadow-xl border border-gray-700 pointer-events-auto transition-opacity duration-150"
        @mouseenter="cancelHide"
        @mouseleave="scheduleHide"
        @click.stop
      >
        <div v-if="title" class="font-semibold text-brand-300 mb-1 border-b border-gray-700 pb-1">
          {{ title }}
        </div>
        <div class="whitespace-pre-wrap break-words max-h-44 overflow-y-auto leading-relaxed pr-1">
          {{ formattedText }}
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  text: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
  maxWidth: {
    type: String,
    default: '260px',
  },
  placement: {
    type: String,
    default: 'top', // 'top' | 'bottom' | 'auto'
  },
})

const { te, t } = useI18n()
const visible = ref(false)
const triggerRef = ref(null)
const tooltipRef = ref(null)
let hideTimer = null

const formattedText = computed(() => {
  if (!props.text) return ''
  return props.text
    .split('\n')
    .map((line) => {
      const match = line.match(/^\[([a-z_]+)\]:\s*(.*)$/i)
      if (match) {
        const rawStatus = match[1].toLowerCase()
        const message = match[2]
        const orderKey = `orderStatuses.${rawStatus}`
        const statusLabel = te(orderKey) ? t(orderKey) : rawStatus
        return `[${statusLabel}]: ${message}`
      }
      return line
    })
    .join('\n')
})

const tooltipStyle = reactive({
  top: '0px',
  left: '0px',
  maxWidth: props.maxWidth,
})

function updatePosition() {
  if (!triggerRef.value) return

  const rect = triggerRef.value.getBoundingClientRect()
  const padding = 6
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight

  let tooltipWidth = 240
  let tooltipHeight = 80

  if (tooltipRef.value) {
    tooltipWidth = tooltipRef.value.offsetWidth
    tooltipHeight = tooltipRef.value.offsetHeight
  }

  let top = rect.top - tooltipHeight - padding
  if (top < 10 || props.placement === 'bottom') {
    top = rect.bottom + padding
  }

  if (top + tooltipHeight > screenHeight - 10) {
    top = Math.max(10, screenHeight - tooltipHeight - 10)
  }

  let left = rect.left + rect.width / 2 - tooltipWidth / 2

  if (left < 10) {
    left = 10
  } else if (left + tooltipWidth > screenWidth - 10) {
    left = screenWidth - tooltipWidth - 10
  }

  tooltipStyle.top = `${Math.round(top)}px`
  tooltipStyle.left = `${Math.round(left)}px`
  tooltipStyle.maxWidth = props.maxWidth
}

function cancelHide() {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

function showTooltip() {
  if (!props.text) return
  cancelHide()
  visible.value = true
  nextTick(() => {
    updatePosition()
  })
}

function scheduleHide() {
  cancelHide()
  hideTimer = setTimeout(() => {
    visible.value = false
  }, 200)
}

function toggleTooltip(e) {
  e?.stopPropagation()
  cancelHide()
  if (visible.value) {
    visible.value = false
  } else {
    showTooltip()
  }
}

function handleOutsideClick(e) {
  if (
    visible.value &&
    triggerRef.value &&
    !triggerRef.value.contains(e.target) &&
    tooltipRef.value &&
    !tooltipRef.value.contains(e.target)
  ) {
    visible.value = false
  }
}

watch(visible, (isShown) => {
  if (isShown) {
    window.addEventListener('click', handleOutsideClick, true)
    window.addEventListener('touchstart', handleOutsideClick, true)
  } else {
    window.removeEventListener('click', handleOutsideClick, true)
    window.removeEventListener('touchstart', handleOutsideClick, true)
  }
})

onUnmounted(() => {
  cancelHide()
  visible.value = false
  window.removeEventListener('click', handleOutsideClick, true)
  window.removeEventListener('touchstart', handleOutsideClick, true)
})
</script>
