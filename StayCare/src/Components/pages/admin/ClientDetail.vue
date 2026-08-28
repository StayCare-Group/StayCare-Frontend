<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <button @click="navStore.goBack('users')" class="text-brand-700 hover:text-gray-400">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <h2 class="text-lg font-semibold text-brand-700">{{ $t('clientDetail.title') }}</h2>
    </div>

    <LoadingPanel v-if="loading && !client" :label="$t('common.loading')" />

    <template v-if="client">
      <!-- Client Info -->
      <div class="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{{ $t('clientDetail.companyInfo') }}</h3>
          <div class="flex items-center gap-2">
            <button
              v-if="!isEditing"
              type="button"
              class="text-xs font-semibold text-brand-700 hover:underline"
              @click="startEdit"
            >
              Edit profile
            </button>
            <template v-else>
              <button
                type="button"
                class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                @click="cancelEdit"
              >
                {{ $t('common.cancel') }}
              </button>
              <button
                type="button"
                class="px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-700 text-white hover:bg-brand-600 transition disabled:opacity-60"
                :disabled="saving"
                @click="saveClientProfile"
              >
                {{ saving ? $t('common.saving') : $t('common.save') }}
              </button>
            </template>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500">{{ $t('clientDetail.company') }}</span>
            <p class="font-medium text-gray-800">{{ client.company_name ?? client.name ?? '—' }}</p>
          </div>

          <div>
            <span class="text-gray-500">{{ $t('clientDetail.contactPerson') }}</span>
            <input
              v-if="isEditing"
              v-model="editForm.contact_person"
              type="text"
              class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
            />
            <p v-else class="font-medium text-gray-800">{{ client.contact_person ?? '—' }}</p>
          </div>

          <div>
            <span class="text-gray-500">{{ $t('common.email') }}</span>
            <p class="font-medium text-gray-800">{{ client.email ?? '—' }}</p>
          </div>

          <div>
            <span class="text-gray-500">{{ $t('settings.phone') }}</span>
            <input
              v-if="isEditing"
              v-model="editForm.phone"
              type="text"
              class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
            />
            <p v-else class="font-medium text-gray-800">{{ client.phone ?? '—' }}</p>
          </div>

          <div>
            <span class="text-gray-500">{{ $t('clientDetail.billingAddress') }}</span>
            <p class="font-medium text-gray-800">{{ client.billing_address ?? '—' }}</p>
          </div>

          <div>
            <span class="text-gray-500">{{ $t('clientDetail.vatNumber') }}</span>
            <p class="font-medium text-gray-800">{{ client.vat_number ?? '—' }}</p>
          </div>

          <div>
            <span class="text-gray-500">{{ $t('clientDetail.paymentTerms') }}</span>
            <template v-if="isEditing">
              <input
                v-model.number="editForm.credits_terms_days"
                type="number"
                min="1"
                class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
              />
            </template>
            <p v-else class="font-medium text-gray-800">{{ client.credits_terms_days ?? '0' }} {{ $t('clientDetail.days') }}</p>
          </div>

          <div>
            <span class="text-gray-500">{{ $t('clientDetail.pricingTier') }}</span>
            <template v-if="isEditing">
              <select
                v-model="editForm.pricing_tier"
                class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none bg-white"
              >
                <option value="standard">standard</option>
                <option value="premium">premium</option>
                <option value="enterprise">enterprise</option>
              </select>
            </template>
            <p v-else class="font-medium text-gray-800">{{ client.pricing_tier ?? '—' }}</p>
          </div>
        </div>
      </div>

      <LoadingPanel v-if="loading" :label="$t('common.loading')" />

      <template v-if="!loading">
        <ClientPropertiesManager :client-id="String(client._id ?? client.id ?? client.user_id ?? '')" />

        <!-- Client Orders -->
        <div class="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{{ $t('clientDetail.ordersCount', { count: clientOrders.length }) }}</h3>
          <div v-if="clientOrders.length" class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th class="px-4 py-2 font-medium">{{ $t('common.order') }}</th>
                  <th class="px-4 py-2 font-medium">{{ $t('facility.property') }}</th>
                  <th class="px-4 py-2 font-medium">{{ $t('client.date') }}</th>
                  <th class="px-4 py-2 font-medium">{{ $t('common.status') }}</th>
                  <th class="px-4 py-2 font-medium">{{ $t('client.total') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="o in clientOrders" :key="o._id" class="hover:bg-gray-50 cursor-pointer"
                  @click="navStore.goToDetail('order-detail', o._id)">
                  <td class="px-4 py-2 font-medium text-gray-800">{{ o.id }}</td>
                  <td class="px-4 py-2 text-gray-600">{{ o.propertyName || o.property_name || '—' }}</td>
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
    </template>

    <p v-if="error" class="text-sm text-red-500 bg-white rounded-xl shadow-sm p-5">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNavStore } from '../../../stores/nav.js'
import { fetchUserById, updateUserById } from '../../../api/users'
import { fetchAllOrders, mapOrderForList } from '../../../api/orders'
import StatusBadge from '../../ui/StatusBadge.vue'
import LoadingPanel from '../../ui/LoadingPanel.vue'
import ClientPropertiesManager from '../shared/ClientPropertiesManager.vue'
import { useUiStore } from '../../../stores/ui.js'

const { t } = useI18n()
const navStore = useNavStore()
const ui = useUiStore()

const client = ref(null)
const clientOrders = ref([])
const loading = ref(true)
const error = ref('')
const isEditing = ref(false)
const saving = ref(false)
const editForm = ref({
  contact_person: '',
  phone: '',
  credits_terms_days: 30,
  pricing_tier: 'standard',
})

function fillEditForm() {
  if (!client.value) return
  editForm.value = {
    contact_person: client.value.contact_person ?? '',
    phone: client.value.phone ?? '',
    credits_terms_days: Number(client.value.credits_terms_days ?? 30),
    pricing_tier: client.value.pricing_tier ?? 'standard',
  }
}

function startEdit() {
  fillEditForm()
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
  fillEditForm()
}

async function saveClientProfile() {
  if (!client.value || saving.value) return
  saving.value = true
  try {
    const userId = String(client.value.id ?? client.value._id ?? client.value.user_id ?? '')
    const payload = {
      phone: editForm.value.phone,
      client_profile: {
        contact_person: editForm.value.contact_person,
        credits_terms_days: Number(editForm.value.credits_terms_days),
        pricing_tier: editForm.value.pricing_tier,
      },
    }
    await updateUserById(userId, payload)

    client.value = {
      ...client.value,
      phone: editForm.value.phone,
      contact_person: editForm.value.contact_person,
      credits_terms_days: Number(editForm.value.credits_terms_days),
      pricing_tier: editForm.value.pricing_tier,
    }
    isEditing.value = false
    ui.showSuccess('Client updated')
  } catch (err) {
    ui.showError(err?.message || t('admin.errorUpdateClient'))
  } finally {
    saving.value = false
  }
}

function normalizeClientDetailResponse(payload) {
  const user = payload?.user ?? payload ?? {}
  const profile = payload?.client_profile ?? {}

  const userId = user.id ?? user._id ?? profile.user_id ?? null

  return {
    ...profile,
    ...user,
    id: userId,
    _id: userId,
    user_id: userId,
    name: user.name ?? '',
    email: user.email ?? '',
    phone: user.phone ?? null,
    language: user.language ?? 'en',
    role: user.role ?? 'client',
    is_active: user.is_active,
  }
}

onMounted(async () => {
  try {
    const id = navStore.selectedId
    if (!id) {
      error.value = t('clientDetail.noClientSelected')
      loading.value = false
      return
    }

    const [clientData, ordersData] = await Promise.all([
      fetchUserById(id),
      fetchAllOrders({ client_id: id }).catch(() => []),
    ])

    client.value = normalizeClientDetailResponse(clientData)
    fillEditForm()
    clientOrders.value = (ordersData ?? []).map(mapOrderForList)
  } catch (err) {
    error.value = err?.message || t('clientDetail.loadFailed')
  } finally {
    loading.value = false
  }
})

</script>
