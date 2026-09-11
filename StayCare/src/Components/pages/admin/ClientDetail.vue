<template>
  <div class="space-y-6">
    <TitleHeader
      :title="$t('clientDetail.title')"
      :on-back="() => navStore.goBack('users')"
    />

    <LoadingPanel v-if="loading" :label="$t('common.loading')" />

    <template v-if="!loading && client">
      <!-- Client Info -->
      <div class="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <!-- Section header with edit/save/cancel actions -->
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">{{ $t('clientDetail.companyInfo') }}</h3>
          <div class="flex items-center gap-2">
            <button
              v-if="!isEditing"
              type="button"
              class="text-xs font-semibold text-brand-700 hover:underline"
              @click="startEdit"
            >
              {{ $t('clientDetail.editProfile') }}
            </button>
            <template v-else>
              <AppButton
                type="button"
                variant="secondary"
                size="sm"
                :disabled="saving"
                @click="cancelEdit"
              >
                {{ $t('common.cancel') }}
              </AppButton>
              <AppButton
                type="button"
                size="sm"
                :loading="saving"
                @click="saveClientProfile"
              >
                {{ $t('common.save') }}
              </AppButton>
            </template>
          </div>
        </div>
        <!-- Profile fields — ProfileField elimina el patrón label+input repetido 6 veces -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <ProfileField
            :label="$t('clientDetail.company')"
            :model-value="editForm.name"
            :display-value="client.company_name ?? client.name"
            :is-editing="isEditing"
            @update:model-value="editForm.name = $event"
          />

          <ProfileField
            :label="$t('clientDetail.contactPerson')"
            :model-value="editForm.contact_person"
            :display-value="client.contact_person"
            :is-editing="isEditing"
            @update:model-value="editForm.contact_person = $event"
          />

          <ProfileField
            :label="$t('common.email')"
            :model-value="editForm.email"
            :display-value="client.email"
            :is-editing="isEditing"
            type="email"
            @update:model-value="editForm.email = $event"
          />

          <ProfileField
            :label="$t('settings.phone')"
            :model-value="editForm.phone"
            :display-value="client.phone"
            :is-editing="isEditing"
            @update:model-value="editForm.phone = $event"
          />

          <ProfileField
            :label="$t('clientDetail.billingAddress')"
            :model-value="editForm.billing_address"
            :display-value="client.billing_address"
            :is-editing="isEditing"
            @update:model-value="editForm.billing_address = $event"
          />

          <ProfileField
            :label="$t('clientDetail.vatNumber')"
            :model-value="editForm.vat_number"
            :display-value="client.vat_number"
            :is-editing="isEditing"
            @update:model-value="editForm.vat_number = $event"
          />

          <ProfileField
            :label="$t('clientDetail.paymentTerms')"
            :model-value="editForm.credits_terms_days"
            :display-value="`${client.credits_terms_days ?? 0} ${$t('clientDetail.days')}`"
            :is-editing="isEditing"
            type="number"
            min="1"
            @update:model-value="editForm.credits_terms_days = Number($event)"
          />

          <!-- Pricing tier: control personalizado via named slot -->
          <ProfileField
            :label="$t('clientDetail.pricingTier')"
            :display-value="client.pricing_tier"
            :is-editing="isEditing"
          >
            <template #input>
              <select
                v-model="editForm.pricing_tier"
                class="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none bg-white"
              >
                <option value="standard">standard</option>
                <option value="premium">premium</option>
                <option value="enterprise">enterprise</option>
              </select>
            </template>
          </ProfileField>
        </div>
      </div>

      <!-- Change Password Section -->
      <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {{ $t('clientDetail.changePassword') }}
        </h3>
        <form @submit.prevent="changeClientPassword" class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <label class="block text-gray-500 mb-1">{{ $t('clientDetail.newPassword') }}</label>
            <input
              v-model="passwordForm.new_password"
              type="password"
              minlength="6"
              autocomplete="new-password"
              placeholder="••••••••"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label class="block text-gray-500 mb-1">{{ $t('clientDetail.confirmNewPassword') }}</label>
            <input
              v-model="passwordForm.confirm_password"
              type="password"
              minlength="6"
              autocomplete="new-password"
              placeholder="••••••••"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-400 focus:border-transparent outline-none"
            />
          </div>
          <div class="sm:col-span-2 flex justify-end">
            <AppButton
              type="submit"
              size="sm"
              :loading="savingPassword"
              :disabled="savingPassword || !passwordForm.new_password"
            >
              {{ $t('clientDetail.changePassword') }}
            </AppButton>
          </div>
        </form>
      </div>

      <!-- clientId es computed: se pasa una sola vez a ambos managers -->
      <ClientPropertiesManager :client-id="clientId" />
      <ClientPriceListManager :client-id="clientId" />

      <!-- Client Orders — usa DataTable igual que OrdersList -->
      <DataTable
        :title="$t('clientDetail.ordersCount', { count: clientOrders.length })"
        :headers="orderHeaders"
        :items="clientOrders"
        :empty-text="$t('clientDetail.noOrders')"
        row-key="_id"
        clickable
        min-width="600px"
        @row-click="o => navStore.goToDetail('order-detail', o._id)"
      >
        <template #cell-status="{ value }"><StatusBadge :status="value" /></template>
        <template #cell-total="{ value }">&euro;{{ (value ?? 0).toFixed(2) }}</template>
      </DataTable>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNavStore } from '../../../stores/nav.js'
import { fetchUserById, updateUserById } from '../../../api/users'
import { fetchAllOrders } from '../../../api/orders'
import { mapOrderForList } from '@/utils/orderMappers'
import TitleHeader from '../../ui/TitleHeader.vue'
import StatusBadge from '../../ui/StatusBadge.vue'
import LoadingPanel from '../../ui/LoadingPanel.vue'
import DataTable from '../../ui/DataTable.vue'
import AppButton from '../../ui/AppButton.vue'
import ProfileField from '../../ui/ProfileField.vue'
import ClientPropertiesManager from '../shared/ClientPropertiesManager.vue'
import ClientPriceListManager from '../shared/ClientPriceListManager.vue'
import { useUiStore } from '../../../stores/ui.js'
import { formatApiErrorMessage } from '../../../utils/errors'

const { t } = useI18n()
const navStore = useNavStore()
const ui = useUiStore()

const client = ref(null)
const clientOrders = ref([])
const loading = ref(true)
const isEditing = ref(false)
const saving = ref(false)
const editForm = ref({
  name: '',
  email: '',
  contact_person: '',
  phone: '',
  billing_address: '',
  vat_number: '',
  credits_terms_days: 30,
  pricing_tier: 'standard',
})

const passwordForm = ref({
  new_password: '',
  confirm_password: '',
})
const savingPassword = ref(false)

// Calcula el userId una sola vez; evita la cadena repetida en cada función
const clientId = computed(() =>
  client.value
    ? String(client.value.id ?? client.value._id ?? client.value.user_id ?? '')
    : ''
)

// Columnas de la tabla de órdenes — definidas una sola vez, fuera del template
const orderHeaders = computed(() => [
  { key: 'id',           label: t('common.order') },
  { key: 'propertyName', label: t('facility.property') },
  { key: 'pickupDate',   label: t('client.date') },
  { key: 'status',       label: t('common.status') },
  { key: 'total',        label: t('client.total') },
])

function fillEditForm() {
  if (!client.value) return
  editForm.value = {
    name: client.value.company_name ?? client.value.name ?? '',
    email: client.value.email ?? '',
    contact_person: client.value.contact_person ?? '',
    phone: client.value.phone ?? '',
    billing_address: client.value.billing_address ?? '',
    vat_number: client.value.vat_number ?? '',
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
    const payload = {
      name: editForm.value.name.trim() || undefined,
      email: editForm.value.email.trim() || undefined,
      phone: editForm.value.phone.trim() || undefined,
      client_profile: {
        contact_person: editForm.value.contact_person,
        billing_address: editForm.value.billing_address,
        vat_number: editForm.value.vat_number,
        credits_terms_days: Number(editForm.value.credits_terms_days),
        pricing_tier: editForm.value.pricing_tier,
      },
    }
    const response = await updateUserById(clientId.value, payload)
    client.value = normalizeClientDetailResponse(response)
    fillEditForm()
    isEditing.value = false
    ui.showSuccess(t('clientDetail.updateSuccess'))
  } catch (err) {
    ui.showError(formatApiErrorMessage(err, t('admin.errorUpdateClient'), t))
  } finally {
    saving.value = false
  }
}

async function changeClientPassword() {
  const { new_password, confirm_password } = passwordForm.value
  if (!new_password) return
  if (new_password.length < 6) {
    ui.showError(t('clientDetail.passwordTooShort'))
    return
  }
  if (new_password !== confirm_password) {
    ui.showError(t('clientDetail.passwordMismatch'))
    return
  }

  savingPassword.value = true
  try {
    await updateUserById(clientId.value, { password: new_password })
    passwordForm.value.new_password = ''
    passwordForm.value.confirm_password = ''
    ui.showSuccess(t('clientDetail.passwordUpdated'))
  } catch (err) {
    ui.showError(formatApiErrorMessage(err, t('admin.errorUpdateClient'), t))
  } finally {
    savingPassword.value = false
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
    user_id: userId,
    name: user.name ?? '',
    company_name: user.name ?? '',
    email: user.email ?? '',
    phone: user.phone ?? null,
    language: user.language ?? 'en',
    role: user.role ?? 'client',
    is_active: user.is_active,
    contact_person: profile.contact_person ?? '',
    billing_address: profile.billing_address ?? '',
    vat_number: profile.vat_number ?? '',
    credits_terms_days: profile.credits_terms_days ?? 30,
    pricing_tier: profile.pricing_tier ?? 'standard',
  }
}

async function loadClientData() {
  loading.value = true
  try {
    const id = navStore.selectedId
    if (!id) {
      ui.showError(t('clientDetail.noClientSelected'))
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
    client.value = null
    ui.showError(formatApiErrorMessage(err, t('clientDetail.loadFailed'), t))
  } finally {
    loading.value = false
  }
}

onMounted(loadClientData)
</script>
