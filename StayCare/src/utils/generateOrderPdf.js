import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * High-contrast monochrome palette optimized for B&W laser and thermal printing.
 * Avoids dark background fills with white text which blur on laser/thermal printers.
 */
const BLACK = [0, 0, 0]
const DARK_GRAY = [50, 50, 50]
const MID_GRAY = [100, 100, 100]
const LIGHT_GRAY = [240, 240, 240]
const WHITE = [255, 255, 255]

/**
 * Generates and downloads a PDF for a single order.
 * Optimized for 102 mm x 152 mm (4" x 6") print size in B&W.
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
  const margin = 6
  const contentW = pageW - margin * 2

  let y = 7

  /* ── HEADER (Clean B&W design) ── */
  // Brand name
  doc.setTextColor(...BLACK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('StayFresh', margin, y + 4)

  // Order ID aligned right
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(String(order.id || '—'), pageW - margin, y + 4, { align: 'right' })

  y += 7

  // Subtitle
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...DARK_GRAY)
  doc.text(_('orderDetail.title', 'Order Summary'), margin, y + 2)

  // Status badge (High-contrast outlined pill)
  const statusText = String(order.statusLabel || order.status || '').toUpperCase()
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  const pillW = doc.getTextWidth(statusText) + 5
  const pillH = 4.5
  const pillX = pageW - margin - pillW
  const pillY = y - 1.5

  doc.setDrawColor(...BLACK)
  doc.setLineWidth(0.3)
  doc.rect(pillX, pillY, pillW, pillH)
  doc.setTextColor(...BLACK)
  doc.text(statusText, pillX + pillW / 2, pillY + 3.2, { align: 'center' })

  y += 6

  // Solid header line
  doc.setDrawColor(...BLACK)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageW - margin, y)

  y += 4

  /* ── SECTION TITLE HELPER ── */
  function sectionTitle(label) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...BLACK)
    doc.text(label.toUpperCase(), margin, y)
    doc.setDrawColor(...MID_GRAY)
    doc.setLineWidth(0.2)
    doc.line(margin, y + 1.2, margin + contentW, y + 1.2)
    y += 5
  }

  /* ── LABEL-VALUE HELPER ── */
  function labelValue(label, value, col = 0) {
    const colW = contentW / 2
    const x = margin + col * colW
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...DARK_GRAY)
    doc.text(label, x, y)
    doc.setFontSize(8)
    doc.setTextColor(...BLACK)
    doc.setFont('helvetica', 'bold')
    doc.text(String(value || '—'), x, y + 3.2)
  }

  /* ── SECTION: ORDER INFORMATION ── */
  sectionTitle(_('orderDetail.orderInformation', 'Order Information'))

  // Row 1
  labelValue(_('common.client', 'Client'), order.client, 0)
  labelValue(_('orderDetail.serviceType', 'Service Type'), order.serviceType, 1)
  y += 7.5

  // Row 2
  const pickupDateStr = `${order.pickupDate || ''} ${order.pickupTimeWindow ? '· ' + order.pickupTimeWindow : ''}`.trim()
  labelValue(_('orderDetail.pickupDate', 'Pickup Date'), pickupDateStr || '—', 0)
  labelValue(_('orderDetail.pickupAddress', 'Pickup Address'), order.pickupAddress, 1)
  y += 7.5

  // Row 3
  labelValue(_('orderDetail.estimatedBags', 'Est. Bags'), order.estimatedBags, 0)
  labelValue(_('orderDetail.actualBags', 'Actual Bags'), order.actualBags ?? '—', 1)
  y += 7.5

  // Drivers (if present)
  if (order.driverPickup || order.driverDelivery) {
    labelValue(_('orderDetail.pickupDriver', 'Pickup Driver'), order.driverPickup || '—', 0)
    labelValue(_('orderDetail.deliveryDriver', 'Delivery Driver'), order.driverDelivery || '—', 1)
    y += 7.5
  }

  // Special notes (if present)
  if (order.specialNotes) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...DARK_GRAY)
    doc.text(_('client.specialNotes', 'Special Notes'), margin, y)
    y += 3.2
    doc.setFontSize(7.5)
    doc.setTextColor(...BLACK)
    doc.setFont('helvetica', 'normal')
    const wrapped = doc.splitTextToSize(order.specialNotes, contentW)
    doc.text(wrapped, margin, y)
    y += wrapped.length * 3.5 + 1.5
  }

  y += 2

  /* ── SECTION: ITEMS TABLE ── */
  sectionTitle(_('client.items', 'Items'))

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
      fontSize: 7.5,
      cellPadding: 1.8,
      textColor: [...BLACK],
      lineColor: [...MID_GRAY],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [...LIGHT_GRAY],
      textColor: [...BLACK],
      fontStyle: 'bold',
      fontSize: 7.5,
      lineColor: [...BLACK],
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: [...WHITE],
    },
    columnStyles: {
      0: { cellWidth: 16 },
      1: { cellWidth: 34 },
      2: { halign: 'right', cellWidth: 10 },
      3: { halign: 'right', cellWidth: 15 },
      4: { halign: 'right', cellWidth: 15 },
    },
  })

  y = doc.lastAutoTable.finalY + 3

  /* ── TOTAL ROW ── */
  doc.setDrawColor(...BLACK)
  doc.setLineWidth(0.3)
  doc.rect(margin, y, contentW, 6.5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...BLACK)
  doc.text(_('orderDetail.orderTotal', 'Order Total'), margin + 2, y + 4.3)
  doc.text(`€${(order.total ?? 0).toFixed(2)}`, pageW - margin - 2, y + 4.3, { align: 'right' })

  y += 9.5


  /* ── FOOTER ── */
  const footerY = pageH - 4
  doc.setDrawColor(...MID_GRAY)
  doc.setLineWidth(0.2)
  doc.line(margin, footerY - 2.5, pageW - margin, footerY - 2.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...DARK_GRAY)

  const generatedOn = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  doc.text(`StayFresh — ${generatedOn}`, margin, footerY)
  doc.text(_('orderPdf.confidential', 'Internal Use Only'), pageW - margin, footerY, { align: 'right' })

  /* ── SAVE ── */
  doc.save(`order-${order.id}.pdf`)
}

