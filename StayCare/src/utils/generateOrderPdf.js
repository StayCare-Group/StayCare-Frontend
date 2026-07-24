import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Brand colours (matching tailwind.config brand palette)
 */
const BRAND_DARK = [30, 30, 80]    // brand-900 equivalent for text
const BRAND_PRIMARY = [72, 52, 212] // brand-700
const BRAND_LIGHT = [237, 233, 254] // band-100 – used for header fills
const GRAY_MID = [107, 114, 128]    // gray-500
const GRAY_LIGHT = [249, 250, 251]  // gray-50 – row alt bg
const WHITE = [255, 255, 255]

/**
 * Returns an RGB tuple for a status string (matches StatusBadge colours)
 */
function statusColor(status) {
  const s = String(status).toLowerCase()
  if (s.includes('delivered') || s.includes('completed')) return [22, 163, 74]  // green-600
  if (s.includes('transit') || s.includes('progress')) return [37, 99, 235]     // blue-600
  if (s.includes('ready')) return [16, 185, 129]                                 // emerald-500
  if (s.includes('pending')) return [234, 179, 8]                                // yellow-500
  if (s.includes('cancelled')) return [220, 38, 38]                              // red-600
  return [75, 85, 99]                                                             // gray-600
}

/**
 * Draw a rounded rect (jsPDF only supports rect natively; this is a simple version)
 */
function filledRect(doc, x, y, w, h, color) {
  doc.setFillColor(...color)
  doc.roundedRect(x, y, w, h, 2, 2, 'F')
}

/**
 * Generates and downloads a PDF for a single order.
 *
 * @param {object} order  - Mapped order object from mapOrderForDetail
 * @param {object} t      - vue-i18n t() function (optional — falls back to English)
 */
export function generateOrderPdf(order, t) {
  const _ = (key, fallback) => (t ? t(key) : fallback)

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentW = pageW - margin * 2

  /* ── HEADER BAND ── */
  filledRect(doc, 0, 0, pageW, 34, BRAND_PRIMARY)

  // Brand name
  doc.setTextColor(...WHITE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('StayCare', margin, 14)

  // Sub-title
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(_('orderDetail.title', 'Order Summary'), margin, 21)

  // Order number aligned right
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(String(order.id || '—'), pageW - margin, 14, { align: 'right' })

  // Status badge (simulated as coloured pill)
  const statusRgb = statusColor(order.status)
  const statusText = String(order.statusLabel || order.status || '')
  doc.setFillColor(...statusRgb)
  const pillW = doc.getTextWidth(statusText) + 8
  doc.roundedRect(pageW - margin - pillW, 17, pillW, 6, 1.5, 1.5, 'F')
  doc.setTextColor(...WHITE)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.text(statusText, pageW - margin - pillW / 2, 21.2, { align: 'center' })

  let y = 42

  /* ── SECTION: ORDER INFORMATION ── */
  function sectionTitle(label) {
    doc.setFillColor(...BRAND_LIGHT)
    doc.rect(margin, y, contentW, 7, 'F')
    doc.setTextColor(...BRAND_PRIMARY)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(label.toUpperCase(), margin + 3, y + 4.8)
    y += 10
  }

  function labelValue(label, value, col = 0) {
    const colW = contentW / 2
    const x = margin + col * colW
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...GRAY_MID)
    doc.text(label, x, y)
    doc.setFontSize(8.5)
    doc.setTextColor(...BRAND_DARK)
    doc.setFont('helvetica', 'bold')
    doc.text(String(value || '—'), x, y + 4.5)
  }

  sectionTitle(_('orderDetail.orderInformation', 'Order Information'))

  // Row 1
  labelValue(_('common.client', 'Client'), order.client, 0)
  labelValue(_('orderDetail.serviceType', 'Service Type'), order.serviceType, 1)
  y += 11

  // Row 2
  labelValue(_('orderDetail.pickupDate', 'Pickup Date'), `${order.pickupDate} ${order.pickupTimeWindow ? '· ' + order.pickupTimeWindow : ''}`, 0)
  labelValue(_('orderDetail.pickupAddress', 'Pickup Address'), order.pickupAddress, 1)
  y += 11

  // Row 3
  labelValue(_('orderDetail.estimatedBags', 'Est. Bags'), order.estimatedBags, 0)
  labelValue(_('orderDetail.actualBags', 'Actual Bags'), order.actualBags ?? '—', 1)
  y += 11

  // Drivers (if present)
  if (order.driverPickup || order.driverDelivery) {
    labelValue(_('orderDetail.pickupDriver', 'Pickup Driver'), order.driverPickup || '—', 0)
    labelValue(_('orderDetail.deliveryDriver', 'Delivery Driver'), order.driverDelivery || '—', 1)
    y += 11
  }

  // Special notes
  if (order.specialNotes) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...GRAY_MID)
    doc.text(_('client.specialNotes', 'Special Notes'), margin, y)
    y += 4.5
    doc.setFontSize(8.5)
    doc.setTextColor(...BRAND_DARK)
    doc.setFont('helvetica', 'normal')
    const wrapped = doc.splitTextToSize(order.specialNotes, contentW)
    doc.text(wrapped, margin, y)
    y += wrapped.length * 4.5 + 2
  }

  y += 4

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
      _('orderDetail.unitPrice', 'Unit Price'),
      _('orderDetail.lineTotal', 'Line Total'),
    ]],
    body: itemRows.length ? itemRows : [['—', _('orderDetail.noItems', 'No items recorded'), '', '', '']],
    margin: { left: margin, right: margin },
    tableWidth: contentW,
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      textColor: [...BRAND_DARK],
      lineColor: [229, 231, 235],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [...BRAND_PRIMARY],
      textColor: [...WHITE],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [...GRAY_LIGHT],
    },
    columnStyles: {
      0: { cellWidth: 22 },
      2: { halign: 'right', cellWidth: 14 },
      3: { halign: 'right', cellWidth: 22 },
      4: { halign: 'right', cellWidth: 22 },
    },
  })

  y = doc.lastAutoTable.finalY + 4

  /* ── TOTAL ROW ── */
  filledRect(doc, margin, y, contentW, 9, BRAND_LIGHT)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...BRAND_PRIMARY)
  doc.text(_('orderDetail.orderTotal', 'Order Total'), margin + 3, y + 6)
  doc.text(`€${(order.total ?? 0).toFixed(2)}`, pageW - margin - 3, y + 6, { align: 'right' })
  y += 14

  /* ── SECTION: STATUS TIMELINE ── */
  if (order.timeline?.length) {
    sectionTitle(_('orderDetail.statusTimeline', 'Status Timeline'))

    for (const step of order.timeline) {
      // Dot
      doc.setFillColor(...statusColor(step.status))
      doc.circle(margin + 2, y + 1.5, 1.5, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(...BRAND_DARK)
      doc.text(String(step.status), margin + 6, y + 2.5)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...GRAY_MID)
      doc.text(String(step.date || ''), pageW - margin, y + 2.5, { align: 'right' })

      y += 7

      // Vertical connector line (skip for last)
      if (step !== order.timeline.at(-1)) {
        doc.setDrawColor(209, 213, 219) // gray-300
        doc.setLineWidth(0.3)
        doc.line(margin + 2, y - 5, margin + 2, y)
      }
    }
    y += 4
  }

  /* ── FOOTER ── */
  const footerY = pageH - 12
  doc.setDrawColor(...BRAND_LIGHT)
  doc.setLineWidth(0.4)
  doc.line(margin, footerY - 3, pageW - margin, footerY - 3)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...GRAY_MID)

  const generatedOn = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
  doc.text(`StayCare — ${_('orderPdf.generatedOn', 'Generated on')} ${generatedOn}`, margin, footerY)
  doc.text(_('orderPdf.confidential', 'Confidential — For internal use only'), pageW - margin, footerY, { align: 'right' })

  /* ── SAVE ── */
  doc.save(`order-${order.id}.pdf`)
}
