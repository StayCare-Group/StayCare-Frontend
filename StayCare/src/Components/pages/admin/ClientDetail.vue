<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <button @click="navStore.goBack('users')" class="text-brand-700 hover:text-gray-400">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <h2 class="text-lg font-semibold text-brand-700">{{ client?.company_name ?? $t('clientDetail.title') }}</h2>
    </div>

    <LoadingPanel v-if="loading" :label="$t('common.loading')" />

    <template v-if="client && !loading">
      <!-- Client Info -->
      <div class="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{{ $t('clientDetail.companyInfo') }}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><span class="text-gray-500">{{ $t('clientDetail.company') }}</span><p class="font-medium text-gray-800">{{ client.company_name }}</p></div>
          <div><span class="text-gray-500">{{ $t('clientDetail.contactPerson') }}</span><p class="font-medium text-gray-800">{{ client.contact_person }}</p></div>
          <div><span class="text-gray-500">{{ $t('common.email') }}</span><p class="font-medium text-gray-800">{{ client.email }}</p></div>
          <div><span class="text-gray-500">{{ $t('settings.phone') }}</span><p class="font-medium text-gray-800">{{ client.phone }}</p></div>
          <div><span class="text-gray-500">{{ $t('clientDetail.vatNumber') }}</span><p class="font-medium text-gray-800">{{ client.vat_number }}</p></div>
          <div><span class="text-gray-500">{{ $t('clientDetail.billingAddress') }}</span><p class="font-medium text-gray-800">{{ client.billing_address }}</p></div>
          <div><span class="text-gray-500">{{ $t('clientDetail.paymentTerms') }}</span><p class="font-medium text-gray-800">{{ client.credits_terms_days }} {{ $t('clientDetail.days') }}</p></div>
          <div><span class="text-gray-500">{{ $t('clientDetail.pricingTier') }}</span><p class="font-medium text-gray-800">{{ client.pricing_tier }}</p></div>
        </div>
      </div>

      <ClientPropertiesManager :client-id="client._id" />

      <!-- Client Orders -->
      <div class="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{{ $t('clientDetail.ordersCount', { count: clientOrders.length }) }}</h3>
        <div v-if="clientOrders.length" class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th class="px-4 py-2 font-medium">{{ $t('common.order') }}</th>
                <th class="px-4 py-2 font-medium">{{ $t('client.date') }}</th>
                <th class="px-4 py-2 font-medium">{{ $t('common.status') }}</th>
                <th class="px-4 py-2 font-medium">{{ $t('client.total') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="o in clientOrders" :key="o._id" class="hover:bg-gray-50 cursor-pointer"
                @click="navStore.goToDetail('order-detail', o._id)">
                <td class="px-4 py-2 font-medium text-gray-800">{{ o.id }}</td>
                <td class="px-4 py-2 text-gray-500">{{ o.pickupDate }}</td>
                <td class="px-4 py-2"><StatusBadge :status="o.status" /></td>
                <td class="px-4 py-2 font-medium">&euro;{{ (o.total ?? 0).toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-xs text-gray-400">{{ $t('clientDetail.noOrders') }}</p>
      </div>
    </template>

    <p v-if="error" class="text-sm text-red-500 bg-white rounded-xl shadow-sm p-5">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNavStore } from '../../../stores/nav.js'
import { fetchClientById } from '../../../api/clients'
import { fetchOrders, mapOrderForList } from '../../../api/orders'
import StatusBadge from '../../ui/StatusBadge.vue'
import LoadingPanel from '../../ui/LoadingPanel.vue'
import ClientPropertiesManager from '../shared/ClientPropertiesManager.vue'

const { t } = useI18n()
const navStore = useNavStore()

const client = ref(null)
const clientOrders = ref([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const id = navStore.selectedId
    if (!id) {
      error.value = t('clientDetail.noClientSelected')
      return
    }

    const [clientData, ordersData] = await Promise.all([
      fetchClientById(id),
      fetchOrders({ client: id }).catch(() => []),
    ])

    client.value = clientData
    clientOrders.value = (ordersData ?? []).map(mapOrderForList)
  } catch (err) {
    error.value = err?.message || t('clientDetail.loadFailed')
  } finally {
    loading.value = false
  }
})

</script>
