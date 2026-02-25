// ============================================================
// MOCK DATA — B2B Laundry Management System
// ============================================================

export const ROLES = ['Client', 'Driver', 'Facility Staff', 'Admin']

// ---------- CLIENT ----------
export const clientKPIs = [
  { label: 'Active Orders', value: 12, color: 'blue' },
  { label: 'In Progress', value: 7, color: 'yellow' },
  { label: 'Ready for Delivery', value: 3, color: 'green' },
  { label: 'Outstanding Balance', value: '$2,450', color: 'red' },
]

export const recentOrders = [
  { id: 'ORD-1024', date: '2026-02-24', items: 34, status: 'In Progress', total: '$245.00' },
  { id: 'ORD-1023', date: '2026-02-23', items: 18, status: 'Ready', total: '$132.50' },
  { id: 'ORD-1022', date: '2026-02-22', items: 52, status: 'Delivered', total: '$410.00' },
  { id: 'ORD-1021', date: '2026-02-21', items: 27, status: 'In Progress', total: '$198.75' },
  { id: 'ORD-1020', date: '2026-02-20', items: 41, status: 'Delivered', total: '$315.00' },
]

export const openInvoices = [
  { id: 'INV-3001', date: '2026-02-20', amount: '$410.00', due: '2026-03-02', status: 'Overdue' },
  { id: 'INV-3002', date: '2026-02-22', amount: '$245.00', due: '2026-03-04', status: 'Pending' },
  { id: 'INV-3003', date: '2026-02-23', amount: '$132.50', due: '2026-03-05', status: 'Pending' },
]

// ---------- DRIVER ----------
export const driverKPIs = [
  { label: "Today's Pickups", value: 6, color: 'blue' },
  { label: "Today's Deliveries", value: 4, color: 'green' },
  { label: 'Route Progress', value: '58%', color: 'yellow' },
]

export const driverStops = [
  { id: 1, client: 'Grand Hotel Oslo', address: 'Karl Johans gate 31', bags: 12, status: 'Completed', type: 'Pickup' },
  { id: 2, client: 'Comfort Hotel', address: 'Storgata 22', bags: 8, status: 'In Transit', type: 'Pickup' },
  { id: 3, client: 'Scandic Victoria', address: 'Rosenkrantz gate 13', bags: 15, status: 'Pending', type: 'Pickup' },
  { id: 4, client: 'Thon Hotel Opera', address: 'Dronning Eufemias gate 4', bags: 6, status: 'Pending', type: 'Delivery' },
  { id: 5, client: 'Radisson Blu Plaza', address: 'Sonja Henies plass 3', bags: 10, status: 'Pending', type: 'Delivery' },
  { id: 6, client: 'Clarion The Hub', address: 'Biskop Gunnerus gate 3', bags: 9, status: 'Pending', type: 'Pickup' },
]

// ---------- FACILITY ----------
export const facilityKPIs = [
  { label: 'Incoming', value: 14, color: 'blue' },
  { label: 'Washing', value: 8, color: 'cyan' },
  { label: 'Drying', value: 5, color: 'yellow' },
  { label: 'Ironing', value: 3, color: 'orange' },
  { label: 'QC', value: 4, color: 'purple' },
  { label: 'Ready', value: 6, color: 'green' },
]

export const kanbanOrders = {
  Received: [
    { id: 'ORD-1030', client: 'Grand Hotel Oslo', bags: 12, priority: 'High' },
    { id: 'ORD-1031', client: 'Comfort Hotel', bags: 8, priority: 'Normal' },
    { id: 'ORD-1032', client: 'Park Inn', bags: 5, priority: 'Normal' },
  ],
  Washing: [
    { id: 'ORD-1025', client: 'Scandic Victoria', bags: 15, priority: 'High' },
    { id: 'ORD-1026', client: 'Thon Hotel Opera', bags: 6, priority: 'Normal' },
  ],
  Drying: [
    { id: 'ORD-1022', client: 'Radisson Blu Plaza', bags: 10, priority: 'Normal' },
    { id: 'ORD-1023', client: 'Clarion The Hub', bags: 9, priority: 'Low' },
  ],
  Ironing: [
    { id: 'ORD-1020', client: 'Hotel Bristol', bags: 7, priority: 'High' },
  ],
  QC: [
    { id: 'ORD-1018', client: 'Grand Hotel Oslo', bags: 11, priority: 'Normal' },
    { id: 'ORD-1019', client: 'Comfort Hotel', bags: 4, priority: 'Normal' },
  ],
  Ready: [
    { id: 'ORD-1015', client: 'Scandic Victoria', bags: 13, priority: 'Normal' },
    { id: 'ORD-1016', client: 'Thon Hotel Opera', bags: 8, priority: 'Low' },
  ],
}

// ---------- ADMIN ----------
export const adminKPIs = [
  { label: 'Orders Today', value: 42, color: 'blue' },
  { label: 'Revenue This Month', value: '$28,450', color: 'green' },
  { label: 'VAT Collected', value: '$5,690', color: 'purple' },
  { label: 'SLA Compliance', value: '94%', color: 'yellow' },
]

export const adminChartData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  values: [38, 45, 42, 50, 48, 30, 42],
}

export const adminActivity = [
  { id: 1, action: 'New order placed', detail: 'ORD-1032 by Grand Hotel Oslo', time: '5 min ago' },
  { id: 2, action: 'Order completed', detail: 'ORD-1015 delivered to Scandic Victoria', time: '12 min ago' },
  { id: 3, action: 'Invoice paid', detail: 'INV-2998 — $315.00 by Radisson Blu', time: '25 min ago' },
  { id: 4, action: 'Driver assigned', detail: 'Route #7 assigned to Erik N.', time: '32 min ago' },
  { id: 5, action: 'SLA alert', detail: 'ORD-1020 approaching 24h limit', time: '1 hr ago' },
  { id: 6, action: 'New client onboarded', detail: 'Park Inn registered', time: '2 hr ago' },
]
