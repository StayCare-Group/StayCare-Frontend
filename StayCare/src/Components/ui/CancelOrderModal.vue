<template>
  <AppModal
    :show="show && Boolean(order)"
    :title="$t('admin.cancelConfirmTitle')"
    size="md"
    :loading="cancelling"
    @close="handleClose"
  >
    <p class="text-sm text-gray-600">
      {{ $t('admin.cancelConfirmMessage', { id: order?.id ?? order?._id }) }}
    </p>

    <template #footer>
      <AppButton
        variant="secondary"
        size="sm"
        :disabled="cancelling"
        @click="handleClose"
      >
        {{ $t('common.cancel') }}
      </AppButton>
      <AppButton
        variant="danger"
        size="sm"
        :loading="cancelling"
        @click="confirmCancel"
      >
        {{ $t('admin.cancelOrder') }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from './AppModal.vue'
import AppButton from './AppButton.vue'
import { deleteOrder } from '../../api/orders'
import { useUiStore } from '../../stores/ui.js'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'success'])

const { t } = useI18n()
const uiStore = useUiStore()
const cancelling = ref(false)

function handleClose() {
  if (cancelling.value) return
  emit('close')
}

async function confirmCancel() {
  if (!props.order || cancelling.value) return
  try {
    cancelling.value = true
    const orderId = props.order._id ?? props.order.id
    await deleteOrder(orderId)
    uiStore.showSuccess(t('admin.cancelSuccess'))
    emit('success', props.order)
    emit('close')
  } catch (err) {
    uiStore.showError(err?.message || t('admin.cancelError'))
  } finally {
    cancelling.value = false
  }
}
</script>
