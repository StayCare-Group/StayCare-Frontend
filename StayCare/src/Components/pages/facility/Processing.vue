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
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-bold text-gray-800">{{ order.id }}</span>
              <span class="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{{ order.serviceType }}</span>
            </div>
            <p class="text-xs text-gray-600">{{ order.client }}</p>
            <div class="mt-2 text-xs text-gray-400">
              <span v-for="item in order.items.slice(0, 3)" :key="item.code" class="mr-1">
                {{ item.code }}&times;{{ item.qty }}
              </span>
              <span v-if="order.items.length > 3" class="text-gray-300">+{{ order.items.length - 3 }} more</span>
            </div>

            <!-- Machine assignment (for Washing, Drying, Ironing columns) -->
            <div v-if="col.assignable" class="mt-2">
              <div v-if="getAssignedMachine(order._id)" class="flex items-center justify-between bg-green-50 rounded px-2 py-1">
                <span class="text-xs text-green-700 font-medium">{{ getAssignedMachine(order._id).name }}</span>
                <button @click="handleRelease(getAssignedMachine(order._id)._id)"
                  class="text-xs text-red-500 hover:text-red-700">{{ $t('facilityProcessing.release') }}</button>
              </div>
              <div v-else class="flex gap-1">
                <select v-model="machineSelections[order._id]"
                  class="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-brand-400 outline-none">
                  <option value="">{{ $t('facilityProcessing.assignMachine') }}</option>
                  <option v-for="m in availableMachines(col.machineType)" :key="m._id" :value="m._id">
                    {{ m.name }} ({{ m.capacity }})
                  </option>
                </select>
                <AppButton
                  v-if="machineSelections[order._id]"
                  size="sm"
                  @click="handleAssign(machineSelections[order._id], order._id)"
                  :disabled="assigning === order._id"
                >{{ assigning === order._id ? $t('facilityProcessing.assigning') : $t('facilityProcessing.go') }}</AppButton>
              </div>
            </div>

            <AppButton
              v-if="col.nextStatus"
              size="sm"
              :disabled="advancing === order._id"
              class="mt-2 w-full"
              @click="advanceOrder(order._id, col.nextStatus)"
            >
              {{ advancing === order._id ? $t('facilityProcessing.moving') : $t('facilityProcessing.moveTo', { status: nextLabel(col.nextStatus) }) }}
            </AppButton>
          </div>
          <div v-if="col.orders.length === 0" class="text-xs text-gray-300 text-center py-4">{{ $t('facilityProcessing.noOrders') }}</div>
        </div>
      </div>
    </div>

    <!-- Machine Status -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
        <h3 class="text-sm font-semibold text-gray-700">{{ $t('facility.machineStatus') }}</h3>
        <div class="flex items-center gap-3">
          <span class="text-xs text-gray-400">{{ $t('facilityProcessing.inUse', { used: machines.filter(m => m.status === 'running').length, total: machines.length }) }}</span>
          <button v-if="isAdmin" @click="showAddMachine = !showAddMachine"
            class="text-xs font-semibold text-brand-700 hover:underline">
            {{ showAddMachine ? $t('common.cancel') : $t('facilityProcessing.addMachine') }}
          </button>
        </div>
      </div>

      <!-- Seed button when no machines -->
      <div v-if="!machines.length && !loading" class="p-5 text-center space-y-3">
        <p class="text-sm text-gray-500">{{ $t('facilityProcessing.noMachinesConfigured') }}</p>
        <AppButton @click="handleSeed" :loading="seeding">
          {{ seeding ? $t('facilityProcessing.seeding') : $t('facilityProcessing.seedDefaultMachines') }}
        </AppButton>
        <p v-if="seedError" class="text-xs text-red-500">{{ seedError }}</p>
      </div>

      <!-- Add machine form (admin only) -->
      <div v-if="showAddMachine" class="px-5 py-4 border-b border-gray-100">
        <form @submit.prevent="handleAddMachine" class="flex items-end gap-3 flex-wrap">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">{{ $t('common.name') }}</label>
            <input v-model="newMachine.name" required :placeholder="$t('facilityProcessing.machineNamePlaceholder')"
              class="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">{{ $t('common.type') }}</label>
            <select v-model="newMachine.type" required
              class="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none">
              <option value="washer">{{ $t('facilityProcessing.machineWasher') }}</option>
              <option value="dryer">{{ $t('facilityProcessing.machineDryer') }}</option>
              <option value="iron">{{ $t('facilityProcessing.machineIron') }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">{{ $t('facility.capacity') }}</label>
            <input v-model="newMachine.capacity" required :placeholder="$t('facilityProcessing.capacityPlaceholder')"
              class="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none" />
          </div>
          <AppButton type="submit" size="sm" :loading="addingMachine">
            {{ addingMachine ? $t('facilityProcessing.adding') : $t('properties.add') }}
          </AppButton>
          <p v-if="addMachineError" class="text-xs text-red-500 w-full">{{ addMachineError }}</p>
        </form>
      </div>
      <DataTable :headers="machineHeaders" :items="machines" row-key="_id" min-width="600px">
        <template #cell-name="{ value }">
          <span class="font-medium text-gray-800">{{ value }}</span>
        </template>
        <template #cell-type="{ value }">
          <span class="text-gray-500 capitalize">{{ value }}</span>
        </template>
        <template #cell-capacity="{ value }">
          <span class="text-gray-500">{{ value }}</span>
        </template>
        <template #cell-status="{ value }">
          <StatusBadge :status="machineStatusLabel(value)" />
        </template>
        <template #cell-currentOrder="{ item }">
          <span class="text-gray-700">{{ item.current_order?.order_number ?? '—' }}</span>
        </template>
        <template #cell-runningSince="{ item }">
          <span class="text-gray-500">{{ item.started_at ? formatTime(item.started_at) : '—' }}</span>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import StatusBadge from '../../ui/StatusBadge.vue'
import DataTable from '../../ui/DataTable.vue'
import AppButton from '../../ui/AppButton.vue'
import { useAuthStore } from '../../../stores/auth.js'
import { useUiStore } from '../../../stores/ui.js'
import { fetchOrders, updateOrderStatus } from '../../../api/orders'
import { fetchMachineStatus, assignMachine, releaseMachine, seedMachines } from '../../../api/facility'
import { apiFetch } from '../../../api/client'

const { t } = useI18n()
const authStore = useAuthStore()
const ui = useUiStore()
const isAdmin = computed(() => authStore.user?.role === 'admin')

const allOrders = ref([])
const machines = ref([])
const loading = ref(true)
const advancing = ref(null)
const assigning = ref(null)
const machineSelections = reactive({})

const seeding = ref(false)
const seedError = ref('')
const showAddMachine = ref(false)
const addingMachine = ref(false)
const addMachineError = ref('')
const newMachine = reactive({ name: '', type: 'washer', capacity: '' })

const PIPELINE = computed(() => [
  { status: 'Arrived',        label: t('facilityProcessing.received'),         nextStatus: 'Washing',        assignable: false, machineType: null },
  { status: 'Washing',        label: t('facility.washing'),                    nextStatus: 'Drying',          assignable: true,  machineType: 'washer' },
  { status: 'Drying',         label: t('facility.drying'),                     nextStatus: 'Ironing',         assignable: true,  machineType: 'dryer' },
  { status: 'Ironing',        label: t('facility.ironing'),                    nextStatus: 'QualityCheck',    assignable: true,  machineType: 'iron' },
  { status: 'QualityCheck',   label: t('facilityProcessing.qualityCheck'),     nextStatus: 'ReadyToDeliver',  assignable: false, machineType: null },
  { status: 'ReadyToDeliver', label: t('client.readyForDelivery'),             nextStatus: null,              assignable: false, machineType: null },
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

function formatTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

async function loadData() {
  try {
    const [ordersData, machinesData] = await Promise.all([
      fetchOrders().catch(() => []),
      fetchMachineStatus().catch(() => []),
    ])

    allOrders.value = (ordersData ?? []).map(raw => ({
      id: raw.order_number ?? raw._id ?? raw.id,
      _id: raw._id ?? raw.id,
      client: raw.client?.company_name ?? raw.client ?? '',
      status: raw.status,
      serviceType: raw.service_type === 'express' ? 'Express' : 'Standard',
      items: (raw.items ?? []).map(i => ({
        code: i.item_code,
        name: i.name,
        qty: i.quantity ?? 0,
      })),
    }))

    machines.value = machinesData ?? []
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

const machineHeaders = computed(() => [
  { key: 'name', label: t('facility.machine') },
  { key: 'type', label: t('common.type') },
  { key: 'capacity', label: t('facility.capacity') },
  { key: 'status', label: t('common.status') },
  { key: 'currentOrder', label: t('facility.currentOrder') },
  { key: 'runningSince', label: t('facility.runningSince') },
])

function getAssignedMachine(orderId) {
  return machines.value.find(m => {
    const mOrderId = m.current_order?._id ?? m.current_order
    return mOrderId && mOrderId.toString() === orderId?.toString()
  }) ?? null
}

function availableMachines(machineType) {
  if (!machineType) return []
  return machines.value.filter(m => m.type === machineType && m.status === 'available')
}

async function handleAssign(machineId, orderId) {
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

async function handleRelease(machineId) {
  try {
    await releaseMachine(machineId)
    await loadData()
  } catch (err) {
    ui.showError(t('facilityProcessing.releaseFailed') + ': ' + (err?.message ?? t('facilityProcessing.unknownError')))
  }
}

async function advanceOrder(orderId, nextStatus) {
  advancing.value = orderId
  try {
    const assignedMachine = getAssignedMachine(orderId)
    if (assignedMachine) {
      await releaseMachine(assignedMachine._id)
    }
    await updateOrderStatus(orderId, nextStatus)
    await loadData()
  } catch (err) {
    ui.showError(t('facilityProcessing.updateStatusFailed') + ': ' + (err?.message ?? t('facilityProcessing.unknownError')))
  } finally {
    advancing.value = null
  }
}

async function handleSeed() {
  seeding.value = true
  seedError.value = ''
  try {
    await seedMachines()
    await loadData()
  } catch (err) {
    seedError.value = err?.message || t('facilityProcessing.seedFailed')
  } finally {
    seeding.value = false
  }
}

async function handleAddMachine() {
  if (addingMachine.value) return
  addingMachine.value = true
  addMachineError.value = ''
  try {
    await apiFetch('/api/facility/machines', {
      method: 'POST',
      body: JSON.stringify({
        name: newMachine.name,
        type: newMachine.type,
        capacity: newMachine.capacity,
      }),
    })
    newMachine.name = ''
    newMachine.type = 'washer'
    newMachine.capacity = ''
    showAddMachine.value = false
    await loadData()
  } catch (err) {
    addMachineError.value = err?.message || t('facilityProcessing.addMachineFailed')
  } finally {
    addingMachine.value = false
  }
}
</script>
