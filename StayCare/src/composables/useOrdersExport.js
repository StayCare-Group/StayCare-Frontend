import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '../stores/ui.js'
import { downloadOrdersFlatCsv, downloadOrdersStainedCsv } from '../api/orders'
import { formatApiErrorMessage } from '../utils/errors'

/**
 * CSV export actions for the orders list.
 *
 * - With selected orders: exports exactly those ids (they can span several pages).
 * - Without selection: exports every order matching the active list filters
 *   (not only the visible page).
 *
 * @param {import('vue').Ref<string[]>} selectedOrderIds
 * @param {() => import('../api/orders').OrdersExportFilters} getExportFilters
 */
export function useOrdersExport(selectedOrderIds, getExportFilters) {
  const { t } = useI18n()
  const uiStore = useUiStore()

  const exportLoading = ref(false)
  const exportStainedLoading = ref(false)

  async function runExport(download, loadingRef) {
    if (loadingRef.value) return
    loadingRef.value = true
    try {
      await download([...selectedOrderIds.value], getExportFilters())
    } catch (err) {
      uiStore.showError(formatApiErrorMessage(err, t('excel.exportError'), t))
    } finally {
      loadingRef.value = false
    }
  }

  const exportToCsv = () => runExport(downloadOrdersFlatCsv, exportLoading)
  const exportStainedToCsv = () => runExport(downloadOrdersStainedCsv, exportStainedLoading)

  return { exportLoading, exportStainedLoading, exportToCsv, exportStainedToCsv }
}
