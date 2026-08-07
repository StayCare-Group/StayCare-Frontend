<template>
  <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        {{ $t('properties.title', { count: properties.length }) }}
      </h3>
      <button
        @click="toggleForm"
        class="text-xs font-semibold text-brand-700 hover:underline"
      >
        {{ showAddProperty ? $t('common.cancel') : $t('properties.addCta') }}
      </button>
    </div>

    <form
      v-if="showAddProperty"
      @submit.prevent="saveProperty"
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
          {{ addingProp ? $t('common.saving') : (editingPropertyId ? $t('common.save') : $t('properties.add')) }}
        </AppButton>
        <AppButton type="button" size="sm" variant="secondary" @click="cancelForm">
          {{ $t('common.cancel') }}
        </AppButton>
      </div>
      <p v-if="propError" class="text-xs text-red-500">{{ propError }}</p>
    </form>

    <div v-if="properties.length" class="divide-y divide-gray-100">
      <div v-for="p in properties" :key="propertyIdOf(p)" class="py-3 space-y-2">
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
              @click="toggleMap(propertyIdOf(p))"
              class="text-xs text-brand-700 hover:underline"
            >
              {{ expandedMap === propertyIdOf(p) ? $t('properties.hideMap') : $t('properties.showMap') }}
            </button>
            <button
              @click="startEdit(p)"
              class="text-xs text-brand-700 hover:underline"
            >{{ $t('admin.edit') }}</button>
            <button
              @click="deleteProperty(propertyIdOf(p))"
              class="text-xs text-red-500 hover:text-red-700"
            >{{ $t('admin.delete') }}</button>
          </div>
        </div>
        <MiniMap v-if="expandedMap === propertyIdOf(p) && p.lat && p.lng" :lat="p.lat" :lng="p.lng" height="180px" />
      </div>
    </div>
    <p v-else class="text-xs text-gray-400">{{ $t('properties.empty') }}</p>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '../../../stores/ui.js'
import {
  getPropertiesByUserId,
  createPropertyForUser,
  updateProperty,
  deleteProperty as deletePropertyById,
} from '../../../api/properties'
import MapPicker from '../../ui/MapPicker.vue'
import MiniMap from '../../ui/MiniMap.vue'
import AppButton from '../../ui/AppButton.vue'
import { formatApiErrorMessage } from '../../../utils/errors'

const { t } = useI18n()
const ui = useUiStore()

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
const editingPropertyId = ref(null)
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
  editingPropertyId.value = null
}

function toggleForm() {
  if (showAddProperty.value) {
    cancelForm()
    return
  }
  showAddProperty.value = true
}

function cancelForm() {
  showAddProperty.value = false
  propError.value = ''
  resetForm()
}

async function loadClientProperties() {
  if (!props.clientId) {
    properties.value = []
    return
  }
  try {
    const data = await getPropertiesByUserId(props.clientId)
    properties.value = Array.isArray(data) ? data : (data?.properties ?? [])
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

function propertyIdOf(property) {
  return property?._id ?? property?.id ?? null
}

function startEdit(property) {
  editingPropertyId.value = propertyIdOf(property)
  newProp.value = {
    property_name: property.property_name ?? '',
    address: property.address ?? '',
    city: property.city ?? '',
    area: property.area ?? '',
    access_notes: property.access_notes ?? '',
    lat: property.lat ?? null,
    lng: property.lng ?? null,
  }
  propError.value = ''
  showAddProperty.value = true
}

async function saveProperty() {
  if (addingProp.value || !props.clientId) return
  if (!newProp.value.property_name || !newProp.value.property_name.trim()) {
    propError.value = t('validation.fillRequiredFields')
    return
  }
  addingProp.value = true
  propError.value = ''
  try {
    if (editingPropertyId.value) {
      await updateProperty(editingPropertyId.value, newProp.value)
    } else {
      await createPropertyForUser(props.clientId, newProp.value)
    }
    await loadClientProperties()
    cancelForm()
  } catch (err) {
    propError.value = formatApiErrorMessage(err, t('properties.addFailed'), t)
  } finally {
    addingProp.value = false
  }
}

async function deleteProperty(propertyId) {
  if (!propertyId) return
  if (!confirm(t('properties.deleteConfirm'))) return
  try {
    await deletePropertyById(propertyId)
    await loadClientProperties()
  } catch (err) {
    ui.showError(err?.message || t('properties.deleteFailed'))
  }
}

watch(() => props.clientId, loadClientProperties)
onMounted(loadClientProperties)
</script>
