import * as XLSX from 'xlsx'

export function useReportExport(t, deps) {
  function exportToExcel() {
    const {
      reportPeriodType,
      selectedMonth,
      selectedYear,
      monthOptions,
      orders,
      invoices,
      clientsList,
      driversList,
      slaReport,
      totalRevenue,
    } = deps

    const wb = XLSX.utils.book_new()
    const isYear = reportPeriodType.value === 'year'
    const periodLabel = isYear
      ? String(selectedYear.value)
      : (monthOptions.find(m => m.value === selectedMonth.value)?.label ?? selectedMonth.value)
    const periodMetricLabel = isYear ? 'Year' : 'Month'

    const clientMap = {}
    for (const o of orders.value) {
      const name = o.client || t('reports.unknown')
      if (!clientMap[name]) clientMap[name] = { orders: 0, invoices: 0, invoiced: 0, paid: 0 }
      clientMap[name].orders++
    }
    for (const inv of invoices.value) {
      const name = inv.client || t('reports.unknown')
      if (!clientMap[name]) clientMap[name] = { orders: 0, invoices: 0, invoiced: 0, paid: 0 }
      clientMap[name].invoices++
      clientMap[name].invoiced += inv.grandTotal ?? 0
      if (inv.status === 'Paid') clientMap[name].paid += inv.grandTotal ?? 0
    }

    const clientRows = Object.entries(clientMap)
      .sort(([, a], [, b]) => b.invoiced - a.invoiced)
      .map(([name, d]) => ({
        Client: name,
        Orders: d.orders,
        Invoices: d.invoices,
        'Total Invoiced (€)': d.invoiced,
        'Total Paid (€)': d.paid,
      }))

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(clientRows.length ? clientRows : [{ Client: 'No data' }]),
      'Client Summary'
    )

    const orderRows = orders.value.map(o => ({
      'Order ID': o.id,
      Client: o.client,
      'Pickup Date': o.pickupDate,
      'Service Type': o.serviceType,
      'Est. Bags': o.estimatedBags,
      'Actual Bags': o.actualBags ?? '',
      Status: o.status,
      'Total (€)': o.total,
    }))
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(orderRows.length ? orderRows : [{ 'Order ID': 'No data' }]),
      'Orders'
    )

    const invoiceRows = invoices.value.map(inv => ({
      'Invoice ID': inv.id,
      Order: inv.orderId,
      Client: inv.client,
      'Issue Date': inv.issueDate,
      'Due Date': inv.dueDate,
      Status: inv.status,
      'Total (€)': inv.grandTotal,
    }))
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(invoiceRows.length ? invoiceRows : [{ 'Invoice ID': 'No data' }]),
      'Invoices'
    )

    const sla = slaReport.value
    const metricsRows = [
      { Metric: periodMetricLabel, Value: periodLabel },
      { Metric: 'Total Orders', Value: orders.value.length },
      { Metric: 'Total Invoices', Value: invoices.value.length },
      { Metric: 'On Time', Value: `${sla.onTime}%` },
      { Metric: 'Late', Value: `${sla.late}%` },
      { Metric: 'Critical', Value: `${sla.critical}%` },
      { Metric: 'Avg Processing Time', Value: `${sla.avgProcessingHours}h` },
      { Metric: 'Avg Delivery Time', Value: `${sla.avgDeliveryHours}h` },
      { Metric: 'Total Clients', Value: clientsList.value.length },
      { Metric: 'Active Drivers', Value: driversList.value.filter(d => d.status === 'Active').length },
      { Metric: 'Total Revenue', Value: `€${totalRevenue.value.toLocaleString()}` },
    ]

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(metricsRows), 'SLA & Metrics')

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = isYear
      ? `StayCare-Report-${selectedYear.value}.xlsx`
      : `StayCare-Report-${selectedMonth.value}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return { exportToExcel }
}
