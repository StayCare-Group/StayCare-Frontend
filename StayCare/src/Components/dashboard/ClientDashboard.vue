<template>
  <div class="space-y-6">
    <!-- KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard v-for="kpi in clientKPIs" :key="kpi.label" :label="kpi.label" :value="kpi.value" :color="kpi.color" />
    </div>

    <!-- Create Order Button -->
    <div>
      <button class="bg-[#FF56B0] text-white font-bold py-2.5 px-6 rounded-lg shadow-[0_4px_0_#E63E8A] hover:opacity-90 transition">
        + Create Order
      </button>
    </div>

    <!-- Tables -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
      <DataTable title="Recent Orders" :columns="orderCols" :rows="recentOrders" />
      <DataTable title="Open Invoices" :columns="invoiceCols" :rows="openInvoices" />
    </div>
  </div>
</template>

<script setup>
import KpiCard from '../ui/KpiCard.vue'
import DataTable from '../ui/DataTable.vue'
import { clientKPIs, recentOrders, openInvoices } from '../../data/mockData'

const orderCols = [
  { key: 'id', label: 'Order ID' },
  { key: 'date', label: 'Date' },
  { key: 'items', label: 'Items' },
  { key: 'status', label: 'Status', badge: true },
  { key: 'total', label: 'Total' },
]

const invoiceCols = [
  { key: 'id', label: 'Invoice' },
  { key: 'amount', label: 'Amount' },
  { key: 'due', label: 'Due Date' },
  { key: 'status', label: 'Status', badge: true },
]
</script>
