<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-white">User Management</h2>
      <button
        @click="showInviteModal = true"
        class="px-4 py-2 bg-[#FF56B0] text-white text-sm font-semibold rounded-lg shadow-[0_3px_0_#E63E8A] hover:bg-[#00F5F3] hover:shadow-[inset_0_2px_6px_rgba(0,140,140,0.7)] transition duration-300"
      >
        + Invite User
      </button>
    </div>

    <!-- Invite Modal -->
    <div v-if="showInviteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="closeInviteModal">
      <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Invite a New User</h3>

        <label class="block text-sm font-medium text-gray-600 mb-1">Email</label>
        <input
          type="email"
          v-model="inviteEmail"
          placeholder="user@example.com"
          class="w-full border-2 border-gray-300 bg-gray-50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#FF56B0] focus:ring-2 focus:ring-[#FF56B0]/40"
        />

        <label class="block text-sm font-medium text-gray-600 mt-4 mb-1">Role</label>
        <div class="flex gap-2">
          <button
            v-for="r in roleOptions" :key="r.value"
            @click="inviteRole = r.value"
            class="flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-colors"
            :class="inviteRole === r.value
              ? 'border-[#FF56B0] bg-[#FF56B0]/10 text-[#FF56B0]'
              : 'border-gray-200 text-gray-500 hover:border-gray-300'"
          >{{ r.label }}</button>
        </div>

        <p v-if="inviteError" class="text-red-500 text-sm mt-3">{{ inviteError }}</p>
        <p v-if="inviteSuccess" class="text-green-600 text-sm mt-3">{{ inviteSuccess }}</p>
        <p v-if="inviteLink" class="text-xs text-gray-500 mt-2 break-all bg-gray-50 p-2 rounded">
          <span class="font-medium text-gray-700">Backup link:</span> {{ inviteLink }}
        </p>

        <div class="flex gap-3 mt-6">
          <button
            @click="closeInviteModal"
            class="flex-1 py-2 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >Cancel</button>
          <button
            @click="handleInvite"
            :disabled="inviteSending"
            class="flex-1 py-2 bg-[#FF56B0] text-white rounded-lg text-sm font-semibold shadow-[0_3px_0_#E63E8A] hover:bg-[#00F5F3] hover:shadow-[inset_0_2px_6px_rgba(0,140,140,0.7)] transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >{{ inviteSending ? 'Sending...' : 'Send Invitation' }}</button>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
      <button
        v-for="tab in tabs" :key="tab.key"
        @click="activeTab = tab.key"
        class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
        :class="activeTab === tab.key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
      >{{ tab.label }} ({{ tab.count }})</button>
    </div>

    <!-- Clients -->
    <div v-if="activeTab === 'clients'" class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left min-w-[800px]">
          <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th class="px-5 py-3 font-medium">ID</th>
              <th class="px-5 py-3 font-medium">Name</th>
              <th class="px-5 py-3 font-medium">Type</th>
              <th class="px-5 py-3 font-medium">Contact</th>
              <th class="px-5 py-3 font-medium">Status</th>
              <th class="px-5 py-3 font-medium">Orders</th>
              <th class="px-5 py-3 font-medium">Balance</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="c in clientsList" :key="c.id" class="hover:bg-gray-50">
              <td class="px-5 py-3 font-mono text-xs text-gray-500">{{ c.id }}</td>
              <td class="px-5 py-3 font-medium text-gray-800">{{ c.name }}</td>
              <td class="px-5 py-3 text-gray-500">{{ c.type }}</td>
              <td class="px-5 py-3"><p class="text-gray-700 text-xs">{{ c.contact }}</p><p class="text-gray-400 text-xs">{{ c.phone }}</p></td>
              <td class="px-5 py-3"><StatusBadge :status="c.status" /></td>
              <td class="px-5 py-3 text-gray-700">{{ c.totalOrders }}</td>
              <td class="px-5 py-3 font-semibold" :class="c.outstandingBalance > 0 ? 'text-red-600' : 'text-gray-800'">&euro;{{ c.outstandingBalance.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Drivers -->
    <div v-if="activeTab === 'drivers'" class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left min-w-[700px]">
          <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th class="px-5 py-3 font-medium">ID</th>
              <th class="px-5 py-3 font-medium">Name</th>
              <th class="px-5 py-3 font-medium">Contact</th>
              <th class="px-5 py-3 font-medium">Vehicle</th>
              <th class="px-5 py-3 font-medium">Zone</th>
              <th class="px-5 py-3 font-medium">Status</th>
              <th class="px-5 py-3 font-medium">Today</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="d in driversList" :key="d.id" class="hover:bg-gray-50">
              <td class="px-5 py-3 font-mono text-xs text-gray-500">{{ d.id }}</td>
              <td class="px-5 py-3 font-medium text-gray-800">{{ d.name }}</td>
              <td class="px-5 py-3"><p class="text-gray-700 text-xs">{{ d.email }}</p><p class="text-gray-400 text-xs">{{ d.phone }}</p></td>
              <td class="px-5 py-3 text-gray-500">{{ d.plate }}</td>
              <td class="px-5 py-3 text-gray-500 text-xs">{{ d.zone }}</td>
              <td class="px-5 py-3"><StatusBadge :status="d.status" /></td>
              <td class="px-5 py-3 text-gray-700">{{ d.completedStops }}/{{ d.todayStops }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Staff -->
    <div v-if="activeTab === 'staff'" class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left min-w-[600px]">
          <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th class="px-5 py-3 font-medium">ID</th>
              <th class="px-5 py-3 font-medium">Name</th>
              <th class="px-5 py-3 font-medium">Contact</th>
              <th class="px-5 py-3 font-medium">Role</th>
              <th class="px-5 py-3 font-medium">Shift</th>
              <th class="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="s in staffList" :key="s.id" class="hover:bg-gray-50">
              <td class="px-5 py-3 font-mono text-xs text-gray-500">{{ s.id }}</td>
              <td class="px-5 py-3 font-medium text-gray-800">{{ s.name }}</td>
              <td class="px-5 py-3"><p class="text-gray-700 text-xs">{{ s.email }}</p><p class="text-gray-400 text-xs">{{ s.phone }}</p></td>
              <td class="px-5 py-3 text-gray-500">{{ s.role }}</td>
              <td class="px-5 py-3 text-gray-500 text-xs">{{ s.shift }}</td>
              <td class="px-5 py-3"><StatusBadge :status="s.status" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import StatusBadge from '../../ui/StatusBadge.vue'
import { fetchClients } from '../../../api/clients'
import { fetchUsers } from '../../../api/users'
import { fetchOrders } from '../../../api/orders'
import { fetchInvoices } from '../../../api/invoices'
import { createInvitation } from '../../../api/invitations'

const activeTab = ref('clients')
const loading = ref(true)
const clientsList = ref([])
const driversList = ref([])
const staffList = ref([])

const showInviteModal = ref(false)
const inviteEmail = ref('')
const inviteRole = ref('driver')
const inviteError = ref('')
const inviteSuccess = ref('')
const inviteLink = ref('')
const inviteSending = ref(false)

const roleOptions = [
  { value: 'driver', label: 'Driver' },
  { value: 'staff', label: 'Staff' },
  { value: 'admin', label: 'Admin' },
]

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
    inviteError.value = 'Please enter a valid email address.'
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

    inviteSuccess.value = 'Invitation sent successfully!'
    if (data?.invitation?.invite_url) {
      inviteLink.value = data.invitation.invite_url
    }
  } catch (err) {
    inviteError.value = err?.message || 'Failed to send invitation.'
  } finally {
    inviteSending.value = false
  }
}

onMounted(async () => {
  try {
    const [clientsData, usersData, ordersData, invoicesData] = await Promise.all([
      fetchClients().catch(() => []),
      fetchUsers().catch(() => []),
      fetchOrders().catch(() => []),
      fetchInvoices().catch(() => []),
    ])

    const clients = clientsData ?? []
    const users = usersData ?? []
    const orders = ordersData ?? []
    const invoices = invoicesData ?? []

    const ordersByClientId = new Map()
    for (const o of orders) {
      const clientObj = typeof o.client === 'object' ? o.client : null
      const clientId = clientObj?._id ?? (typeof o.client === 'string' ? o.client : null)
      if (!clientId) continue

      const current = ordersByClientId.get(clientId) ?? { count: 0, revenue: 0 }
      current.count += 1
      const total = o.pricing_snapshot?.total ?? 0
      current.revenue += typeof total === 'number' ? total : 0
      ordersByClientId.set(clientId, current)
    }

    const balanceByClientId = new Map()
    for (const inv of invoices) {
      const clientObj = typeof inv.client === 'object' ? inv.client : null
      const clientId = clientObj?._id ?? (typeof inv.client === 'string' ? inv.client : null)
      if (!clientId) continue

      // Treat non-paid invoices as outstanding
      if (inv.status && inv.status.toLowerCase() === 'paid') continue

      const current = balanceByClientId.get(clientId) ?? 0
      const total = inv.total ?? inv.grandTotal ?? 0
      balanceByClientId.set(clientId, current + (typeof total === 'number' ? total : 0))
    }

    const companyClients = clients.map(c => {
      const aggregates = ordersByClientId.get(c._id) ?? { count: 0, revenue: 0 }
      const outstandingBalance = balanceByClientId.get(c._id) ?? 0

      return {
        id: c._id,
        name: c.company_name,
        type: c.pricing_tier === 'standard' ? 'Hotel' : c.pricing_tier,
        contact: c.email,
        phone: c.phone,
        address: c.billing_address,
        creditTerms: `${c.credits_terms_days ?? 30} days`,
        status: 'Active',
        totalOrders: aggregates.count,
        outstandingBalance,
      }
    })

    const clientUsers = users
      .filter(u => u.role === 'client')
      .map(u => {
        const clientId = typeof u.client === 'string' ? u.client : (u.client?._id ?? null)
        const aggregates = clientId ? ordersByClientId.get(clientId) ?? { count: 0, revenue: 0 } : { count: 0, revenue: 0 }
        const outstandingBalance = clientId ? balanceByClientId.get(clientId) ?? 0 : 0

        return {
          id: u._id ?? u.id,
          name: u.name,
          type: 'User',
          contact: u.email,
          phone: u.phone ?? '',
          address: '',
          creditTerms: '',
          status: u.is_active !== false ? 'Active' : 'Inactive',
          totalOrders: aggregates.count,
          outstandingBalance,
        }
      })

    clientsList.value = [...companyClients, ...clientUsers]

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

    staffList.value = users.filter(u => u.role === 'staff' || u.role === 'admin').map(u => ({
      id: u._id ?? u.id,
      name: u.name,
      phone: u.phone ?? '',
      email: u.email,
      role: u.role === 'admin' ? 'Admin' : 'Facility Staff',
      shift: '',
      status: u.is_active ? 'Active' : 'Inactive',
    }))
  } catch { /* stays empty */ } finally {
    loading.value = false
  }
})

const tabs = computed(() => [
  { key: 'clients', label: 'Clients', count: clientsList.value.length },
  { key: 'drivers', label: 'Drivers', count: driversList.value.length },
  { key: 'staff', label: 'Staff', count: staffList.value.length },
])
</script>
