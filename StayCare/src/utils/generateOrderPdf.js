import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * High-contrast monochrome palette optimized for B&W laser and thermal printing.
 * Avoids dark background fills with white text which blur on laser/thermal printers.
 */
const BLACK = [0, 0, 0]
const DARK_GRAY = [60, 60, 60]
const MID_GRAY = [120, 120, 120]
const LIGHT_GRAY = [242, 242, 242]
const WHITE = [255, 255, 255]

/**
 * Generates and downloads a PDF for a single order.
 * Compact single-page layout optimized for 102 mm x 152 mm (4" x 6") print size in B&W.
 *
 * @param {object} order  - Mapped order object from mapOrderForDetail
 * @param {object} t      - vue-i18n t() function (optional — falls back to English)
 */
export function generateOrderPdf(order, t) {
  const _ = (key, fallback) => (t ? t(key) : fallback)

  // Custom 102 mm x 152 mm format (portrait label/ticket size)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [102, 152] })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 5
  const contentW = pageW - margin * 2

  let y = 4

  /* ── HEADER (Compact B&W design) ── */
  // Brand name
  doc.setTextColor(...BLACK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('StayFresh', margin, y + 4)

  // Order ID aligned right
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(String(order.id || '—'), pageW - margin, y + 4, { align: 'right' })

  y += 6

  // Subtitle
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...DARK_GRAY)
  doc.text(_('orderDetail.title', 'Order Summary'), margin, y + 2)

  // Status badge (High-contrast outlined pill)
  const statusText = String(order.statusLabel || order.status || '').toUpperCase()
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'bold')
  const pillW = doc.getTextWidth(statusText) + 4
  const pillH = 4
  const pillX = pageW - margin - pillW
  const pillY = y - 1.2

  doc.setDrawColor(...BLACK)
  doc.setLineWidth(0.25)
  doc.rect(pillX, pillY, pillW, pillH)
  doc.setTextColor(...BLACK)
  doc.text(statusText, pillX + pillW / 2, pillY + 2.8, { align: 'center' })

  y += 5

  // Solid header line
  doc.setDrawColor(...BLACK)
  doc.setLineWidth(0.4)
  doc.line(margin, y, pageW - margin, y)

  y += 3

  /* ── SECTION TITLE HELPER ── */
  function sectionTitle(label) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...BLACK)
    doc.text(label.toUpperCase(), margin, y)
    doc.setDrawColor(...MID_GRAY)
    doc.setLineWidth(0.2)
    doc.line(margin, y + 1, margin + contentW, y + 1)
    y += 4
  }

  /* ── LABEL-VALUE HELPER (3-column layout) ── */
  function labelValue(label, value, col = 0, colSpan = 1) {
    const colW = contentW / 3
    const x = margin + col * colW
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...DARK_GRAY)
    doc.text(label, x, y)
    doc.setFontSize(7.5)
    doc.setTextColor(...BLACK)
    doc.setFont('helvetica', 'bold')
    const valStr = String(value || '—')
    const maxW = colW * colSpan - 1
    const truncated = doc.getTextWidth(valStr) > maxW ? doc.splitTextToSize(valStr, maxW)[0] : valStr
    doc.text(truncated, x, y + 3)
  }

  /* ── SECTION: ORDER INFORMATION (3 Columns) ── */
  sectionTitle(_('orderDetail.orderInformation', 'Order Information'))

  // Row 1 (Col 0: Client, Col 1: Service Type, Col 2: Pickup Date)
  labelValue(_('common.client', 'Client'), order.client, 0)
  labelValue(_('orderDetail.serviceType', 'Service Type'), order.serviceType, 1)
  const pickupDateStr = `${order.pickupDate || ''} ${order.pickupTimeWindow ? '· ' + order.pickupTimeWindow : ''}`.trim()
  labelValue(_('orderDetail.pickupDate', 'Pickup Date'), pickupDateStr || '—', 2)
  y += 6.5

  // Row 2 (Col 0: Address, Col 1: Bags Est/Act, Col 2: Driver)
  labelValue(_('orderDetail.pickupAddress', 'Pickup Address'), order.pickupAddress, 0)
  const bagsStr = `Est: ${order.estimatedBags ?? '—'} / Act: ${order.actualBags ?? '—'}`
  labelValue(_('orderDetail.estimatedBags', 'Bags (Est/Act)'), bagsStr, 1)
  const driverStr = order.driverPickup || order.driverDelivery || '—'
  labelValue(_('orderDetail.pickupDriver', 'Driver'), driverStr, 2)
  y += 6.5

  // Special notes (compact & no overlap)
  if (order.specialNotes) {
    const label = `${_('common.specialNotes', 'Special Notes')}:`
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...DARK_GRAY)
    doc.text(label, margin, y)

    const labelW = doc.getTextWidth(label) + 2
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...BLACK)

    const wrapped = doc.splitTextToSize(String(order.specialNotes), contentW - labelW)
    if (wrapped.length === 1) {
      doc.text(wrapped[0], margin + labelW, y)
      y += 5
    } else {
      doc.text(wrapped, margin + labelW, y)
      y += wrapped.length * 3.2 + 2
    }
  } else {
    y += 1.5
  }

  /* ── SECTION: ITEMS TABLE (Compact padding & height) ── */
  sectionTitle(_('common.items', 'Items'))

  const itemRows = (order.items ?? []).map(i => [
    i.code || '—',
    i.name || '—',
    String(i.qty ?? 0),
    `€${(i.unitPrice ?? 0).toFixed(2)}`,
    `€${((i.qty ?? 0) * (i.unitPrice ?? 0)).toFixed(2)}`,
  ])

  autoTable(doc, {
    startY: y,
    head: [[
      _('orderDetail.itemCode', 'Code'),
      _('orderDetail.itemName', 'Name'),
      _('orderDetail.quantity', 'Qty'),
      _('orderDetail.unitPrice', 'Unit'),
      _('orderDetail.lineTotal', 'Total'),
    ]],
    body: itemRows.length ? itemRows : [['—', _('orderDetail.noItems', 'No items recorded'), '', '', '']],
    margin: { left: margin, right: margin },
    tableWidth: contentW,
    styles: {
      fontSize: 7.0,
      cellPadding: 1.0,
      textColor: [...BLACK],
      lineColor: [...MID_GRAY],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [...LIGHT_GRAY],
      textColor: [...BLACK],
      fontStyle: 'bold',
      fontSize: 7.0,
      cellPadding: 1.2,
      lineColor: [...BLACK],
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: [...WHITE],
    },
    columnStyles: {
      0: { cellWidth: 16 },
      1: { cellWidth: 36 },
      2: { halign: 'right', cellWidth: 10 },
      3: { halign: 'right', cellWidth: 15 },
      4: { halign: 'right', cellWidth: 15 },
    },
  })

  y = doc.lastAutoTable.finalY + 2

  /* ── TOTAL ROW (Compact) ── */
  doc.setDrawColor(...BLACK)
  doc.setLineWidth(0.3)
  doc.rect(margin, y, contentW, 5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...BLACK)
  doc.text(_('orderDetail.orderTotal', 'Order Total'), margin + 2, y + 3.5)
  doc.text(`€${(order.total ?? 0).toFixed(2)}`, pageW - margin - 2, y + 3.5, { align: 'right' })

  /* ── FOOTER ── */
  const footerY = pageH - 3.5
  doc.setDrawColor(...MID_GRAY)
  doc.setLineWidth(0.2)
  doc.line(margin, footerY - 2, pageW - margin, footerY - 2)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(...DARK_GRAY)

  const generatedOn = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  doc.text(`StayFresh — ${generatedOn}`, margin, footerY)
  doc.text(_('orderPdf.confidential', 'Internal Use Only'), pageW - margin, footerY, { align: 'right' })

  /* ── SAVE ── */
  doc.save(`order-${order.id}.pdf`)
}


