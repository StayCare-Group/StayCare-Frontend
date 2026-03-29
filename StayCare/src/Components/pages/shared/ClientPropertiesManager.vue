<template>
  <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        {{ $t('properties.title', { count: properties.length }) }}
      </h3>
      <button
        @click="showAddProperty = !showAddProperty"
        class="text-xs font-semibold text-brand-700 hover:underline"
      >
        {{ showAddProperty ? $t('common.cancel') : $t('properties.addCta') }}
      </button>
    </div>

    <form
      v-if="showAddProperty"
      @submit.prevent="addProperty"
      class="border border-gray-200 rounded-lg p-4 space-y-3"
    >
      <input
        v-model="newProp.property_name"
        :placeholder="$t('properties.propertyName')"
        required
        class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
      />

      <MapPicker :lat="newProp.lat" :lng="newProp.lng" height="280px" @update="onMapPick" />

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          v-model="newProp.address"
          :placeholder="$t('properties.address')"
          class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
        />
        <input
          v-model="newProp.city"
          :placeholder="$t('properties.city')"
          class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
        />
        <input
          v-model="newProp.area"
          :placeholder="$t('properties.area')"
          class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
        />
        <input
          v-model="newProp.access_notes"
          :placeholder="$t('properties.accessNotes')"
          class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
        />
      </div>

      <div class="flex gap-2">
        <AppButton type="submit" size="sm" :loading="addingProp">
          {{ addingProp ? $t('properties.adding') : $t('properties.add') }}
        </AppButton>
      </div>
      <p v-if="propError" class="text-xs text-red-500">{{ propError }}</p>
    </form>

    <div v-if="properties.length" class="divide-y divide-gray-100">
      <div v-for="p in properties" :key="p._id" class="py-3 space-y-2">
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="text-sm font-medium text-gray-800">{{ p.property_name }}</p>
              <span v-if="p.lat && p.lng" class="text-green-500 text-xs" :title="$t('properties.hasCoordinates')">&#x1f4cd;</span>
            </div>
            <p class="text-xs text-gray-500">{{ p.address }}, {{ p.city }} ({{ p.area }})</p>
            <p v-if="p.access_notes" class="text-xs text-gray-400 mt-0.5">{{ p.access_notes }}</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button
              v-if="p.lat && p.lng"
              @click="toggleMap(p._id)"
              class="text-xs text-brand-700 hover:underline"
            >
              {{ expandedMap === p._id ? $t('properties.hideMap') : $t('properties.showMap') }}
            </button>
            <button
              @click="deleteProperty(p._id)"
              class="text-xs text-red-500 hover:text-red-700"
            >{{ $t('admin.delete') }}</button>
          </div>
        </div>
        <MiniMap v-if="expandedMap === p._id && p.lat && p.lng" :lat="p.lat" :lng="p.lng" height="180px" />
      </div>
    </div>
    <p v-else class="text-xs text-gray-400">{{ $t('properties.empty') }}</p>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchClientById } from '../../../api/clients'
import { apiFetch } from '../../../api/client'
import MapPicker from '../../ui/MapPicker.vue'
import MiniMap from '../../ui/MiniMap.vue'
import AppButton from '../../ui/AppButton.vue'

const { t } = useI18n()

const props = defineProps({
  clientId: {
    type: String,
    required: true,
  },
})

const properties = ref([])
const showAddProperty = ref(false)
const addingProp = ref(false)
const propError = ref('')
const expandedMap = ref(null)
const newProp = ref({
  property_name: '',
  address: '',
  city: '',
  area: '',
  access_notes: '',
  lat: null,
  lng: null,
})

function resetForm() {
  newProp.value = {
    property_name: '',
    address: '',
    city: '',
    area: '',
    access_notes: '',
    lat: null,
    lng: null,
  }
}

async function loadClientProperties() {
  if (!props.clientId) {
    properties.value = []
    return
  }
  try {
    const client = await fetchClientById(props.clientId)
    properties.value = client?.properties ?? []
  } catch {
    properties.value = []
  }
}

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
  if (addingProp.value || !props.clientId) return
  addingProp.value = true
  propError.value = ''
  try {
    await apiFetch(`/api/clients/${props.clientId}/properties`, {
      method: 'POST',
      body: JSON.stringify(newProp.value),
    })
    await loadClientProperties()
    resetForm()
    showAddProperty.value = false
  } catch (err) {
    propError.value = err?.message || t('properties.addFailed')
  } finally {
    addingProp.value = false
  }
}

async function deleteProperty(propertyId) {
  if (!propertyId || !props.clientId) return
  if (!confirm(t('properties.deleteConfirm'))) return
  try {
    await apiFetch(`/api/clients/${props.clientId}/properties/${propertyId}`, {
      method: 'DELETE',
    })
    await loadClientProperties()
  } catch (err) {
    alert(err?.message || t('properties.deleteFailed'))
  }
}

watch(() => props.clientId, loadClientProperties)
onMounted(loadClientProperties)
</script>
