import * as XLSX from 'xlsx'

export function useReportExport(t, deps) {
  function exportToExcel() {
    const {
      reportPeriodType,
      selectedMonth,
      selectedYear,
      monthOptions,
      ordersByClient,
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

    // Client Summary sheet — built from the ordersByClient computed (backend data)
    const clientRows = (ordersByClient?.value ?? []).map(c => ({
      Client:           c.client,
      'Total Orders':   c.orders,
      'Total Revenue (€)': c.revenue,
    }))

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(clientRows.length ? clientRows : [{ Client: 'No data' }]),
      'Client Summary'
    )

    const sla = slaReport.value
    const metricsRows = [
      { Metric: periodMetricLabel,       Value: periodLabel },
      { Metric: 'On Time',               Value: `${sla.onTime}%` },
      { Metric: 'Late',                  Value: `${sla.late}%` },
      { Metric: 'Critical',              Value: `${sla.critical}%` },
      { Metric: 'Avg Processing Time',   Value: `${sla.avgProcessingHours}h` },
      { Metric: 'Avg Delivery Time',     Value: `${sla.avgDeliveryHours}h` },
      { Metric: 'Total Clients',         Value: clientsList.value.length },
      { Metric: 'Active Drivers',        Value: driversList.value.filter(d => d.status === 'Active').length },
      { Metric: 'Total Revenue',         Value: `€${totalRevenue.value.toLocaleString()}` },
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
