<template>
  <div class="space-y-6">
    <h2 class="text-lg font-semibold text-brand-700">{{ $t('facility.processingBoard') }}</h2>

    <!-- Kanban Board -->
    <div class="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
      <div
        v-for="col in columns" :key="col.status"
        class="w-[260px] min-w-[260px] max-w-[260px] flex-shrink-0 bg-gray-50 rounded-xl p-3 flex flex-col"
      >
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xs font-semibold text-gray-600 uppercase tracking-wide">{{ col.label }}</h3>
          <span class="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full">{{ col.orders.length }}</span>
        </div>
        <div class="space-y-2">
          <ProcessingOrderCard
            v-for="order in col.orders"
            :key="getOrderId(order)"
            :order="order"
            :col="col"
            :assigned-machine="getAssignedMachine(getOrderId(order))"
            :available-machines="availableMachines(col.machineType)"
            v-model:machine-selection="machineSelections[getOrderId(order)]"
            :is-assigning="assigning === getOrderId(order)"
            :is-advancing="advancing === getOrderId(order)"
            :is-rolling-back="rollingBack === getOrderId(order)"
            :is-admin-or-staff="isAdminOrStaff"
            :has-rollback-options="getRollbackOptions(col.status).length > 0"
            :next-status-label="col.nextStatus ? nextLabel(col.nextStatus) : ''"
            @assign="machineId => handleAssign(machineId, getOrderId(order))"
            @release="machineId => handleRelease(machineId, getOrderId(order))"
            @advance="advanceOrder(getOrderId(order), col.nextStatus)"
            @rollback="openRollback(getOrderId(order), col.status)"
          />
          <div v-if="col.orders.length === 0" class="text-xs text-gray-300 text-center py-4">{{ $t('facilityProcessing.noOrders') }}</div>
        </div>
      </div>
    </div>

    <!-- Machine Status & Management -->
    <MachineManagement :machines="machines" @refresh="loadData" />
  </div>

  <!-- Quality-check modal: opened when advancing from quality_check → ready_to_delivery -->
  <QualityCheckModal
    :show="showQualityCheckModal"
    :order="qualityCheckOrder"
    @close="showQualityCheckModal = false"
    @success="onQualityCheckSuccess"
  />

  <!-- Machine-select modal: opened when advancing to washing / drying / ironing -->
  <MachineSelectModal
    :show="showMachineSelectModal"
    :machines="machineSelectStage ? availableMachines(machineSelectStage.machineType) : []"
    :stage-label="machineSelectStage?.stageLabel ?? ''"
    @close="onMachineSelectClose"
    @confirm="onMachineSelectConfirm"
    @skip="onMachineSelectSkip"
  />

  <!-- Rollback modal: opened when the user clicks the rollback button on an order card -->
  <AppModal
    :show="showRollbackModal"
    :title="$t('facilityProcessing.rollbackTitle')"
    size="sm"
    :close-on-backdrop="false"
    :loading="Boolean(rollingBack)"
    @close="closeRollbackModal"
  >
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-600 mb-1">
          {{ $t('facilityProcessing.rollbackSelectStage') }}
        </label>
        <select
          v-model="rollbackTarget.targetStatus"
          class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
        >
          <option
            v-for="stg in rollbackOptions"
            :key="stg.status"
            :value="stg.status"
          >
            {{ stg.label }}
          </option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-600 mb-1">
          {{ $t('facilityProcessing.rollbackNoteLabel') }}
        </label>
        <textarea
          v-model="rollbackNote"
          rows="2"
          class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none resize-none"
          :placeholder="$t('facilityProcessing.rollbackNotePlaceholder')"
        />
      </div>
    </div>
    <template #footer>
      <AppButton
        variant="secondary"
        size="sm"
        :disabled="Boolean(rollingBack)"
        @click="closeRollbackModal"
      >
        {{ $t('common.cancel') }}
      </AppButton>
      <AppButton
        variant="danger"
        size="sm"
        :loading="Boolean(rollingBack)"
        :disabled="!rollbackTarget.targetStatus"
        @click="doRollback"
      >
        {{ $t('facilityProcessing.rollbackConfirm') }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from '../../ui/AppButton.vue'
import AppModal from '../../ui/AppModal.vue'
import QualityCheckModal from '../../ui/QualityCheckModal.vue'
import MachineSelectModal from '../../ui/MachineSelectModal.vue'
import MachineManagement from '../../ui/MachineManagement.vue'
import ProcessingOrderCard from './ProcessingOrderCard.vue'
import { useAuthStore } from '../../../stores/auth.js'
import { useUiStore } from '../../../stores/ui.js'
import { fetchAllOrders, updateOrderStatus } from '../../../api/orders'
import { fetchMachineStatus, assignMachine, releaseMachine } from '../../../api/facility'
import { normalizeStatus } from '../../../utils/orderFlow'

const { t } = useI18n()
const authStore = useAuthStore()
const ui = useUiStore()
const isAdminOrStaff = computed(() => authStore.isAdminOrStaff)

const allOrders = ref([])
const machines = ref([])
const loading = ref(true)
const advancing = ref(null)
const assigning = ref(null)
const machineSelections = reactive({})

// Quality-check modal state
const showQualityCheckModal = ref(false)
const qualityCheckOrder = ref(null)

// Machine-select modal state
const showMachineSelectModal = ref(false)
const machineSelectStage     = ref(null)   // { orderId, nextStatus, stageLabel, machineType }
const machineSelectAdvancing = ref(false)

// ── Rollback state ─────────────────────────────────────────────────────────────
// Map of current stage → list of stages the order can be rolled back to.
// Only stages within the processing pipeline and strictly earlier are listed.
const ROLLBACK_MAP = {
  washing:       ['arrived'],
  drying:        ['washing', 'arrived'],
  ironing:       ['drying', 'washing', 'arrived'],
  quality_check: ['ironing', 'drying', 'washing', 'arrived'],
}

const showRollbackModal = ref(false)
const rollingBack       = ref(null)   // orderId currently being rolled back
const rollbackNote      = ref('')
const rollbackTarget    = reactive({ orderId: '', currentStatus: '', targetStatus: '' })

// Derived list of selectable rollback stages for the open modal
const rollbackOptions = computed(() => {
  const targets = ROLLBACK_MAP[rollbackTarget.currentStatus] ?? []
  return targets.map(st => ({ status: st, label: LABEL_MAP.value[st] ?? st }))
})

function getRollbackOptions(currentStatus) {
  return ROLLBACK_MAP[currentStatus] ?? []
}

function openRollback(orderId, currentStatus) {
  const opts = getRollbackOptions(currentStatus)
  if (!opts.length) return
  rollbackTarget.orderId        = orderId
  rollbackTarget.currentStatus  = currentStatus
  rollbackTarget.targetStatus   = opts[0] // default to first (nearest) option
  rollbackNote.value            = ''
  showRollbackModal.value       = true
}

function closeRollbackModal() {
  showRollbackModal.value      = false
  rollbackTarget.orderId       = ''
  rollbackTarget.currentStatus = ''
  rollbackTarget.targetStatus  = ''
  rollbackNote.value           = ''
}

async function doRollback() {
  const { orderId, targetStatus } = rollbackTarget
  if (!orderId || !targetStatus) return

  rollingBack.value = orderId
  try {
    await updateOrderStatus(orderId, targetStatus, {
      note: rollbackNote.value.trim() || undefined,
    })
    ui.showSuccess(t('facilityProcessing.rollbackSuccess'))
    closeRollbackModal()
    await loadData()
  } catch (err) {
    const msg = err?.message ?? t('facilityProcessing.unknownError')
    ui.showError(`${t('facilityProcessing.rollbackFailed')}: ${msg}`)
  } finally {
    rollingBack.value = null
  }
}
// ─────────────────────────────────────────────────────────────────────────────

const PIPELINE = computed(() => [
  { status: 'arrived',           label: t('facilityProcessing.received'),      nextStatus: 'washing',            assignable: false, machineType: null },
  { status: 'washing',           label: t('facility.washing'),                 nextStatus: 'drying',             assignable: true,  machineType: 'washer' },
  { status: 'drying',            label: t('facility.drying'),                  nextStatus: 'ironing',            assignable: true,  machineType: 'dryer' },
  { status: 'ironing',           label: t('facility.ironing'),                 nextStatus: 'quality_check',      assignable: true,  machineType: 'iron' },
  { status: 'quality_check',     label: t('facilityProcessing.qualityCheck'),  nextStatus: 'ready_to_delivery',  assignable: false, machineType: null },
  { status: 'ready_to_delivery', label: t('client.readyForDelivery'),          nextStatus: null,                 assignable: false, machineType: null },
])

const LABEL_MAP = computed(() => Object.fromEntries(PIPELINE.value.map(p => [p.status, p.label])))

function nextLabel(backendStatus) {
  return LABEL_MAP.value[backendStatus] ?? backendStatus
}

function getOrderId(order) {
  return order?._id ?? order?.id ?? ''
}

function getMachineId(machine) {
  return machine?._id ?? machine?.id ?? ''
}


async function loadData() {
  try {
    const processingStatuses = PIPELINE.value.map(p => p.status).join(',')
    const [ordersData, machinesData] = await Promise.all([
      fetchAllOrders({ status: processingStatuses }).catch(() => []),
      fetchMachineStatus().catch(() => []),
    ])

    allOrders.value = (ordersData ?? []).map(raw => ({
      id: raw.order_number ?? raw._id ?? raw.id,
      _id: raw._id ?? raw.id,
      client: raw.client?.name ?? raw.client ?? raw.client_name ?? '',
      status: normalizeStatus(raw.status),
      serviceType: raw.service_type === 'express' ? 'Express' : 'Standard',
      specialNotes: raw.specialNotes ?? raw.special_notes ?? '',
      items: (raw.items ?? []).map(i => ({
        itemId:     i.item_id ?? null,
        code:       i.item_code ?? i.item_code_snapshot ?? '',
        name:       i.name ?? i.name_snapshot ?? '',
        qty:        i.quantity ?? 0,
        qtyGood:    i.qty_good    ?? null,
        qtyBad:     i.qty_bad     ?? null,
        qtyStained: i.qty_stained ?? null,
      })),
    }))

    machines.value = (machinesData ?? []).map(raw => ({
      ...raw,
      _id: raw._id ?? raw.id,
      current_orders: raw.current_orders ?? [],
      current_order:
        raw.current_order ??
        (raw.current_order_id
          ? {
              _id: raw.current_order_id,
              order_number: raw.order_number ?? null,
              status: raw.order_status ?? null,
            }
          : null),
    }))
  } catch {
    allOrders.value = []
    machines.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

const columns = computed(() =>
  PIPELINE.value.map(col => ({
    ...col,
    orders: allOrders.value.filter(o => o.status === col.status),
  }))
)

function getAssignedMachine(orderId) {
  if (!orderId) return null
  return machines.value.find(m => {
    if (Array.isArray(m.current_orders) && m.current_orders.length > 0) {
      return m.current_orders.some(o => {
        const id = o.order_id ?? o._id ?? o.id
        return id && id.toString() === orderId.toString()
      })
    }
    const mOrderId = m.current_order?._id ?? m.current_order
    return mOrderId && mOrderId.toString() === orderId.toString()
  }) ?? null
}

function availableMachines(machineType) {
  if (!machineType) return []
  return machines.value.filter(m => m.type === machineType && m.status !== 'maintenance')
}



async function handleAssign(machineId, orderId) {
  if (!machineId || !orderId) {
    ui.showError(t('facilityProcessing.assignFailed') + ': Missing machine or order id')
    return
  }
  assigning.value = orderId
  try {
    await assignMachine(machineId, orderId)
    machineSelections[orderId] = ''
    await loadData()
  } catch (err) {
    ui.showError(t('facilityProcessing.assignFailed') + ': ' + (err?.message ?? t('facilityProcessing.unknownError')))
  } finally {
    assigning.value = null
  }
}

async function handleRelease(machineId, orderId = null) {
  try {
    await releaseMachine(machineId, orderId)
    await loadData()
  } catch (err) {
    ui.showError(t('facilityProcessing.releaseFailed') + ': ' + (err?.message ?? t('facilityProcessing.unknownError')))
  }
}

async function advanceOrder(orderId, nextStatus) {
  if (!orderId) {
    ui.showError(t('facilityProcessing.updateStatusFailed') + ': Missing order id')
    return
  }

  const normalizedNext = normalizeStatus(nextStatus)

  // When advancing from quality_check to ready_to_delivery, open the
  if (normalizedNext === 'ready_to_delivery') {
    const order = allOrders.value.find(o => getOrderId(o) === orderId)
    if (order) {
      qualityCheckOrder.value = order
      showQualityCheckModal.value = true
      return
    }
  }

  // When entering a machine-driven stage, open the machine-select modal
  const nextStage = PIPELINE.value.find(stage => stage.status === normalizedNext)
  if (nextStage?.assignable && nextStage.machineType) {
    machineSelectStage.value = {
      orderId,
      nextStatus: normalizedNext,
      stageLabel: nextStage.label,
      machineType: nextStage.machineType,
    }
    showMachineSelectModal.value = true
    return
  }

  // For non-machine stages advance directly.
  await doAdvanceOrder(orderId, normalizedNext)
}

/**
 * Performs the actual order advance: releases old machine, updates status,
 * and optionally assigns a new machine.
 *
 * @param {string}      orderId
 * @param {string}      normalizedNextStatus
 * @param {string|null} [machineIdToAssign] - machine chosen by the user (null = skip assignment)
 */
async function doAdvanceOrder(orderId, normalizedNextStatus, machineIdToAssign = null) {
  advancing.value = orderId
  try {
    // Release existing machine for THIS order only.
    const assignedMachine = getAssignedMachine(orderId)
    if (assignedMachine) {
      const assignedMachineId = getMachineId(assignedMachine)
      if (assignedMachineId) {
        await releaseMachine(assignedMachineId, orderId)
      }
    }

    await updateOrderStatus(orderId, normalizedNextStatus)

    // Assign the machine the staff explicitly chose (if any).
    if (machineIdToAssign) {
      await assignMachine(machineIdToAssign, orderId)
    }

    // Refresh orders and machines once at the end of the transition
    await loadData()
  } catch (err) {
    ui.showError(t('facilityProcessing.updateStatusFailed') + ': ' + (err?.message ?? t('facilityProcessing.unknownError')))
  } finally {
    advancing.value = null
  }
}

async function onQualityCheckSuccess() {
  showQualityCheckModal.value = false
  qualityCheckOrder.value = null
  await loadData()
}

// ── Machine-select modal handlers ─────────────────────────────────────────────

function onMachineSelectClose() {
  showMachineSelectModal.value = false
  machineSelectStage.value = null
}

async function onMachineSelectConfirm(machineId) {
  const stage = machineSelectStage.value
  if (!stage) return
  machineSelectAdvancing.value = true
  showMachineSelectModal.value = false
  try {
    await doAdvanceOrder(stage.orderId, stage.nextStatus, machineId)
  } finally {
    machineSelectAdvancing.value = false
    machineSelectStage.value = null
  }
}

async function onMachineSelectSkip() {
  const stage = machineSelectStage.value
  if (!stage) return
  machineSelectAdvancing.value = true
  showMachineSelectModal.value = false
  try {
    await doAdvanceOrder(stage.orderId, stage.nextStatus, null)
  } finally {
    machineSelectAdvancing.value = false
    machineSelectStage.value = null
  }
}
</script>
