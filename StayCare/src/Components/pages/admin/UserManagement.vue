<template>
  <div class="space-y-6">
    <h2 class="text-lg font-semibold text-white">User Management</h2>

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

const activeTab = ref('clients')
const loading = ref(true)
const clientsList = ref([])
const driversList = ref([])
const staffList = ref([])

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
