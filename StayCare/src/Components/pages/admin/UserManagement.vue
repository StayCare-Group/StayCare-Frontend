<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <h2 class="text-lg font-semibold text-brand-700">{{ $t('admin.userManagement') }}</h2>
      <AppButton @click="showInviteModal = true" size="sm" class="shrink-0">
        {{ $t('admin.inviteUser') }}
      </AppButton>
    </div>

    <!-- Invite Modal -->
    <div v-if="showInviteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="closeInviteModal">
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">{{ $t('admin.inviteNewUser') }}</h3>

        <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('common.email') }}</label>
        <input
          type="email"
          v-model="inviteEmail"
          placeholder="user@example.com"
          class="w-full border-2 border-gray-300 bg-gray-50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/40"
        />

        <label class="block text-sm font-medium text-gray-600 mt-4 mb-1">{{ $t('common.role') }}</label>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="r in roleOptions" :key="r.value"
            @click="inviteRole = r.value"
            class="flex-1 min-w-[92px] py-2 rounded-lg text-sm font-medium border-2 transition-colors"
            :class="inviteRole === r.value
              ? 'border-brand-700 bg-brand-150 text-brand-700'
              : 'border-gray-200 text-gray-500 hover:border-gray-300'"
          >{{ r.label }}</button>
        </div>

        <p v-if="inviteError" class="text-red-500 text-sm mt-3">{{ inviteError }}</p>
        <p v-if="inviteSuccess" class="text-green-600 text-sm mt-3">{{ inviteSuccess }}</p>
        <p v-if="inviteLink" class="text-xs text-gray-500 mt-2 break-all bg-gray-50 p-2 rounded">
          <span class="font-medium text-gray-700">{{ $t('admin.backupLink') }}</span> {{ inviteLink }}
        </p>

        <div class="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            @click="closeInviteModal"
            class="flex-1 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >{{ $t('common.cancel') }}</button>
          <AppButton class="flex-1" @click="handleInvite" :loading="inviteSending">
            {{ $t('admin.sendInvitation') }}
          </AppButton>
        </div>
      </div>
    </div>

    <LoadingPanel v-if="loading" :label="$t('common.loading')" />

    <!-- Tabs -->
    <div v-else class="overflow-x-auto -mx-1 px-1">
      <div class="inline-flex gap-1 bg-gray-100 rounded-lg p-1 min-w-max">
        <button
          v-for="tab in tabs" :key="tab.key"
          @click="activeTab = tab.key"
          class="px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
          :class="activeTab === tab.key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
        >{{ tab.label }} ({{ tab.count }})</button>
      </div>
    </div>

    <!-- Clients -->
    <DataTable
      v-if="activeTab === 'clients'"
      :headers="clientHeaders"
      :items="clientsList"
      min-width="600px"
      clickable
      :click-title="$t('common.viewDetailsTitle')"
      @row-click="row => navStore.goToDetail('client-detail', row.id)"
    >
      <template #cell-name="{ value }">
        <span class="font-medium text-gray-800">{{ value }}</span>
      </template>
      <template #cell-type="{ value }">
        <span class="text-gray-500 text-xs capitalize">{{ value }}</span>
      </template>
      <template #cell-contact="{ value }">
        <span class="text-gray-700 text-xs">{{ value }}</span>
      </template>
      <template #cell-phone="{ value }">
        <span class="text-gray-500 text-xs">{{ value || '—' }}</span>
      </template>
      <template #cell-status="{ value }">
        <StatusBadge :status="value" />
      </template>
    </DataTable>

    <!-- Drivers -->
    <DataTable
      v-if="activeTab === 'drivers'"
      :headers="driverHeaders"
      :items="driversList"
      min-width="700px"
    >
      <template #cell-id="{ value }">
        <span class="font-mono text-xs text-gray-500">{{ value }}</span>
      </template>
      <template #cell-name="{ value }">
        <span class="font-medium text-gray-800">{{ value }}</span>
      </template>
      <template #cell-contact="{ item }">
        <p class="text-gray-700 text-xs">{{ item.email }}</p>
        <p class="text-gray-400 text-xs">{{ item.phone }}</p>
      </template>
      <template #cell-status="{ value }">
        <StatusBadge :status="value" />
      </template>
      <template #cell-todayStops="{ item }">
        {{ item.completedStops }}/{{ item.todayStops }}
      </template>
    </DataTable>

    <!-- Facility Staff -->
    <DataTable
      v-if="activeTab === 'staff'"
      :headers="staffHeaders"
      :items="staffList"
      min-width="600px"
    >
      <template #cell-id="{ value }">
        <span class="font-mono text-xs text-gray-500">{{ value }}</span>
      </template>
      <template #cell-name="{ value }">
        <span class="font-medium text-gray-800">{{ value }}</span>
      </template>
      <template #cell-contact="{ item }">
        <p class="text-gray-700 text-xs">{{ item.email }}</p>
        <p class="text-gray-400 text-xs">{{ item.phone }}</p>
      </template>
      <template #cell-status="{ value }">
        <StatusBadge :status="value" />
      </template>
      <template #cell-shift="{ value }">
        <span class="text-xs">{{ value || '—' }}</span>
      </template>
    </DataTable>

    <!-- Admins -->
    <DataTable
      v-if="activeTab === 'admins'"
      :headers="adminsHeaders"
      :items="adminsList"
      min-width="600px"
    >
      <template #cell-id="{ value }">
        <span class="font-mono text-xs text-gray-500">{{ value }}</span>
      </template>
      <template #cell-name="{ value }">
        <span class="font-medium text-gray-800">{{ value }}</span>
      </template>
      <template #cell-contact="{ item }">
        <p class="text-gray-700 text-xs">{{ item.email }}</p>
        <p class="text-gray-400 text-xs">{{ item.phone }}</p>
      </template>
      <template #cell-status="{ value }">
        <StatusBadge :status="value" />
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import StatusBadge from '../../ui/StatusBadge.vue'
import DataTable from '../../ui/DataTable.vue'
import AppButton from '../../ui/AppButton.vue'
import LoadingPanel from '../../ui/LoadingPanel.vue'
import { useNavStore } from '../../../stores/nav.js'

const { t } = useI18n()
import { fetchUsers } from '../../../api/users'
import { createInvitation } from '../../../api/invitations'
import { getInviteRoleOptions } from '../../../constants/roles'

const navStore = useNavStore()

const activeTab = ref('clients')
const loading = ref(true)
const clientsList = ref([])
const driversList = ref([])
const staffList = ref([])
const adminsList = ref([])

const showInviteModal = ref(false)
const inviteEmail = ref('')
const inviteRole = ref('driver')
const inviteError = ref('')
const inviteSuccess = ref('')
const inviteLink = ref('')
const inviteSending = ref(false)

const roleOptions = computed(() => getInviteRoleOptions(t))

function closeInviteModal() {
  showInviteModal.value = false
  inviteEmail.value = ''
  inviteRole.value = 'driver'
  inviteError.value = ''
  inviteSuccess.value = ''
  inviteLink.value = ''
}

async function handleInvite() {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!inviteEmail.value || !emailPattern.test(inviteEmail.value)) {
    inviteError.value = t('admin.invalidEmailError')
    return
  }

  try {
    inviteError.value = ''
    inviteSuccess.value = ''
    inviteLink.value = ''
    inviteSending.value = true

    const data = await createInvitation({
      email: inviteEmail.value,
      role: inviteRole.value,
    })

    inviteSuccess.value = t('admin.invitationSentSuccess')
    if (data?.invitation?.invite_url) {
      inviteLink.value = data.invitation.invite_url
    }
  } catch (err) {
    inviteError.value = err?.message || t('admin.invitationSentError')
  } finally {
    inviteSending.value = false
  }
}

onMounted(async () => {
  try {
    const users = await fetchUsers().catch(() => [])

    clientsList.value = (users ?? []).filter(u => u.role === 'client').map(u => ({
      id: u._id ?? u.id ?? u.user_id,
      name: u.name,
      type: u.client_type ?? u.type ?? 'client',
      contact: u.email,
      phone: u.phone ?? '',
      status: u.is_active !== false && u.is_active !== 0 ? 'Active' : 'Inactive',
    }))

    driversList.value = users.filter(u => u.role === 'driver').map(u => ({
      id: u._id ?? u.id,
      name: u.name,
      phone: u.phone ?? '',
      email: u.email,
      plate: '',
      zone: '',
      status: u.is_active !== false ? 'Active' : 'Inactive',
      todayStops: 0,
      completedStops: 0,
    }))

    staffList.value = users.filter(u => u.role === 'staff').map(u => ({
      id: u._id ?? u.id,
      name: u.name,
      phone: u.phone ?? '',
      email: u.email,
      shift: '',
      status: u.is_active !== false ? 'Active' : 'Inactive',
    }))

    adminsList.value = users.filter(u => u.role === 'admin').map(u => ({
      id: u._id ?? u.id,
      name: u.name,
      phone: u.phone ?? '',
      email: u.email,
      status: u.is_active !== false ? 'Active' : 'Inactive',
    }))
  } catch { /* stays empty */ } finally {
    loading.value = false
  }
})

const tabs = computed(() => [
  { key: 'clients', label: t('admin.clients'), count: clientsList.value.length },
  { key: 'drivers', label: t('admin.drivers'), count: driversList.value.length },
  { key: 'staff', label: t('admin.facilityStaff'), count: staffList.value.length },
  { key: 'admins', label: t('admin.admins'), count: adminsList.value.length },
])

const clientHeaders = computed(() => [
  { key: 'name',    label: t('common.name') },
  { key: 'type',    label: t('common.type'),    tdClass: 'text-gray-500' },
  { key: 'contact', label: t('common.contact') },
  { key: 'phone',   label: t('settings.phone'), tdClass: 'text-gray-500' },
  { key: 'status',  label: t('common.status') },
])

const driverHeaders = computed(() => [
  { key: 'id',         label: t('common.id') },
  { key: 'name',       label: t('common.name') },
  { key: 'contact',    label: t('common.contact') },
  { key: 'plate',      label: t('admin.vehicle'),  tdClass: 'text-gray-500' },
  { key: 'zone',       label: t('admin.zone'),     tdClass: 'text-gray-500' },
  { key: 'status',     label: t('common.status') },
  { key: 'todayStops', label: t('common.today'),   tdClass: 'text-gray-700' },
])

const staffHeaders = computed(() => [
  { key: 'id',      label: t('common.id') },
  { key: 'name',    label: t('common.name') },
  { key: 'contact', label: t('common.contact') },
  { key: 'shift',   label: t('admin.shift') },
  { key: 'status',  label: t('common.status') },
])

const adminsHeaders = computed(() => [
  { key: 'id',      label: t('common.id') },
  { key: 'name',    label: t('common.name') },
  { key: 'contact', label: t('common.contact') },
  { key: 'status',  label: t('common.status') },
])
</script>
