<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <h2 class="text-lg font-semibold text-brand-700">{{ $t('admin.userManagement') }}</h2>
      <AppButton @click="showInviteModal = true" size="sm" class="shrink-0">
        {{ $t('admin.inviteUser') }}
      </AppButton>
    </div>

    <!-- Invite Modal -->
    <AppModal
      :show="showInviteModal"
      :title="$t('admin.inviteNewUser')"
      size="md"
      :close-on-backdrop="false"
      :loading="inviteSending"
      @close="closeInviteModal"
    >
      <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('common.email') }}</label>
      <input type="email" v-model="inviteEmail" placeholder="user@example.com"
        class="w-full border-2 border-gray-300 bg-gray-50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/40" />

      <label class="block text-sm font-medium text-gray-600 mt-4 mb-1">{{ $t('common.role') }}</label>
      <div class="flex gap-2 flex-wrap">
        <button v-for="r in roleOptions" :key="r.value" @click="inviteRole = r.value"
          class="flex-1 min-w-[92px] py-2 rounded-lg text-sm font-medium border-2 transition-colors" :class="inviteRole === r.value
            ? 'border-brand-700 bg-brand-150 text-brand-700'
            : 'border-gray-200 text-gray-500 hover:border-gray-300'">{{ r.label }}</button>
      </div>

      <div v-if="isClientInvite" class="mt-4 space-y-3">
        <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('common.name') }}</label>
        <input type="text" v-model="inviteClientName"
          class="w-full border-2 border-gray-300 bg-gray-50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/40" />

        <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('settings.phone') }}</label>
        <input type="tel" v-model="inviteClientPhone"
          class="w-full border-2 border-gray-300 bg-gray-50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/40" />

        <label class="block text-sm font-medium text-gray-600 mb-1">{{ $t('auth.password') }}</label>
        <input type="password" v-model="inviteClientPassword"
          class="w-full border-2 border-gray-300 bg-gray-50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/40" />
      </div>

      <p v-if="inviteError" class="text-red-500 text-sm mt-3">{{ inviteError }}</p>
      <p v-if="inviteSuccess" class="text-green-600 text-sm mt-3 font-medium">{{ inviteSuccess }}</p>

      <div v-if="inviteLink" class="mt-3 bg-brand-150/40 border border-brand-300 p-3 rounded-lg space-y-2">
        <p class="text-xs font-medium text-brand-900">{{ $t('admin.backupLinkNotice') }}</p>
        <div class="flex items-center gap-2">
          <input type="text" readonly :value="inviteLink" class="w-full text-xs font-mono bg-white border border-gray-300 rounded px-2.5 py-1.5 text-gray-800 select-all focus:outline-none" />
          <button @click="copyLink" type="button" class="shrink-0 px-3 py-1.5 bg-brand-700 hover:bg-brand-800 text-white text-xs font-medium rounded-md transition-colors shadow-sm flex items-center gap-1">
            {{ copied ? $t('admin.linkCopied') : $t('admin.copyLink') }}
          </button>
        </div>
      </div>

      <!-- Option 1 Background Email Notice -->
      <div v-if="inviteLink" class="mt-3 p-3 bg-blue-50/80 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-start gap-2">
        <span class="shrink-0 text-blue-600 font-bold">ℹ️</span>
        <p>{{ $t('admin.emailProcessingNotice') }}</p>
      </div>

      <template #footer>
        <button @click="closeInviteModal" :disabled="inviteSending"
          class="flex-1 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50">
          {{ $t('common.cancel') }}
        </button>
        <AppButton class="flex-1" @click="handleInvite" :loading="inviteSending">
          {{ isClientInvite ? $t('admin.createClientAccount') : $t('admin.sendInvitation') }}
        </AppButton>
      </template>
    </AppModal>

    <LoadingPanel v-if="loading" :label="$t('common.loading')" />

    <!-- Tabs -->
    <div v-else class="overflow-x-auto -mx-1 px-1">
      <div class="inline-flex gap-1 bg-gray-100 rounded-lg p-1 min-w-max">
        <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key"
          class="px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
          :class="activeTab === tab.key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'">{{
            tab.label }} ({{ tab.count }})</button>
      </div>
    </div>

    <!-- Dynamic Users DataTable -->
    <DataTable
      v-if="!loading"
      :headers="activeHeaders"
      :items="activeItems"
      :min-width="activeMinWidth"
      :clickable="activeTab === 'clients'"
      :click-title="$t('common.viewDetailsTitle')"
      @row-click="handleRowClick"
    >
      <template #cell-id="{ value }">
        <span class="font-mono text-xs text-gray-500">{{ value }}</span>
      </template>
      <template #cell-name="{ value }">
        <span class="font-medium text-gray-800">{{ value }}</span>
      </template>
      <template #cell-type="{ value }">
        <span class="text-gray-500 text-xs capitalize">{{ value }}</span>
      </template>
      <template #cell-contact="{ item, value }">
        <div v-if="item && item.email">
          <p class="text-gray-700 text-xs">{{ item.email }}</p>
          <p v-if="item.phone" class="text-gray-400 text-xs">{{ item.phone }}</p>
        </div>
        <span v-else class="text-gray-700 text-xs">{{ value }}</span>
      </template>
      <template #cell-phone="{ value }">
        <span class="text-gray-500 text-xs">{{ value || '—' }}</span>
      </template>
      <template #cell-status="{ value }">
        <StatusBadge :status="value" />
      </template>
      <template #cell-todayStops="{ item }">
        {{ item.completedStops }}/{{ item.todayStops }}
      </template>
      <template #cell-shift="{ value }">
        <span class="text-xs">{{ value || '—' }}</span>
      </template>
    </DataTable>

    <!-- Pagination -->
    <AppPagination
      v-if="!loading"
      :current-page="currentPage"
      :total-pages="currentTotalPages"
      :total-items="currentTotalItems"
      :disabled="tabLoading"
      @page-change="onPageChange"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import StatusBadge from '../../ui/StatusBadge.vue'
import DataTable from '../../ui/DataTable.vue'
import AppButton from '../../ui/AppButton.vue'
import LoadingPanel from '../../ui/LoadingPanel.vue'
import AppModal from '../../ui/AppModal.vue'
import AppPagination from '../../ui/AppPagination.vue'
import { useNavStore } from '../../../stores/nav.js'
import { getUsers } from '../../../api/users'
import { registerUser } from '../../../api/auth'
import { createInvitation } from '../../../api/invitations'
import { getInviteRoleOptions } from '../../../constants/roles'

const { t, locale } = useI18n()
const navStore = useNavStore()

const activeTab = ref('clients')
const loading = ref(true)
const tabLoading = ref(false)
const currentPage = ref(1)

const clientsList = ref([])
const driversList = ref([])
const staffList = ref([])
const operatorsList = ref([])
const adminsList = ref([])

const tabMeta = ref({
  clients: { total: 0, pages: 1 },
  drivers: { total: 0, pages: 1 },
  staff: { total: 0, pages: 1 },
  operators: { total: 0, pages: 1 },
  admins: { total: 0, pages: 1 },
})

const usersCache = ref({
  clients: {},
  drivers: {},
  staff: {},
  operators: {},
  admins: {},
})

const tabToRoleMap = {
  clients: 'client',
  drivers: 'driver',
  staff: 'staff',
  operators: 'operator',
  admins: 'admin',
}

const roleToTabMap = {
  client: 'clients',
  driver: 'drivers',
  staff: 'staff',
  operator: 'operators',
  admin: 'admins',
}

const showInviteModal = ref(false)
const inviteEmail = ref('')
const inviteRole = ref('driver')
const inviteClientName = ref('')
const inviteClientPhone = ref('')
const inviteClientPassword = ref('')
const inviteError = ref('')
const inviteSuccess = ref('')
const inviteLink = ref('')
const inviteSending = ref(false)
const copied = ref(false)

const roleOptions = computed(() => getInviteRoleOptions(t))
const isClientInvite = computed(() => inviteRole.value === 'client')

function mapUserRow(u, role) {
  const id = u._id ?? u.id ?? u.user_id
  const status = u.is_active !== false && u.is_active !== 0 ? 'Active' : 'Inactive'
  if (role === 'client') {
    return {
      id,
      name: u.name,
      type: u.client_type ?? u.type ?? 'client',
      contact: u.email,
      phone: u.phone ?? '',
      status,
    }
  }
  if (role === 'driver') {
    return {
      id,
      name: u.name,
      phone: u.phone ?? '',
      email: u.email,
      plate: '',
      zone: '',
      status,
      todayStops: 0,
      completedStops: 0,
    }
  }
  if (role === 'staff') {
    return {
      id,
      name: u.name,
      phone: u.phone ?? '',
      email: u.email,
      shift: '',
      status,
    }
  }
  return {
    id,
    name: u.name,
    phone: u.phone ?? '',
    email: u.email,
    status,
  }
}

function setTabListData(tabKey, items) {
  if (tabKey === 'clients') clientsList.value = items
  else if (tabKey === 'drivers') driversList.value = items
  else if (tabKey === 'staff') staffList.value = items
  else if (tabKey === 'operators') operatorsList.value = items
  else if (tabKey === 'admins') adminsList.value = items
}

async function loadTabUsers(tabKey, page = 1) {
  const role = tabToRoleMap[tabKey]
  if (!role) return

  // Check in-memory cache first
  const cached = usersCache.value[tabKey]?.[page]
  if (cached) {
    setTabListData(tabKey, cached.items)
    tabMeta.value[tabKey] = { total: cached.total, pages: cached.pages }
    return
  }

  tabLoading.value = true
  try {
    const res = await getUsers({ role, page: String(page), limit: '10' }).catch(() => [])
    const rawUsers = Array.isArray(res) ? res : []
    const pagination = res?._pagination ?? {}

    const mappedItems = rawUsers.map(u => mapUserRow(u, role))
    const total = pagination.total ?? mappedItems.length
    const pages = pagination.pages ?? Math.max(1, Math.ceil(total / 10))

    if (!usersCache.value[tabKey]) {
      usersCache.value[tabKey] = {}
    }
    usersCache.value[tabKey][page] = { items: mappedItems, total, pages }
    tabMeta.value[tabKey] = { total, pages }

    setTabListData(tabKey, mappedItems)
  } finally {
    tabLoading.value = false
  }
}

watch(activeTab, (newTab) => {
  currentPage.value = 1
  loadTabUsers(newTab, 1)
})

function onPageChange(newPage) {
  currentPage.value = newPage
  loadTabUsers(activeTab.value, newPage)
}

async function copyLink() {
  if (!inviteLink.value) return
  try {
    await navigator.clipboard.writeText(inviteLink.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2500)
  } catch (err) {
    console.error('Failed to copy link:', err)
  }
}

function resetInviteForm() {
  inviteEmail.value = ''
  inviteRole.value = 'driver'
  inviteClientName.value = ''
  inviteClientPhone.value = ''
  inviteClientPassword.value = ''
  inviteError.value = ''
  inviteSuccess.value = ''
  inviteLink.value = ''
  copied.value = false
}

function closeInviteModal() {
  showInviteModal.value = false
  resetInviteForm()
}

async function handleInvite() {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phonePattern = /^\d{8}$/

  if (!inviteEmail.value || !emailPattern.test(inviteEmail.value)) {
    inviteError.value = t('admin.invalidEmailError')
    return
  }

  if (isClientInvite.value) {
    if (!inviteClientName.value || !inviteClientPassword.value) {
      inviteError.value = t('auth.errorUsernamePassword')
      return
    }
    if (inviteClientPhone.value && !phonePattern.test(inviteClientPhone.value)) {
      inviteError.value = t('auth.errorInvalidPhone')
      return
    }
  }

  try {
    inviteError.value = ''
    inviteSuccess.value = ''
    inviteLink.value = ''
    inviteSending.value = true

    const targetTab = roleToTabMap[inviteRole.value] || 'clients'
    if (usersCache.value[targetTab]) {
      usersCache.value[targetTab] = {}
    }

    if (isClientInvite.value) {
      await registerUser({
        name: inviteClientName.value,
        email: inviteEmail.value,
        password: inviteClientPassword.value,
        phone: inviteClientPhone.value || undefined,
        language: locale.value || 'en',
        role: 'client',
      })
      inviteSuccess.value = t('admin.clientCreatedSuccess')
      activeTab.value = 'clients'
      currentPage.value = 1
      await loadTabUsers('clients', 1)
      closeInviteModal()
      return
    }

    const data = await createInvitation({
      email: inviteEmail.value,
      role: inviteRole.value,
    })

    if (data?.isRenewal) {
      inviteSuccess.value = t('admin.invitationRenewedSuccess')
    } else {
      inviteSuccess.value = t('admin.invitationSentSuccess')
    }
    if (data?.invitation?.invite_url) {
      inviteLink.value = data.invitation.invite_url
    }

    // Refresh affected tab data
    await loadTabUsers(targetTab, 1)
  } catch (err) {
    const msg = err?.message || ''
    if (msg.includes('already registered') || msg.includes('ya está registrado')) {
      inviteError.value = t('admin.emailAlreadyRegisteredError')
    } else {
      inviteError.value = msg || t('admin.invitationSentError')
    }
  } finally {
    inviteSending.value = false
  }
}

onMounted(async () => {
  try {
    loading.value = true
    // Load initial page 1 for all tabs in parallel to populate exact counts and page 1 data
    await Promise.all([
      loadTabUsers('clients', 1),
      loadTabUsers('drivers', 1),
      loadTabUsers('staff', 1),
      loadTabUsers('operators', 1),
      loadTabUsers('admins', 1),
    ])
  } finally {
    loading.value = false
  }
})

const tabs = computed(() => [
  { key: 'clients', label: t('admin.clients'), count: tabMeta.value.clients.total },
  { key: 'drivers', label: t('admin.drivers'), count: tabMeta.value.drivers.total },
  { key: 'staff', label: t('admin.facilityStaff'), count: tabMeta.value.staff.total },
  { key: 'operators', label: t('admin.operators'), count: tabMeta.value.operators.total },
  { key: 'admins', label: t('admin.admins'), count: tabMeta.value.admins.total },
])

const currentTotalPages = computed(() => tabMeta.value[activeTab.value]?.pages || 1)
const currentTotalItems = computed(() => tabMeta.value[activeTab.value]?.total || 0)

const clientHeaders = computed(() => [
  { key: 'name', label: t('common.name') },
  { key: 'type', label: t('common.type'), tdClass: 'text-gray-500' },
  { key: 'contact', label: t('common.contact') },
  { key: 'phone', label: t('settings.phone'), tdClass: 'text-gray-500' },
  { key: 'status', label: t('common.status') },
])

const driverHeaders = computed(() => [
  { key: 'id', label: t('common.id') },
  { key: 'name', label: t('common.name') },
  { key: 'contact', label: t('common.contact') },
  { key: 'plate', label: t('admin.vehicle'), tdClass: 'text-gray-500' },
  { key: 'zone', label: t('admin.zone'), tdClass: 'text-gray-500' },
  { key: 'status', label: t('common.status') },
  { key: 'todayStops', label: t('common.today'), tdClass: 'text-gray-700' },
])

const staffHeaders = computed(() => [
  { key: 'id', label: t('common.id') },
  { key: 'name', label: t('common.name') },
  { key: 'contact', label: t('common.contact') },
  { key: 'shift', label: t('admin.shift') },
  { key: 'status', label: t('common.status') },
])

const operatorsHeaders = computed(() => [
  { key: 'id', label: t('common.id') },
  { key: 'name', label: t('common.name') },
  { key: 'contact', label: t('common.contact') },
  { key: 'status', label: t('common.status') },
])

const adminsHeaders = computed(() => [
  { key: 'id', label: t('common.id') },
  { key: 'name', label: t('common.name') },
  { key: 'contact', label: t('common.contact') },
  { key: 'status', label: t('common.status') },
])

const activeHeaders = computed(() => {
  if (activeTab.value === 'clients') return clientHeaders.value
  if (activeTab.value === 'drivers') return driverHeaders.value
  if (activeTab.value === 'staff') return staffHeaders.value
  if (activeTab.value === 'operators') return operatorsHeaders.value
  return adminsHeaders.value
})

const activeItems = computed(() => {
  if (activeTab.value === 'clients') return clientsList.value
  if (activeTab.value === 'drivers') return driversList.value
  if (activeTab.value === 'staff') return staffList.value
  if (activeTab.value === 'operators') return operatorsList.value
  return adminsList.value
})

const activeMinWidth = computed(() => (activeTab.value === 'drivers' ? '700px' : '600px'))

function handleRowClick(row) {
  if (activeTab.value === 'clients' && row?.id) {
    navStore.goToDetail('client-detail', row.id)
  }
}
</script>
