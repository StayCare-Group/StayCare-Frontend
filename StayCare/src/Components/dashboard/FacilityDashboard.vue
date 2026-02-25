<template>
  <div class="space-y-6">
    <!-- KPI Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      <KpiCard v-for="kpi in facilityKPIs" :key="kpi.label" :label="kpi.label" :value="kpi.value" :color="kpi.color" />
    </div>

    <!-- Kanban Board -->
    <div class="bg-white rounded-xl shadow-sm p-3 sm:p-4">
      <h3 class="text-sm sm:text-base font-semibold text-gray-800 mb-4">Processing Board</h3>
      <div class="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1">
        <KanbanColumn
          v-for="(cards, column) in kanbanOrders"
          :key="column"
          :title="column"
          :cards="cards"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import KpiCard from '../ui/KpiCard.vue'
import KanbanColumn from '../ui/KanbanColumn.vue'
import { facilityKPIs, kanbanOrders } from '../../data/mockData'
</script>
