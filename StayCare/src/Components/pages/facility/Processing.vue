<template>
  <div class="space-y-6">
    <h2 class="text-lg font-semibold text-brand-700">{{ $t('facility.processingBoard') }}</h2>

    <!-- Kanban Board -->
    <div class="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
      <div
        v-for="col in columns" :key="col.status"
        class="min-w-[240px] flex-shrink-0 bg-gray-50 rounded-xl p-3"
      >
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xs font-semibold text-gray-600 uppercase tracking-wide">{{ col.label }}</h3>
          <span class="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full">{{ col.orders.length }}</span>
        </div>
        <div class="space-y-2">
          <div
            v-for="order in col.orders" :key="order.id"
            class="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div class="flex items-start justify-between gap-2 mb-1">
              <div class="min-w-0 flex-1">
                <p class="text-xs font-semibold text-gray-700 truncate" :title="order.client">{{ order.client || '—' }}</p>
                <span class="text-xs font-bold text-gray-800">{{ order.id }}</span>
              </div>
              <div class="flex flex-col items-end gap-1 shrink-0">
                <span class="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{{ order.serviceType }}</span>
                <AppTooltip
                  v-if="order.specialNotes"
                  :text="order.specialNotes"
                  :title="$t('common.specialNotes')"
                >
                  <span class="cursor-help px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center gap-1 hover:bg-amber-100 transition-colors">
                    <svg class="w-3 h-3 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>{{ $t('facility.notes') }}</span>
                  </span>
                </AppTooltip>
              </div>
            </div>
            <div class="mt-2 text-xs text-gray-400">
              <span v-for="item in order.items.slice(0, 3)" :key="item.code" class="mr-1">
                {{ item.code }}&times;{{ item.qty }}
              </span>
              <span v-if="order.items.length > 3" class="text-gray-300">+{{ order.items.length - 3 }} more</span>
            </div>

            <!-- Machine assignment (for Washing, Drying, Ironing columns) -->
            <div v-if="col.assignable" class="mt-2">
              <div v-if="getAssignedMachine(getOrderId(order))" class="flex items-center justify-between bg-green-50 rounded px-2 py-1">
                <span class="text-xs text-green-700 font-medium">{{ getAssignedMachine(getOrderId(order)).name }}</span>
                <button @click="handleRelease(getMachineId(getAssignedMachine(getOrderId(order))), getOrderId(order))"
                  class="text-xs text-red-500 hover:text-red-700">{{ $t('facilityProcessing.release') }}</button>
              </div>
              <div v-else class="flex gap-1">
                <select v-model="machineSelections[getOrderId(order)]"
                  class="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-brand-400 outline-none">
                  <option value="">{{ $t('facilityProcessing.assignMachine') }}</option>
                  <option v-for="m in availableMachines(col.machineType)" :key="getMachineId(m)" :value="getMachineId(m)">
                    {{ m.name }} ({{ m.capacity }}){{ getMachineOccupancyLabel(m) }}
                  </option>
                </select>
                <AppButton
                  v-if="machineSelections[getOrderId(order)]"
                  size="sm"
                  @click="handleAssign(machineSelections[getOrderId(order)], getOrderId(order))"
                  :disabled="assigning === getOrderId(order)"
                >{{ assigning === getOrderId(order) ? $t('facilityProcessing.assigning') : $t('facilityProcessing.go') }}</AppButton>
              </div>
            </div>

            <AppButton
              v-if="col.nextStatus"
              size="sm"
              :disabled="advancing === getOrderId(order)"
              class="mt-2 w-full"
              @click="advanceOrder(getOrderId(order), col.nextStatus)"
            >
              {{ advancing === getOrderId(order) ? $t('facilityProcessing.moving') : $t('facilityProcessing.moveTo', { status: nextLabel(col.nextStatus) }) }}
            </AppButton>
          </div>
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
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from '../../ui/AppButton.vue'
import AppTooltip from '../../ui/AppTooltip.vue'
import QualityCheckModal from '../../ui/QualityCheckModal.vue'
import MachineSelectModal from '../../ui/MachineSelectModal.vue'
import MachineManagement from '../../ui/MachineManagement.vue'
import { useAuthStore } from '../../../stores/auth.js'
import { useUiStore } from '../../../stores/ui.js'
import { fetchAllOrders, updateOrderStatus } from '../../../api/orders'
import { fetchMachineStatus, assignMachine, releaseMachine } from '../../../api/facility'

const { t } = useI18n()
const authStore = useAuthStore()
const ui = useUiStore()
const isAdmin = computed(() => authStore.isAdmin)
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

function machineStatusLabel(status) {
  if (status === 'running') return 'Running'
  if (status === 'maintenance') return 'Maintenance'
  return 'Available'
}

function getOrderId(order) {
  return order?._id ?? order?.id ?? ''
}

function getMachineId(machine) {
  return machine?._id ?? machine?.id ?? ''
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function normalizeProcessingStatus(status) {
  const raw = String(status ?? '').trim()
  if (!raw) return ''

  const compact = raw.replace(/[\s-]+/g, '_').toLowerCase()
  if (compact === 'qualitycheck') return 'quality_check'
  if (compact === 'readytodelivery' || compact === 'readytodeliver') return 'ready_to_delivery'

  if (compact === 'arrived') return 'arrived'
  if (compact === 'washing') return 'washing'
  if (compact === 'drying') return 'drying'
  if (compact === 'ironing') return 'ironing'
  if (compact === 'quality_check') return 'quality_check'
  if (compact === 'ready_to_delivery') return 'ready_to_delivery'

  return compact
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
      status: normalizeProcessingStatus(raw.status),
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

function getMachineOccupancyLabel(m) {
  const count = m.current_orders?.length ?? (m.current_order_id ? 1 : 0)
  if (count === 0) return ` — ${t('facilityProcessing.statusAvailable')}`
  return ` — ${t('facilityProcessing.inUseCount', { count })}`
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

  const normalizedNext = normalizeProcessingStatus(nextStatus)

  // When advancing from quality_check to ready_to_delivery, open the
  // quality-check modal instead of advancing directly.
  if (normalizedNext === 'ready_to_delivery') {
    const order = allOrders.value.find(o => getOrderId(o) === orderId)
    if (order) {
      qualityCheckOrder.value = order
      showQualityCheckModal.value = true
      return
    }
  }

  // When entering a machine-driven stage, open the machine-select modal
  // instead of auto-assigning the first available machine.
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
