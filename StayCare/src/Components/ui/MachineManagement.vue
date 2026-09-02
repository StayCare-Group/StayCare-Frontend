<template>
  <div class="bg-white rounded-xl shadow-sm overflow-hidden">
    <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
      <h3 class="text-sm font-semibold text-gray-700">{{ $t('facility.machineStatus') }}</h3>
      <div class="flex items-center gap-3">
        <span class="text-xs text-gray-400">
          {{ $t('facilityProcessing.inUse', { used: machines.filter(m => m.status === 'running').length, total: machines.length }) }}
        </span>
        <button
          v-if="isAdminOrStaff"
          @click="showAddMachine = !showAddMachine"
          class="text-xs font-semibold text-brand-700 hover:underline"
        >
          {{ showAddMachine ? $t('common.cancel') : $t('facilityProcessing.addMachine') }}
        </button>
      </div>
    </div>

    <!-- Add/Edit machine form -->
    <div v-if="showAddMachine" class="px-5 py-4 border-b border-gray-100 bg-blue-50">
      <h4 class="text-sm font-semibold text-gray-700 mb-4">
        {{ editingMachineId ? $t('facilityProcessing.editMachine') : $t('facilityProcessing.addMachine') }}
      </h4>
      <form @submit.prevent="handleAddMachine" class="flex items-end gap-3 flex-wrap">
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">{{ $t('common.name') }}</label>
          <input
            v-model="newMachine.name"
            required
            :placeholder="$t('facilityProcessing.machineNamePlaceholder')"
            class="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">{{ $t('common.type') }}</label>
          <select
            v-model="newMachine.type"
            required
            class="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
          >
            <option value="washer">{{ $t('facilityProcessing.machineWasher') }}</option>
            <option value="dryer">{{ $t('facilityProcessing.machineDryer') }}</option>
            <option value="iron">{{ $t('facilityProcessing.machineIron') }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">{{ $t('facility.capacity') }}</label>
          <input
            v-model="newMachine.capacity"
            required
            :placeholder="$t('facilityProcessing.capacityPlaceholder')"
            class="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">{{ $t('common.status') }}</label>
          <select
            v-model="newMachine.status"
            required
            class="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
          >
            <option value="available">{{ $t('facilityProcessing.statusAvailable') }}</option>
            <option value="running">{{ $t('facilityProcessing.statusRunning') }}</option>
            <option value="maintenance">{{ $t('facilityProcessing.statusMaintenance') }}</option>
          </select>
        </div>
        <AppButton type="submit" size="sm" :loading="addingMachine" class="font-semibold">
          <span v-if="addingMachine">{{ $t('facilityProcessing.adding') }}</span>
          <span v-else>{{ editingMachineId ? $t('admin.edit') : $t('properties.add') }}</span>
        </AppButton>
        <button
          v-if="editingMachineId"
          type="button"
          @click="handleCancelEdit()"
          class="text-xs font-medium text-gray-600 hover:text-gray-700"
        >
          {{ $t('common.cancel') }}
        </button>
        <p v-if="addMachineError" class="text-xs text-red-500 w-full">{{ addMachineError }}</p>
      </form>
    </div>

    <!-- Machines table -->
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
      <template #cell-actions="{ item }">
        <div class="flex gap-2">
          <button
            v-if="isAdminOrStaff"
            @click="handleEditMachine(item)"
            class="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {{ $t('admin.edit') }}
          </button>
          <button
            v-if="isAdminOrStaff"
            @click="handleDeleteMachine(item._id || item.id)"
            class="text-xs text-red-600 hover:text-red-700 font-medium"
          >
            {{ $t('admin.delete') }}
          </button>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import StatusBadge from './StatusBadge.vue'
import DataTable from './DataTable.vue'
import AppButton from './AppButton.vue'
import { useAuthStore } from '../../stores/auth.js'
import { useUiStore } from '../../stores/ui.js'
import { apiFetch } from '../../api/client'

const props = defineProps({
  machines: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['refresh'])

const { t } = useI18n()
const authStore = useAuthStore()
const ui = useUiStore()
const isAdminOrStaff = computed(() => authStore.isAdminOrStaff)

const showAddMachine = ref(false)
const addingMachine = ref(false)
const addMachineError = ref('')
const editingMachineId = ref(null)
const newMachine = reactive({ name: '', type: 'washer', capacity: '', status: 'available' })

const machineHeaders = computed(() => [
  { key: 'name', label: t('facility.machine') },
  { key: 'type', label: t('common.type') },
  { key: 'capacity', label: t('facility.capacity') },
  { key: 'status', label: t('common.status') },
  { key: 'currentOrder', label: t('facility.currentOrder') },
  { key: 'runningSince', label: t('facility.runningSince') },
  { key: 'actions', label: t('admin.actions') },
])

function machineStatusLabel(status) {
  if (status === 'running') return 'Running'
  if (status === 'maintenance') return 'Maintenance'
  return 'Available'
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

async function handleAddMachine() {
  if (addingMachine.value) return
  addingMachine.value = true
  addMachineError.value = ''
  try {
    const method = editingMachineId.value ? 'PUT' : 'POST'
    const url = editingMachineId.value ? `/api/machines/${editingMachineId.value}` : '/api/machines'
    const isEditing = !!editingMachineId.value

    await apiFetch(url, {
      method,
      body: JSON.stringify({
        name: newMachine.name,
        type: newMachine.type,
        capacity: newMachine.capacity,
        status: newMachine.status,
      }),
    })

    ui.showSuccess(isEditing ? t('facilityProcessing.machineUpdated') : t('facilityProcessing.machineAdded'))
    newMachine.name = ''
    newMachine.type = 'washer'
    newMachine.capacity = ''
    newMachine.status = 'available'
    showAddMachine.value = false
    editingMachineId.value = null
    emit('refresh')
  } catch (err) {
    if (err?.status === 403 || err?.message === 'Forbidden') {
      addMachineError.value = t('common.accessDenied')
    } else {
      addMachineError.value = err?.message || t('facilityProcessing.addMachineFailed')
    }
    ui.showError(addMachineError.value)
  } finally {
    addingMachine.value = false
  }
}

function handleEditMachine(machine) {
  const machineId = machine._id || machine.id
  if (!machineId) {
    ui.showError('No se pudo identificar la máquina. Recarga la página.')
    return
  }
  editingMachineId.value = machineId
  newMachine.name = machine.name || ''
  newMachine.type = machine.type || 'washer'
  newMachine.capacity = machine.capacity || ''
  newMachine.status = machine.status || 'available'
  showAddMachine.value = true
}

function handleCancelEdit() {
  editingMachineId.value = null
  newMachine.name = ''
  newMachine.type = 'washer'
  newMachine.capacity = ''
  newMachine.status = 'available'
  showAddMachine.value = false
}

async function handleDeleteMachine(machineId) {
  if (!machineId) {
    ui.showError('Error: No se pudo identificar la máquina.')
    return
  }
  try {
    await apiFetch(`/api/machines/${machineId}`, {
      method: 'DELETE',
    })
    ui.showSuccess(t('facilityProcessing.machineDeleted'))
    emit('refresh')
  } catch (err) {
    ui.showError(t('facilityProcessing.deleteFailed') + ': ' + (err?.message ?? t('facilityProcessing.unknownError')))
  }
}
</script>
