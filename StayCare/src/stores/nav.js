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

  // Optional: context data for detail pages (e.g. selected order/invoice ID)
  const selectedId = ref(null)

  function goToDetail(page, id) {
    currentPage.value = page
    selectedId.value = id
  }

  function goBack(page) {
    currentPage.value = page
    selectedId.value = null
  }

  return { currentPage, selectedId, setPage, goToDetail, goBack }
})
