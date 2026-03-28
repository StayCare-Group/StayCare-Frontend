<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <button @click="navStore.goBack('users')" class="text-white hover:text-gray-400">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <h2 class="text-lg font-semibold text-white">{{ client?.company_name ?? 'Client Details' }}</h2>
    </div>

    <p v-if="loading" class="text-sm text-gray-400">Loading...</p>

    <template v-if="client && !loading">
      <!-- Client Info -->
      <div class="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Company Info</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><span class="text-gray-500">Company</span><p class="font-medium text-gray-800">{{ client.company_name }}</p></div>
          <div><span class="text-gray-500">Contact Person</span><p class="font-medium text-gray-800">{{ client.contact_person }}</p></div>
          <div><span class="text-gray-500">Email</span><p class="font-medium text-gray-800">{{ client.email }}</p></div>
          <div><span class="text-gray-500">Phone</span><p class="font-medium text-gray-800">{{ client.phone }}</p></div>
          <div><span class="text-gray-500">VAT Number</span><p class="font-medium text-gray-800">{{ client.vat_number }}</p></div>
          <div><span class="text-gray-500">Billing Address</span><p class="font-medium text-gray-800">{{ client.billing_address }}</p></div>
          <div><span class="text-gray-500">Payment Terms</span><p class="font-medium text-gray-800">{{ client.credits_terms_days }} days</p></div>
          <div><span class="text-gray-500">Pricing Tier</span><p class="font-medium text-gray-800">{{ client.pricing_tier }}</p></div>
        </div>
      </div>

      <!-- Properties -->
      <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Properties ({{ client.properties?.length ?? 0 }})</h3>
          <button @click="showAddProperty = !showAddProperty"
            class="text-xs font-semibold text-brand-700 hover:underline">
            {{ showAddProperty ? 'Cancel' : '+ Add Property' }}
          </button>
        </div>

        <!-- Add property form -->
        <form v-if="showAddProperty" @submit.prevent="addProperty" class="border border-gray-200 rounded-lg p-4 space-y-3">
          <input v-model="newProp.property_name" placeholder="Property name" required
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none" />

          <!-- Map picker -->
          <MapPicker :lat="newProp.lat" :lng="newProp.lng" height="280px" @update="onMapPick" />

          <!-- Auto-filled address fields (editable) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input v-model="newProp.address" placeholder="Address"
              class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none" />
            <input v-model="newProp.city" placeholder="City"
              class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none" />
            <input v-model="newProp.area" placeholder="Area / Zone"
              class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none" />
            <input v-model="newProp.access_notes" placeholder="Access notes (optional)"
              class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none" />
          </div>

          <div class="flex gap-2">
            <AppButton type="submit" size="sm" :loading="addingProp">
              {{ addingProp ? 'Adding...' : 'Add' }}
            </AppButton>
          </div>
          <p v-if="propError" class="text-xs text-red-500">{{ propError }}</p>
        </form>

        <!-- Properties list -->
        <div v-if="client.properties?.length" class="divide-y divide-gray-100">
          <div v-for="p in client.properties" :key="p._id" class="py-3 space-y-2">
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-medium text-gray-800">{{ p.property_name }}</p>
                  <span v-if="p.lat && p.lng" class="text-green-500 text-xs" title="Has map coordinates">&#x1f4cd;</span>
                </div>
                <p class="text-xs text-gray-500">{{ p.address }}, {{ p.city }} ({{ p.area }})</p>
                <p v-if="p.access_notes" class="text-xs text-gray-400 mt-0.5">{{ p.access_notes }}</p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button v-if="p.lat && p.lng" @click="toggleMap(p._id)"
                  class="text-xs text-brand-700 hover:underline">
                  {{ expandedMap === p._id ? 'Hide Map' : 'Show Map' }}
                </button>
                <button @click="deleteProperty(p._id)" class="text-xs text-red-500 hover:text-red-700">Delete</button>
              </div>
            </div>
            <MiniMap v-if="expandedMap === p._id && p.lat && p.lng" :lat="p.lat" :lng="p.lng" height="180px" />
          </div>
        </div>
        <p v-else class="text-xs text-gray-400">No properties added yet.</p>
      </div>

      <!-- Client Orders -->
      <div class="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Orders ({{ clientOrders.length }})</h3>
        <div v-if="clientOrders.length" class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th class="px-4 py-2 font-medium">Order</th>
                <th class="px-4 py-2 font-medium">Date</th>
                <th class="px-4 py-2 font-medium">Status</th>
                <th class="px-4 py-2 font-medium">Total</th>
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
        <p v-else class="text-xs text-gray-400">No orders found.</p>
      </div>
    </template>

    <p v-if="error" class="text-sm text-red-500 bg-white rounded-xl shadow-sm p-5">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useNavStore } from '../../../stores/nav.js'
import { fetchClientById } from '../../../api/clients'
import { fetchOrders, mapOrderForList } from '../../../api/orders'
import { apiFetch } from '../../../api/client'
import StatusBadge from '../../ui/StatusBadge.vue'
import AppButton from '../../ui/AppButton.vue'
import MapPicker from '../../ui/MapPicker.vue'
import MiniMap from '../../ui/MiniMap.vue'

const navStore = useNavStore()

const client = ref(null)
const clientOrders = ref([])
const loading = ref(true)
const error = ref('')

const showAddProperty = ref(false)
const addingProp = ref(false)
const propError = ref('')
const newProp = ref({ property_name: '', address: '', city: '', area: '', access_notes: '', lat: null, lng: null })
const expandedMap = ref(null)

onMounted(async () => {
  try {
    const id = navStore.selectedId
    if (!id) {
      error.value = 'No client selected.'
      return
    }

    const [clientData, ordersData] = await Promise.all([
      fetchClientById(id),
      fetchOrders({ client: id }).catch(() => []),
    ])

    client.value = clientData
    clientOrders.value = (ordersData ?? []).map(mapOrderForList)
  } catch (err) {
    error.value = err?.message || 'Failed to load client details.'
  } finally {
    loading.value = false
  }
})

function onMapPick(s) {
  if (s.address) newProp.value.address = s.address
  if (s.city) newProp.value.city = s.city
  if (s.area) newProp.value.area = s.area
  newProp.value.lat = s.lat
  newProp.value.lng = s.lng
}

function toggleMap(id) {
  expandedMap.value = expandedMap.value === id ? null : id
}

async function addProperty() {
  if (addingProp.value) return
  addingProp.value = true
  propError.value = ''
  try {
    await apiFetch(`/api/clients/${client.value._id}/properties`, {
      method: 'POST',
      body: JSON.stringify(newProp.value),
    })
    const updated = await fetchClientById(client.value._id)
    client.value = updated
    newProp.value = { property_name: '', address: '', city: '', area: '', access_notes: '', lat: null, lng: null }
    showAddProperty.value = false
  } catch (err) {
    propError.value = err?.message || 'Failed to add property.'
  } finally {
    addingProp.value = false
  }
}

async function deleteProperty(propertyId) {
  if (!confirm('Delete this property?')) return
  try {
    await apiFetch(`/api/clients/${client.value._id}/properties/${propertyId}`, {
      method: 'DELETE',
    })
    const updated = await fetchClientById(client.value._id)
    client.value = updated
  } catch (err) {
    alert(err?.message || 'Failed to delete property.')
  }
}
</script>
