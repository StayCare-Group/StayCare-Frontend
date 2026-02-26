<template>
  <div class="space-y-6">
    <h2 class="text-lg font-semibold text-white">Invoices</h2>

    <!-- Filters -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="f in filters" :key="f"
        @click="activeFilter = f"
        class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
        :class="activeFilter === f ? 'bg-[#FF56B0] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
      >{{ f }}</button>
    </div>

    <!-- Invoices table -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left min-w-[650px]">
          <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th class="px-5 py-3 font-medium">Invoice ID</th>
              <th class="px-5 py-3 font-medium">Order</th>
              <th class="px-5 py-3 font-medium">Client</th>
              <th class="px-5 py-3 font-medium">Issue Date</th>
              <th class="px-5 py-3 font-medium">Due Date</th>
              <th class="px-5 py-3 font-medium">Status</th>
              <th class="px-5 py-3 font-medium">Total</th>
              <th class="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="inv in filteredInvoices" :key="inv.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-5 py-3 font-medium text-gray-800">{{ inv.id }}</td>
              <td class="px-5 py-3 text-gray-500">{{ inv.orderId }}</td>
              <td class="px-5 py-3 text-gray-700">{{ inv.client }}</td>
              <td class="px-5 py-3 text-gray-500">{{ inv.issueDate }}</td>
              <td class="px-5 py-3 text-gray-500">{{ inv.dueDate }}</td>
              <td class="px-5 py-3"><StatusBadge :status="inv.status" /></td>
              <td class="px-5 py-3 font-semibold text-gray-800">&euro;{{ inv.grandTotal.toFixed(2) }}</td>
              <td class="px-5 py-3">
                <button
                  @click="navStore.goToDetail('invoice-detail', inv.id)"
                  class="text-[#FF56B0] hover:underline text-sm font-medium"
                >View</button>
              </td>
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
import { useNavStore } from '../../../stores/nav.js'
import { detailedInvoices } from '../../../data/extendedMockData.js'

const navStore = useNavStore()

const filters = ['All', 'Pending', 'Overdue', 'Paid']
const activeFilter = ref('All')

const filteredInvoices = computed(() => {
  if (activeFilter.value === 'All') return detailedInvoices
  return detailedInvoices.filter(i => i.status === activeFilter.value)
})
</script>
