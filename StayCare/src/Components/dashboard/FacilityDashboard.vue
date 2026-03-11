<template>
  <div>
    <!-- Sub-pages -->
    <Reception v-if="navStore.currentPage === 'reception'" />
    <Processing v-else-if="navStore.currentPage === 'processing'" />
    <Settings v-else-if="navStore.currentPage === 'settings'" />

    <!-- Default dashboard overview -->
    <div v-else class="space-y-6">
      <!-- KPI Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <KpiCard v-for="kpi in facilityKPIs" :key="kpi.label" :label="kpi.label" :value="kpi.value" :color="kpi.color" />
      </div>

      <!-- Kanban Board -->
      <div class="bg-white rounded-xl shadow-sm p-3 sm:p-4">
        <h3 class="text-sm sm:text-base font-semibold text-gray-800 mb-4">{{ $t('facility.processingBoard') }}</h3>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import KpiCard from '../ui/KpiCard.vue'
import KanbanColumn from '../ui/KanbanColumn.vue'
import Reception from '../pages/facility/Reception.vue'
import Processing from '../pages/facility/Processing.vue'
import Settings from '../pages/shared/Settings.vue'
import { useNavStore } from '../../stores/nav.js'
import { fetchOrders, mapOrderForList } from '../../api/orders'

const { t } = useI18n()
const navStore = useNavStore()

const orders = ref([])
const loading = ref(true)

async function loadOrders() {
  try {
    loading.value = true
    const data = await fetchOrders()
    orders.value = (data ?? []).map(mapOrderForList)
  } catch { /* stays empty */ } finally {
    loading.value = false
  }
}

onMounted(loadOrders)

// Re-fetch when navigating back to the dashboard overview
watch(() => navStore.currentPage, (page) => {
  if (page === 'dashboard') loadOrders()
})

const facilityStatuses = ['Received at Facility', 'Washing', 'Drying', 'Ironing', 'Quality Control', 'Ready for Delivery']

const facilityKPIs = computed(() => {
  const counts = {}
  for (const s of facilityStatuses) counts[s] = 0
  for (const o of orders.value) {
    if (counts[o.status] !== undefined) counts[o.status]++
  }
  const colors = { 'Received at Facility': 'blue', Washing: 'cyan', Drying: 'yellow', Ironing: 'orange', 'Quality Control': 'purple', 'Ready for Delivery': 'green' }
  const labels = { 'Received at Facility': t('facility.incoming'), Washing: t('facility.washing'), Drying: t('facility.drying'), Ironing: t('facility.ironing'), 'Quality Control': t('facility.qc'), 'Ready for Delivery': t('facility.ready') }
  return facilityStatuses.map(s => ({
    label: labels[s],
    value: counts[s],
    color: colors[s],
  }))
})

const kanbanOrders = computed(() => {
  const cols = { Received: [], Washing: [], Drying: [], Ironing: [], QC: [], Ready: [] }
  const statusMap = {
    'Received at Facility': 'Received',
    Washing: 'Washing',
    Drying: 'Drying',
    Ironing: 'Ironing',
    'Quality Control': 'QC',
    'Ready for Delivery': 'Ready',
  }
  for (const o of orders.value) {
    const col = statusMap[o.status]
    if (col) {
      cols[col].push({
        id: o.id,
        client: o.client,
        bags: o.actualBags ?? o.estimatedBags,
        priority: o.serviceType?.includes('Express') ? 'High' : 'Normal',
      })
    }
  }
  return cols
})
</script>
