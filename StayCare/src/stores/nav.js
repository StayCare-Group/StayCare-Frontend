import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Tracks the active sub-page within the dashboard.
 * Sidebar buttons set the current page; role dashboards render accordingly.
 */
export const useNavStore = defineStore('nav', () => {
  const currentPage = ref('dashboard')

  function setPage(page) {
    currentPage.value = page
  }

  // Context for detail pages (selected entity ID)
  const selectedId = ref(null)
  const selectedRouteId = ref(null)

  function goToDetail(page, id, routeId = null) {
    currentPage.value = page
    selectedId.value = id
    selectedRouteId.value = routeId
  }

  function goBack(page) {
    currentPage.value = page
    selectedId.value = null
    selectedRouteId.value = null
  }

  function resetToDashboard() {
    currentPage.value = 'dashboard'
    selectedId.value = null
    selectedRouteId.value = null
  }

  // ── Bulk selection (pickup or delivery of multiple stops) ─────────────────
  /** Full stop/order objects selected for bulk confirmation */
  const selectedStops = ref([])
  /** IDs of the stops/orders selected for bulk confirmation */
  const selectedIds = ref([])
  /** 'pickup' | 'delivery' | null — enforces same-type selection */
  const selectedType = ref(null)
  /** routeId shared by the bulk selection (may be null for manual flow) */
  const selectedBulkRouteId = ref(null)

  /**
   * Navigate to the bulk confirmation page.
   * @param {string} type - 'pickup' or 'delivery'
   * @param {Array<object|string>} stopsOrIds - Array of stop objects or ID strings
   * @param {string|null} routeId - Shared route ID (null for manual flow)
   */
  function goToBulkConfirm(type, stopsOrIds, routeId = null) {
    selectedType.value = type
    if (Array.isArray(stopsOrIds) && stopsOrIds.length > 0 && typeof stopsOrIds[0] === 'object') {
      selectedStops.value = stopsOrIds
      selectedIds.value = stopsOrIds.map((s) => s.confirmationOrderId ?? s.orderDbId ?? s._id ?? s.id)
    } else {
      selectedStops.value = []
      selectedIds.value = Array.isArray(stopsOrIds) ? stopsOrIds : []
    }
    selectedBulkRouteId.value = routeId
    currentPage.value = type === 'pickup' ? 'bulk-pickup-confirm' : 'bulk-delivery-confirm'
  }

  /** Called when returning from bulk confirmation to reset selection state */
  function clearBulkSelection() {
    selectedStops.value = []
    selectedIds.value = []
    selectedType.value = null
    selectedBulkRouteId.value = null
  }

  return {
    currentPage,
    selectedId,
    selectedRouteId,
    selectedStops,
    selectedIds,
    selectedType,
    selectedBulkRouteId,
    setPage,
    goToDetail,
    goBack,
    resetToDashboard,
    goToBulkConfirm,
    clearBulkSelection,
  }
})

