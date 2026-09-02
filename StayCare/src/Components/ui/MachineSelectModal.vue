<template>
  <AppModal
    :show="show"
    :title="$t('machineSelectModal.title')"
    size="sm"
    :close-on-backdrop="false"
    :loading="submitting"
    @close="handleClose"
  >
    <!-- Stage context -->
    <p class="text-sm text-gray-500">
      {{ $t('machineSelectModal.description', { stage: stageLabel }) }}
    </p>

    <!-- Available machines list -->
    <div v-if="machines.length" class="divide-y divide-gray-100 mt-1">
      <label
        v-for="machine in machines"
        :key="machine.id"
        class="flex items-center gap-3 py-3 cursor-pointer hover:bg-gray-50 rounded-lg px-2 transition-colors"
      >
        <input
          type="radio"
          :value="machine.id"
          v-model="selectedMachineId"
          class="accent-brand-600 w-4 h-4 shrink-0"
        />
        <span class="flex-1 min-w-0">
          <span class="block text-sm font-medium text-gray-800">{{ machine.name }}</span>
          <span v-if="machine.capacity" class="block text-xs text-gray-400">
            {{ $t('facility.capacity') }}: {{ machine.capacity }}
          </span>
        </span>
        <span class="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium shrink-0">
          {{ $t('facilityProcessing.statusAvailable') }}
        </span>
      </label>
    </div>

    <!-- No machines available -->
    <p v-else class="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
      {{ $t('machineSelectModal.noMachines') }}
    </p>

    <!-- Skip hint -->
    <p class="text-xs text-gray-400">
      {{ $t('machineSelectModal.skipHint') }}
    </p>

    <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

    <template #footer>
      <AppButton
        variant="secondary"
        size="sm"
        :disabled="submitting"
        @click="handleClose"
      >
        {{ $t('common.cancel') }}
      </AppButton>

      <!-- Advance without machine -->
      <AppButton
        variant="secondary"
        size="sm"
        :disabled="submitting"
        @click="handleSkip"
      >
        {{ $t('machineSelectModal.skipAssign') }}
      </AppButton>

      <!-- Advance with machine -->
      <AppButton
        size="sm"
        :loading="submitting"
        :disabled="!selectedMachineId || submitting"
        @click="handleConfirm"
      >
        {{ $t('machineSelectModal.confirm') }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import AppModal from './AppModal.vue'
import AppButton from './AppButton.vue'

const props = defineProps({
  show:       { type: Boolean, default: false },
  /** Máquinas disponibles del tipo correcto, pre-filtradas por el padre */
  machines:   { type: Array, default: () => [] },
  /** Etiqueta legible del estado destino, p. ej. "Washing" */
  stageLabel: { type: String, default: '' },
})

const emit = defineEmits(['close', 'confirm', 'skip'])

const selectedMachineId = ref('')
const submitting        = ref(false)
const error             = ref('')

// Reset when modal opens
watch(() => props.show, (visible) => {
  if (!visible) return
  selectedMachineId.value = ''
  submitting.value        = false
  error.value             = ''
})

function handleClose() {
  if (submitting.value) return
  emit('close')
}

function handleSkip() {
  if (submitting.value) return
  emit('skip')
}

async function handleConfirm() {
  if (!selectedMachineId.value || submitting.value) return
  submitting.value = true
  error.value = ''
  try {
    emit('confirm', selectedMachineId.value)
  } finally {
    // The parent controls closing the modal after its own async work finishes.
    // We reset submitting here as a safety net in case the parent doesn't close.
    submitting.value = false
  }
}
</script>
