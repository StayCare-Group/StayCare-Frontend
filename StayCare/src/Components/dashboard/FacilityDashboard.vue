<template>
  <div>
    <!-- Sub-pages -->
    <OrdersList v-if="navStore.currentPage === 'orders'" />
    <OrderDetail v-else-if="navStore.currentPage === 'order-detail'" />
    <OrderCreateForm v-else-if="navStore.currentPage === 'create-order'" mode="admin" />
    <Reception v-else-if="navStore.currentPage === 'reception'" />
    <Processing v-else-if="navStore.currentPage === 'processing'" />
    <RoutePlanner v-else-if="navStore.currentPage === 'routes'" />
    <Settings v-else-if="navStore.currentPage === 'settings'" />
    <ProfileAccount v-else-if="navStore.currentPage === 'profile'" />

    <!-- Default dashboard overview -->
    <LoadingPanel v-else-if="loading" />

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
import OrdersList from '../pages/shared/OrdersList.vue'
import OrderDetail from '../pages/shared/OrderDetail.vue'
import OrderCreateForm from '../pages/shared/OrderCreateForm.vue'
import Reception from '../pages/facility/Reception.vue'
import Processing from '../pages/facility/Processing.vue'
import RoutePlanner from '../pages/admin/RoutePlanner.vue'
import Settings from '../pages/shared/Settings.vue'
import ProfileAccount from '../pages/shared/ProfileAccount.vue'
import LoadingPanel from '../ui/LoadingPanel.vue'
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

const facilityStatuses = ['arrived', 'washing', 'drying', 'ironing', 'quality_check', 'ready_to_delivery']

const facilityKPIs = computed(() => {
  const counts = {}
  for (const s of facilityStatuses) counts[s] = 0
  for (const o of orders.value) {
    if (counts[o.status] !== undefined) counts[o.status]++
  }
  const colors = { arrived: 'blue', washing: 'cyan', drying: 'yellow', ironing: 'orange', quality_check: 'purple', ready_to_delivery: 'green' }
  const labels = { arrived: t('facility.incoming'), washing: t('facility.washing'), drying: t('facility.drying'), ironing: t('facility.ironing'), quality_check: t('facility.qc'), ready_to_delivery: t('facility.ready') }
  return facilityStatuses.map(s => ({
    label: labels[s],
    value: counts[s],
    color: colors[s],
  }))
})

const kanbanOrders = computed(() => {
  const cols = { Received: [], Washing: [], Drying: [], Ironing: [], QC: [], Ready: [] }
  const statusMap = {
    arrived: 'Received',
    washing: 'Washing',
    drying: 'Drying',
    ironing: 'Ironing',
    quality_check: 'QC',
    ready_to_delivery: 'Ready',
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
