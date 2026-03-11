<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-white">Invoices</h2>
      <button v-if="isAdmin" @click="navStore.setPage('create-invoice')"
        class="bg-[#FF56B0] text-white font-bold py-2 px-5 rounded-lg shadow-[0_4px_0_#E63E8A] hover:opacity-90 transition text-sm">
        {{ $t('admin.createInvoice') }}
      </button>
    </div>

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
                  @click="navStore.goToDetail('invoice-detail', inv._id)"
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
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import StatusBadge from '../../ui/StatusBadge.vue'
import { useNavStore } from '../../../stores/nav.js'
import { useAuthStore } from '../../../stores/auth.js'
import { fetchInvoices, mapInvoiceForList } from '../../../api/invoices'

const { t } = useI18n()
const navStore = useNavStore()
const authStore = useAuthStore()

const isAdmin = computed(() => authStore.user?.role === 'admin')

const invoices = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const data = await fetchInvoices()
    invoices.value = (data ?? []).map(mapInvoiceForList)
  } catch { /* stays empty */ } finally {
    loading.value = false
  }
})

const filters = ['All', 'Pending', 'Overdue', 'Paid']
const activeFilter = ref('All')

const filteredInvoices = computed(() => {
  if (activeFilter.value === 'All') return invoices.value
  return invoices.value.filter(i => i.status === activeFilter.value)
})
</script>
