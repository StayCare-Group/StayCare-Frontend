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
import { ref, computed } from 'vue'
import StatusBadge from '../../ui/StatusBadge.vue'
import { clientsList, driversList, staffList } from '../../../data/extendedMockData.js'

const activeTab = ref('clients')

const tabs = computed(() => [
  { key: 'clients', label: 'Clients', count: clientsList.length },
  { key: 'drivers', label: 'Drivers', count: driversList.length },
  { key: 'staff', label: 'Staff', count: staffList.length },
])
</script>
