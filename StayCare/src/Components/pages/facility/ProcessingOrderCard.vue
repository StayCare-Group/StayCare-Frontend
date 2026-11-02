<template>
  <div class="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div class="flex items-start justify-between gap-2 mb-1">
      <div class="min-w-0 flex-1">
        <p class="text-xs font-semibold text-gray-700 truncate" :title="order.client">{{ order.client || '—' }}</p>
        <span class="text-xs font-bold text-gray-800">{{ order.id }}</span>
      </div>
      <div class="flex flex-col items-end gap-1 shrink-0">
        <span class="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{{ order.serviceType }}</span>
        <OrderNotesBadge :notes="order.specialNotes" />
      </div>
    </div>
    <div class="mt-2 text-xs text-gray-400">
      <span v-for="item in (order.items || []).slice(0, 3)" :key="item.code || item.name" class="mr-1">
        {{ item.code }}&times;{{ item.qty }}
      </span>
      <span v-if="(order.items || []).length > 3" class="text-gray-300">+{{ order.items.length - 3 }} more</span>
    </div>

    <!-- Machine assignment (for Washing, Drying, Ironing columns) -->
    <div v-if="col.assignable && (assignedMachine || canManageMachine)" class="mt-2 min-w-0">
      <div v-if="assignedMachine" class="flex items-center justify-between bg-green-50 rounded px-2 py-1 min-w-0">
        <span class="text-xs text-green-700 font-medium truncate mr-1">{{ assignedMachine.name }}</span>
        <button
          v-if="canManageMachine"
          @click="onRelease"
          class="text-xs text-red-500 hover:text-red-700 shrink-0 font-medium"
        >
          {{ $t('facilityProcessing.release') }}
        </button>
      </div>
      <div v-else-if="canManageMachine" class="flex items-center gap-1.5 min-w-0 w-full">
        <select
          :value="machineSelection"
          @change="$emit('update:machineSelection', $event.target.value)"
          class="flex-1 min-w-0 border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-brand-400 outline-none bg-white truncate"
        >
          <option value="">{{ $t('facilityProcessing.assignMachine') }}</option>
          <option
            v-for="m in availableMachines"
            :key="getMachineId(m)"
            :value="getMachineId(m)"
          >
            {{ m.name }} ({{ Number(m.capacity) || m.capacity }}kg)
          </option>
        </select>
        <AppButton
          v-if="machineSelection"
          size="sm"
          :disabled="isAssigning"
          class="shrink-0 px-2 text-xs"
          @click="$emit('assign', machineSelection)"
        >
          {{ isAssigning ? $t('facilityProcessing.assigning') : $t('facilityProcessing.go') }}
        </AppButton>
      </div>
    </div>

    <!-- Operator assignment (only for Ironing column) -->
    <div v-if="col.status === 'ironing' && (assignedOperators.length > 0 || canManageMachine)" class="mt-1.5 min-w-0">
      <div
        v-if="assignedOperators.length > 0 && !showOperatorPicker"
        class="flex items-center justify-between bg-indigo-50 rounded px-2 py-1 min-w-0"
      >
        <span
          class="text-xs text-indigo-700 font-medium truncate mr-1"
          :title="assignedOperators.join(', ')"
        >
          {{ assignedOperators.join(', ') }}
        </span>
        <button
          v-if="canManageMachine"
          type="button"
          @click="openOperatorPicker"
          class="text-xs text-indigo-600 hover:text-indigo-800 shrink-0 font-medium"
        >
          {{ $t('facilityProcessing.editOperators') }}
        </button>
      </div>
      <div v-else-if="canManageMachine" class="min-w-0 w-full">
        <div class="flex items-center gap-1.5 min-w-0 w-full">
          <button
            type="button"
            @click="toggleOperatorPicker"
            class="flex-1 min-w-0 border border-gray-200 rounded px-2 py-1 text-xs text-left bg-white hover:bg-gray-50 truncate flex items-center justify-between"
          >
            <span class="truncate" :class="localOperators.length ? 'text-gray-700' : 'text-gray-500'">
              {{
                localOperators.length
                  ? $t('facilityProcessing.operatorsCount', { count: localOperators.length })
                  : $t('facilityProcessing.assignOperators')
              }}
            </span>
            <span class="text-gray-400 ml-1 shrink-0">▾</span>
          </button>
          <AppButton
            v-if="showOperatorPicker || localOperators.length > 0"
            size="sm"
            :disabled="isAssigningOperators"
            class="shrink-0 px-2 text-xs"
            @click="onSaveOperators"
          >
            {{ isAssigningOperators ? $t('facilityProcessing.assigning') : $t('facilityProcessing.go') }}
          </AppButton>
        </div>
        <div
          v-if="showOperatorPicker"
          class="mt-1 border border-gray-200 rounded bg-white p-1.5 max-h-32 overflow-y-auto space-y-1 shadow-sm"
        >
          <label
            v-for="op in availableOperators"
            :key="op.id || op.name"
            class="flex items-center gap-2 px-1 py-0.5 text-xs text-gray-700 hover:bg-gray-50 rounded cursor-pointer"
          >
            <input
              type="checkbox"
              :value="op.name"
              v-model="localOperators"
              class="accent-brand-600 w-3.5 h-3.5 rounded shrink-0"
            />
            <span class="truncate">{{ op.name }}</span>
          </label>
          <p v-if="availableOperators.length === 0" class="text-xs text-gray-400 px-1 py-0.5">
            {{ $t('facilityProcessing.noOperatorsAvailable') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Actions (Advance + Rollback) -->
    <div v-if="(canAdvance && col.nextStatus) || (isAdminOrStaff && hasRollbackOptions)" class="mt-2 flex items-stretch gap-1.5">
      <!-- Advance button -->
      <AppButton
        v-if="canAdvance && col.nextStatus"
        size="sm"
        :disabled="isAdvancing"
        class="flex-1 min-w-0"
        @click="$emit('advance')"
      >
        {{ isAdvancing ? $t('facilityProcessing.moving') : $t('facilityProcessing.moveTo', { status: nextStatusLabel }) }}
      </AppButton>

      <!-- Rollback button: secondary variant next to advance -->
      <AppButton
        v-if="isAdminOrStaff && hasRollbackOptions"
        variant="secondary"
        size="sm"
        :disabled="isRollingBack"
        :loading="isRollingBack"
        :title="$t('facilityProcessing.rollbackTitle')"
        :class="canAdvance && col.nextStatus ? 'shrink-0 px-2.5' : 'w-full'"
        @click="$emit('rollback')"
      >
        <span class="text-sm font-bold leading-none">↩</span>
      </AppButton>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from '../../ui/AppButton.vue'
import OrderNotesBadge from '../../ui/OrderNotesBadge.vue'

const { t } = useI18n()

const props = defineProps({
  order: {
    type: Object,
    required: true,
  },
  col: {
    type: Object,
    required: true,
  },
  assignedMachine: {
    type: Object,
    default: null,
  },
  availableMachines: {
    type: Array,
    default: () => [],
  },
  assignedOperators: {
    type: Array,
    default: () => [],
  },
  availableOperators: {
    type: Array,
    default: () => [],
  },
  machineSelection: {
    type: String,
    default: '',
  },
  isAssigning: {
    type: Boolean,
    default: false,
  },
  isAssigningOperators: {
    type: Boolean,
    default: false,
  },
  isAdvancing: {
    type: Boolean,
    default: false,
  },
  isRollingBack: {
    type: Boolean,
    default: false,
  },
  isAdminOrStaff: {
    type: Boolean,
    default: false,
  },
  canAdvance: {
    type: Boolean,
    default: true,
  },
  canManageMachine: {
    type: Boolean,
    default: true,
  },
  hasRollbackOptions: {
    type: Boolean,
    default: false,
  },
  nextStatusLabel: {
    type: String,
    default: '',
  },
})

const emit = defineEmits([
  'update:machineSelection',
  'assign',
  'assign-operators',
  'release',
  'advance',
  'rollback',
])

const showOperatorPicker = ref(false)
const localOperators = ref([...(props.assignedOperators ?? [])])

watch(
  () => props.assignedOperators,
  (val) => {
    localOperators.value = [...(val ?? [])]
  }
)

function openOperatorPicker() {
  localOperators.value = [...(props.assignedOperators ?? [])]
  showOperatorPicker.value = true
}

function toggleOperatorPicker() {
  showOperatorPicker.value = !showOperatorPicker.value
}

function onSaveOperators() {
  showOperatorPicker.value = false
  emit('assign-operators', [...localOperators.value])
}

function getMachineId(machine) {
  return machine?._id ?? machine?.id ?? ''
}

function onRelease() {
  const machineId = getMachineId(props.assignedMachine)
  emit('release', machineId)
}
</script>
