import * as XLSX from 'xlsx'
import { useI18n } from 'vue-i18n'
import { fetchInvoiceById } from '../api/invoices'
import { fetchOrderById } from '../api/orders'

function sanitizeSheetName(name) {
  if (!name) return 'Sheet'
  // SheetJS sheet names cannot exceed 31 characters and cannot contain : \ / ? * [ ]
  return String(name)
    .replace(/[:\\/?*\[\]]/g, '-')
    .slice(0, 31)
}

export function useExcelExporter() {
  const { t } = useI18n()

  async function exportInvoicesDetailed(invoicesList) {
    if (!invoicesList || !invoicesList.length) return

    const wb = XLSX.utils.book_new()

    const kNum = t('excel.invoiceNumber')
    const kOrders = t('excel.orders')
    const kClient = t('excel.client')
    const kContact = t('excel.contact')
    const kIssue = t('excel.issueDate')
    const kDue = t('excel.dueDate')
    const kStatus = t('excel.status')
    const kTotal = t('excel.total')
    const kSubtotal = t('excel.subtotal')
    const kVat = t('excel.vat')
    const kGrandTotal = t('excel.grandTotal')
    const kInvoicesSheet = t('excel.invoicesSheet')

    // 1. Summary sheet
    const summaryRows = invoicesList.map(inv => ({
      [kNum]: inv.id,
      [kOrders]: inv.orderId || '—',
      [kClient]: inv.client || '—',
      [kIssue]: inv.issueDate || '—',
      [kDue]: inv.dueDate || '—',
      [kStatus]: inv.status || '—',
      [kTotal]: inv.grandTotal ?? 0,
    }))
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
    XLSX.utils.book_append_sheet(wb, wsSummary, kInvoicesSheet)

    // 2. Fetch full details for each invoice & add individual sheets
    const details = await Promise.all(
      invoicesList.map(async inv => {
        try {
          const raw = await fetchInvoiceById(inv._id)
          return { listInv: inv, fullData: raw }
        } catch {
          return { listInv: inv, fullData: null }
        }
      })
    )

    const usedSheetNames = new Set([kInvoicesSheet])

    for (const { listInv, fullData } of details) {
      let sheetName = sanitizeSheetName(listInv.id || 'Invoice')
      let count = 1
      while (usedSheetNames.has(sheetName)) {
        sheetName = `${sanitizeSheetName(listInv.id).slice(0, 28)}_${count++}`
      }
      usedSheetNames.add(sheetName)

      const invData = fullData?.invoice ?? fullData ?? {}
      const lineItems = fullData?.line_items ?? invData.line_items ?? fullData?.items ?? invData.items ?? listInv?.items ?? []
      const clientName = fullData?.user?.name ?? fullData?.client_profile?.contact_person ?? listInv.client ?? '—'
      const contactPerson = fullData?.client_profile?.contact_person ?? '—'

      const sheetData = [
        [t('excel.invoiceDetailTitle')],
        [`${kNum}:`, listInv.id || invData.invoice_number || '—'],
        [`${kClient}:`, clientName],
        [`${kContact}:`, contactPerson],
        [`${kIssue}:`, listInv.issueDate || invData.issue_date || '—'],
        [`${kDue}:`, listInv.dueDate || invData.due_date || '—'],
        [`${kStatus}:`, listInv.status || invData.status || '—'],
        [],
        [t('excel.lineItemsTitle')],
        [t('excel.description'), t('excel.quantity'), t('excel.unitPrice'), t('excel.totalPrice')],
      ]

      if (lineItems.length > 0) {
        lineItems.forEach(item => {
          const description = item.description || item.name || item.item_name || item.name_snapshot || 'Item'
          const qty = Number(item.quantity ?? item.qty ?? 1)
          const unitPrice = Number(item.unit_price ?? item.unitPrice ?? 0)
          const totalPrice = Number(item.total_price ?? item.total ?? (qty * unitPrice) ?? 0)
          sheetData.push([
            description,
            qty,
            unitPrice,
            totalPrice,
          ])
        })
      } else {
        sheetData.push([t('excel.noLineItems'), 1, Number(listInv.grandTotal ?? 0), Number(listInv.grandTotal ?? 0)])
      }

      sheetData.push(
        [],
        ['', '', `${kSubtotal}:`, Number(invData.subtotal ?? listInv.grandTotal ?? 0)],
        ['', '', `${kVat}:`, Number(invData.vat_amount ?? 0)],
        ['', '', `${kGrandTotal}:`, Number(invData.total ?? listInv.grandTotal ?? 0)]
      )

      const ws = XLSX.utils.aoa_to_sheet(sheetData)
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    }

    const dateStr = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `Facturas-StayCare-${dateStr}.xlsx`)
  }

  async function exportOrdersDetailed(ordersList) {
    if (!ordersList || !ordersList.length) return

    const wb = XLSX.utils.book_new()

    const kOrderId = t('excel.orderId')
    const kClient = t('excel.client')
    const kProperty = t('excel.property')
    const kPickupDate = t('excel.pickupDate')
    const kServiceType = t('excel.serviceType')
    const kStatus = t('excel.status')
    const kBags = t('excel.bags')
    const kTotal = t('excel.total')
    const kGrandTotal = t('excel.grandTotal')
    const kOrdersSheet = t('excel.ordersSheet')

    // 1. Summary sheet
    const summaryRows = ordersList.map(o => ({
      [kOrderId]: o.id,
      [kClient]: o.client || '—',
      [kProperty]: o.propertyName || '—',
      [kPickupDate]: o.pickupDate || '—',
      [kServiceType]: o.serviceType || '—',
      [kStatus]: o.status || '—',
      [kBags]: o.actualBags ?? o.estimatedBags ?? 0,
      [kTotal]: o.total ?? 0,
    }))
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
    XLSX.utils.book_append_sheet(wb, wsSummary, kOrdersSheet)

    // 2. Fetch full details for each order & add individual sheets
    const details = await Promise.all(
      ordersList.map(async o => {
        try {
          const raw = await fetchOrderById(o._id)
          return { listOrder: o, fullData: raw }
        } catch {
          return { listOrder: o, fullData: null }
        }
      })
    )

    const usedSheetNames = new Set([kOrdersSheet])

    for (const { listOrder, fullData } of details) {
      let sheetName = sanitizeSheetName(listOrder.id || 'Order')
      let count = 1
      while (usedSheetNames.has(sheetName)) {
        sheetName = `${sanitizeSheetName(listOrder.id).slice(0, 28)}_${count++}`
      }
      usedSheetNames.add(sheetName)

      const orderData = fullData?.order ?? fullData ?? {}
      const items = fullData?.items ?? orderData.items ?? []

      const sheetData = [
        [t('excel.orderDetailTitle')],
        [`${kOrderId}:`, listOrder.id || orderData.order_number || '—'],
        [`${kClient}:`, listOrder.client || orderData.client_name || '—'],
        [`${kProperty}:`, listOrder.propertyName || orderData.property_name || '—'],
        [`${kPickupDate}:`, listOrder.pickupDate || orderData.pickup_date || '—'],
        [`${kServiceType}:`, listOrder.serviceType || orderData.service_type || '—'],
        [`${kStatus}:`, listOrder.status || orderData.status || '—'],
        [`${t('excel.specialNotes')}:`, orderData.special_notes || '—'],
        [],
        [t('excel.itemsTitle')],
        [
          t('excel.item'),
          t('excel.code'),
          t('excel.qtyGood'),
          t('excel.qtyStained'),
          t('excel.qtyDamaged'),
          t('excel.totalReceived'),
          t('excel.unitPrice'),
          t('excel.total'),
        ],
      ]

      if (items.length > 0) {
        items.forEach(item => {
          const qGood = Number(item.quantity_good ?? item.qty_good ?? item.quantity ?? 0)
          const qStained = Number(item.quantity_stained ?? item.qty_stained ?? 0)
          const qDamaged = Number(item.quantity_damaged ?? item.qty_damaged ?? 0)
          const totalQty = qGood + qStained + qDamaged || Number(item.quantity ?? 1)
          const unitPrice = Number(item.unit_price ?? item.price ?? 0)

          sheetData.push([
            item.name || item.item_name || item.name_snapshot || item.description || 'Item',
            item.code || item.item_code || '—',
            qGood,
            qStained,
            qDamaged,
            totalQty,
            unitPrice,
            Number(item.subtotal ?? (totalQty * unitPrice) ?? 0),
          ])
        })
      } else {
        sheetData.push([t('excel.noItems'), '—', 0, 0, 0, 0, 0, Number(listOrder.total ?? 0)])
      }

      sheetData.push(
        [],
        ['', '', '', '', '', '', `${kGrandTotal}:`, Number(orderData.total ?? listOrder.total ?? 0)]
      )

      const ws = XLSX.utils.aoa_to_sheet(sheetData)
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    }

    const dateStr = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `Ordenes-StayCare-${dateStr}.xlsx`)
  }

  /**
   * Flat export: one row per order, item quantities pivoted as columns,
   * plus timestamps for key status changes.
   * @param {Array} ordersList - Orders from the list (mapped, lightweight)
   * @returns {Promise<{ exported: number } | { error: string, count: number }>}
   */
  async function exportOrdersFlat(ordersList) {
    if (!ordersList || !ordersList.length) return

    const MAX_ORDERS = 200
    if (ordersList.length > MAX_ORDERS) {
      return { error: 'limit', count: ordersList.length }
    }

    // Fetch full details for every order in parallel
    const details = await Promise.all(
      ordersList.map(async (o) => {
        try {
          const raw = await fetchOrderById(o._id)
          return { listOrder: o, fullData: raw }
        } catch {
          return { listOrder: o, fullData: null }
        }
      })
    )

    // --- Collect all unique item names (pivot columns) ---
    const itemNamesSet = new Set()
    for (const { fullData } of details) {
      const items = fullData?.items ?? fullData?.order?.items ?? []
      for (const item of items) {
        const name = item.name_snapshot || item.name || item.item_name || item.description
        if (name) itemNamesSet.add(name)
      }
    }
    const itemNames = Array.from(itemNamesSet).sort()

    // --- Helper: find status history entry by status name ---
    function findHistory(statusHistory, statusName) {
      if (!Array.isArray(statusHistory)) return null
      return statusHistory.find((h) => h.status === statusName) ?? null
    }

    function formatTs(entry) {
      if (!entry?.changed_at) return ''
      return new Date(entry.changed_at).toLocaleString()
    }

    // --- Build rows ---
    const kOrderId    = t('excel.orderId')
    const kClient     = t('excel.client')
    const kProperty   = t('excel.property')
    const kCreated    = t('excel.createdDate')
    const kPickup     = t('excel.pickupDate')
    const kService    = t('excel.serviceType')
    const kStatus     = t('excel.status')
    const kBags       = t('excel.bags')
    const kTotal      = t('excel.total')
    const kQcUser     = t('excel.qualityCheckBy')
    const kArrived    = t('excel.timestampArrived')
    const kIroning    = t('excel.timestampIroning')
    const kDelivered  = t('excel.timestampDelivered')

    const rows = details.map(({ listOrder, fullData }) => {
      const orderData = fullData?.order ?? fullData ?? {}
      const items     = fullData?.items ?? orderData.items ?? []
      const history   = fullData?.status_history ?? orderData.status_history ?? []

      // Pivot: map item name → total quantity
      const itemQtyMap = {}
      for (const item of items) {
        const name = item.name_snapshot || item.name || item.item_name || item.description
        if (!name) continue
        const qGood    = Number(item.quantity_good    ?? item.qty_good    ?? 0)
        const qStained = Number(item.quantity_stained ?? item.qty_stained ?? 0)
        const qDamaged = Number(item.quantity_damaged ?? item.qty_damaged ?? 0)
        itemQtyMap[name] = (itemQtyMap[name] ?? 0) + (qGood + qStained + qDamaged || Number(item.quantity ?? 0))
      }

      // Timestamps
      const qcEntry        = findHistory(history, 'quality_check')
      const arrivedEntry   = findHistory(history, 'received') ?? findHistory(history, 'arrived')
      const ironingEntry   = findHistory(history, 'ironing')
      const deliveredEntry = findHistory(history, 'delivered')

      const row = {
        [kOrderId]:  listOrder.id,
        [kClient]:   listOrder.client  || '—',
        [kProperty]: listOrder.propertyName || '—',
        [kCreated]:  listOrder.createdAt   || orderData.created_at || '—',
        [kPickup]:   listOrder.pickupDate  || orderData.pickup_date || '—',
        [kService]:  listOrder.serviceType || '—',
        [kStatus]:   listOrder.status      || '—',
        [kBags]:     listOrder.actualBags ?? listOrder.estimatedBags ?? 0,
        [kTotal]:    listOrder.total ?? 0,
      }

      // Item pivot columns
      for (const name of itemNames) {
        row[name] = itemQtyMap[name] ?? 0
      }

      // Timestamps & QC
      row[kQcUser]    = qcEntry?.changed_by_user_name ?? ''
      row[kArrived]   = formatTs(arrivedEntry)
      row[kIroning]   = formatTs(ironingEntry)
      row[kDelivered] = formatTs(deliveredEntry)

      return row
    })

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, t('excel.flatSheet'))

    const dateStr = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `Ordenes-Resumen-StayCare-${dateStr}.xlsx`)

    return { exported: rows.length }
  }

  return {
    exportInvoicesDetailed,
    exportOrdersDetailed,
    exportOrdersFlat,
  }
}
