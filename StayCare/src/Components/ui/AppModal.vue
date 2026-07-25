<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto"
        @click="onBackdropClick"
      >
        <div
          class="bg-white rounded-xl shadow-xl w-full flex flex-col my-auto transition-all transform"
          :class="sizeClasses"
          @click.stop
        >
          <!-- Header -->
          <div
            v-if="title || $slots.header || showCloseButton"
            class="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 shrink-0"
          >
            <slot name="header">
              <h3 class="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {{ title }}
              </h3>
            </slot>

            <button
              v-if="showCloseButton"
              type="button"
              class="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40 shrink-0"
              :disabled="loading"
              :title="$t('common.cancel')"
              @click="handleClose"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body with internal scrolling -->
          <div class="px-6 py-5 overflow-y-auto max-h-[75vh] space-y-4">
            <slot />
          </div>

          <!-- Footer -->
          <div
            v-if="$slots.footer"
            class="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl flex flex-wrap justify-end gap-3 shrink-0"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'md', // 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true,
  },
  closeOnEscape: {
    type: Boolean,
    default: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  showCloseButton: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['close'])

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'max-w-sm'
    case 'lg':
      return 'max-w-lg'
    case 'xl':
      return 'max-w-2xl'
    case '2xl':
      return 'max-w-4xl'
    case 'md':
    default:
      return 'max-w-md'
  }
})

function handleClose() {
  if (props.loading) return
  emit('close')
}

function onBackdropClick() {
  if (props.closeOnBackdrop && !props.loading) {
    handleClose()
  }
}

function onKeydown(e) {
  if (e.key === 'Escape' && props.show && props.closeOnEscape && !props.loading) {
    handleClose()
  }
}

function syncBodyScroll(active) {
  if (typeof document !== 'undefined') {
    if (active) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
}

watch(() => props.show, (newVal) => {
  syncBodyScroll(newVal)
})

onMounted(() => {
  if (props.show) syncBodyScroll(true)
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onKeydown)
  }
})

onUnmounted(() => {
  syncBodyScroll(false)
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onKeydown)
  }
})
</script>
