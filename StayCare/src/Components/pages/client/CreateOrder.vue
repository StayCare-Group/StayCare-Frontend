<template>
  <div class="space-y-6 max-w-3xl">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <button @click="navStore.goBack('orders')" class="text-gray-400 hover:text-gray-600">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <h2 class="text-lg font-semibold text-gray-800">Create New Order</h2>
    </div>

    <form @submit.prevent="submitOrder" class="space-y-6">
      <!-- Pickup Details -->
      <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Pickup Details</h3>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">Pickup Address</label>
          <input v-model="form.pickupAddress" type="text" required
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF56B0] focus:border-transparent outline-none"
            placeholder="e.g. 45 Triq il-Kbira, Valletta VLT 1432" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Pickup Date</label>
            <input v-model="form.pickupDate" type="date" required
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF56B0] focus:border-transparent outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Time Window</label>
            <select v-model="form.pickupTimeWindow" required
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF56B0] focus:border-transparent outline-none">
              <option value="">Select time window</option>
              <option v-for="tw in timeWindows" :key="tw" :value="tw">{{ tw }}</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Service Type</label>
            <select v-model="form.serviceType" required
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF56B0] focus:border-transparent outline-none">
              <option v-for="s in SERVICE_TYPES" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Estimated Bags</label>
            <input v-model.number="form.estimatedBags" type="number" min="1" required
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF56B0] focus:border-transparent outline-none"
              placeholder="e.g. 5" />
          </div>
        </div>
      </div>

      <!-- Item Selection -->
      <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Estimated Items</h3>
        <p class="text-xs text-gray-400">Add quantities for each item type to get a price estimate.</p>

        <div class="divide-y divide-gray-100">
          <div v-for="item in laundryItems" :key="item.code"
            class="flex items-center justify-between py-3 gap-4">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800">{{ item.name }} <span class="text-xs text-gray-400">({{ item.code }})</span></p>
              <p class="text-xs text-gray-400">&euro;{{ item.unitPrice.toFixed(2) }} / unit</p>
            </div>
            <input
              v-model.number="itemQtys[item.code]" type="number" min="0"
              class="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 focus:ring-[#FF56B0] focus:border-transparent outline-none"
              placeholder="0" />
          </div>
        </div>
      </div>

      <!-- Special Notes -->
      <div class="bg-white rounded-xl shadow-sm p-5 space-y-3">
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Special Notes</h3>
        <textarea v-model="form.specialNotes" rows="3"
          class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF56B0] focus:border-transparent outline-none resize-none"
          placeholder="e.g. Wine stains on sheets, low-temperature wash needed..."></textarea>
      </div>

      <!-- Price Estimate -->
      <div v-if="estimatedTotal > 0" class="bg-white rounded-xl shadow-sm p-5">
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Price Estimate</h3>
        <div class="space-y-1 text-sm">
          <div class="flex justify-between"><span class="text-gray-500">Subtotal</span><span class="font-medium">&euro;{{ subtotal.toFixed(2) }}</span></div>
          <div v-if="expressCharge > 0" class="flex justify-between"><span class="text-gray-500">Express surcharge</span><span class="font-medium">&euro;{{ expressCharge.toFixed(2) }}</span></div>
          <div class="flex justify-between"><span class="text-gray-500">VAT (18%)</span><span class="font-medium">&euro;{{ vat.toFixed(2) }}</span></div>
          <div class="flex justify-between border-t border-gray-100 pt-2 mt-2"><span class="font-semibold text-gray-800">Estimated Total</span><span class="font-bold text-gray-800">&euro;{{ estimatedTotal.toFixed(2) }}</span></div>
        </div>
      </div>

      <!-- Submit -->
      <div class="flex gap-3">
        <button type="submit"
          class="bg-[#FF56B0] text-white font-bold py-2.5 px-8 rounded-lg shadow-[0_4px_0_#E63E8A] hover:opacity-90 transition text-sm">
          Place Order
        </button>
        <button type="button" @click="navStore.goBack('orders')"
          class="bg-gray-100 text-gray-600 font-medium py-2.5 px-6 rounded-lg hover:bg-gray-200 transition text-sm">
          Cancel
        </button>
      </div>
    </form>

    <!-- Success toast -->
    <div v-if="showSuccess" class="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium z-50">
      Order submitted successfully!
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useNavStore } from '../../../stores/nav.js'
import { laundryItems, SERVICE_TYPES, VAT_RATE } from '../../../data/extendedMockData.js'

const navStore = useNavStore()

const timeWindows = ['08:00 - 10:00', '09:00 - 11:00', '10:00 - 12:00', '13:00 - 15:00', '14:00 - 16:00', '15:00 - 17:00']

const form = reactive({
  pickupAddress: '',
  pickupDate: '',
  pickupTimeWindow: '',
  serviceType: 'Standard (48h)',
  estimatedBags: 1,
  specialNotes: '',
})

const itemQtys = reactive(
  Object.fromEntries(laundryItems.map(i => [i.code, 0]))
)

const subtotal = computed(() =>
  laundryItems.reduce((sum, item) => sum + (itemQtys[item.code] || 0) * item.unitPrice, 0)
)

const expressCharge = computed(() =>
  form.serviceType === 'Express (24h)' ? 25 : form.serviceType === 'Same-Day' ? 50 : 0
)

const vat = computed(() => (subtotal.value + expressCharge.value) * VAT_RATE)

const estimatedTotal = computed(() => subtotal.value + expressCharge.value + vat.value)

const showSuccess = ref(false)

function submitOrder() {
  showSuccess.value = true
  setTimeout(() => {
    showSuccess.value = false
    navStore.goBack('orders')
  }, 1500)
}
</script>
