<template>
  <div class="space-y-6 max-w-2xl">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <button @click="navStore.goBack('route')" class="text-white hover:text-gray-400">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <h2 class="text-lg font-semibold text-white">Confirm Delivery</h2>
    </div>

    <div v-if="stop" class="space-y-6">
      <!-- Stop Info -->
      <div class="bg-white rounded-xl shadow-sm p-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div><span class="text-gray-400">Client</span><p class="font-medium text-gray-800">{{ stop.client }}</p></div>
          <div><span class="text-gray-400">Order</span><p class="font-medium text-gray-800">{{ stop.orderId }}</p></div>
          <div><span class="text-gray-400">Address</span><p class="font-medium text-gray-800">{{ stop.address }}</p></div>
          <div><span class="text-gray-400">Time Window</span><p class="font-medium text-gray-800">{{ stop.timeWindow }}</p></div>
          <div><span class="text-gray-400">Packages</span><p class="font-medium text-gray-800">{{ stop.estimatedBags }}</p></div>
        </div>
      </div>

      <!-- Delivery Form -->
      <form @submit.prevent="confirmDelivery" class="space-y-5">
        <div class="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Delivery Confirmation</h3>

          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Packages Delivered</label>
            <input v-model.number="form.packagesDelivered" type="number" min="1" required
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00F5F3] focus:border-transparent outline-none"
              placeholder="Number of packages delivered" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Received By</label>
            <input v-model="form.receivedBy" type="text" required
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00F5F3] focus:border-transparent outline-none"
              placeholder="Name of person receiving" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Delivery Notes</label>
            <textarea v-model="form.notes" rows="2"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#00F5F3] focus:border-transparent outline-none resize-none"
              placeholder="Any issues or observations..."></textarea>
          </div>

          <!-- Photo proof -->
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Proof of Delivery (optional)</label>
            <div class="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
              <svg class="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <p class="text-xs text-gray-400">Tap to capture delivery photo</p>
            </div>
          </div>

          <!-- Digital signature -->
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Recipient Signature</label>
            <div class="border border-gray-200 rounded-lg p-8 text-center bg-gray-50">
              <p class="text-xs text-gray-400">Digital signature capture area</p>
              <p class="text-xs text-gray-300 mt-1">(placeholder — tap to sign)</p>
            </div>
          </div>
        </div>

        <div class="flex gap-3">
          <button type="submit"
            class="bg-[#00F5F3] text-gray-800 font-bold py-2.5 px-8 rounded-lg shadow-[0_4px_0_#00D4D2] hover:opacity-90 transition text-sm">
            Confirm Delivery
          </button>
          <button type="button" @click="navStore.goBack('route')"
            class="bg-gray-100 text-gray-600 font-medium py-2.5 px-6 rounded-lg hover:bg-gray-200 transition text-sm">
            Cancel
          </button>
        </div>
      </form>

      <!-- Success toast -->
      <div v-if="showSuccess" class="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium z-50">
        Delivery confirmed!
      </div>
    </div>

    <div v-else class="bg-white rounded-xl shadow-sm p-10 text-center">
      <p class="text-gray-400">Stop not found.</p>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useNavStore } from '../../../stores/nav.js'
import { driverRoute } from '../../../data/extendedMockData.js'

const navStore = useNavStore()
const showSuccess = ref(false)

const stop = computed(() => driverRoute.stops.find(s => s.id === navStore.selectedId))

const form = reactive({
  packagesDelivered: null,
  receivedBy: '',
  notes: '',
})

function confirmDelivery() {
  showSuccess.value = true
  setTimeout(() => {
    showSuccess.value = false
    navStore.goBack('route')
  }, 1500)
}
</script>
