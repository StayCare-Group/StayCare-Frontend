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

  return { currentPage, selectedId, selectedRouteId, setPage, goToDetail, goBack, resetToDashboard }
})
