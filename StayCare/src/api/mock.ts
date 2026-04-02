import {
  laundryItems,
  detailedOrders,
  detailedInvoices,
  driverRoute,
  clientsList,
  driversList,
  staffList,
  facilityInventory,
} from '../data/extendedMockData'

const USE_MOCK = String(import.meta.env.VITE_USE_MOCK_DATA || '').toLowerCase() === 'true'
export const isMockEnabled = import.meta.env.DEV && USE_MOCK

const SESSION_KEY = 'staycare-mock-user-id'

function wait(ms = 120) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function clone(data: any) {
  return JSON.parse(JSON.stringify(data))
}

function jsonBody(options: RequestInit = {}) {
  if (!options.body || typeof options.body !== 'string') return {}
  try {
    return JSON.parse(options.body)
  } catch {
    return {}
  }
}

function mapRole(role: string) {
  const v = String(role || '').toLowerCase()
  if (v.includes('driver')) return 'driver'
  if (v.includes('facility') || v === 'staff') return 'staff'
  if (v.includes('admin')) return 'admin'
  return 'client'
}

const clients = clientsList.map((c, idx) => ({
  _id: c.id,
  company_name: c.name,
  email: c.contact,
  phone: c.phone,
  billing_address: c.address,
  pricing_tier: c.type?.toLowerCase() === 'hotel' ? 'standard' : 'custom',
  credits_terms_days: c.creditTerms?.includes('30') ? 30 : 0,
  properties: [
    {
      _id: `PROP-${idx + 1}`,
      address: c.address,
      city: 'Malta',
      lat: 35.8989 + idx * 0.01,
      lng: 14.5146 + idx * 0.01,
    },
  ],
}))

const users: any[] = [
  {
    _id: 'USR-ADMIN',
    name: 'Admin Demo',
    email: 'admin@staycare.dev',
    phone: '+356 7000 0001',
    role: 'admin',
    language: 'en',
    is_active: true,
    _password: '123456',
  },
  {
    _id: 'USR-CLIENT',
    name: 'Client Demo',
    email: 'client@staycare.dev',
    phone: '+356 7000 0002',
    role: 'client',
    language: 'en',
    is_active: true,
    client: clients[0]?._id,
    _password: '123456',
  },
]

driversList.forEach((d, i) => {
  users.push({
    _id: d.id,
    name: d.name,
    email: d.email,
    phone: d.phone,
    role: 'driver',
    language: 'en',
    is_active: d.status !== 'Inactive' && d.status !== 'Off Duty',
    _password: '123456',
    _vehicle: d.plate,
    _zone: d.zone,
    _sort: i,
  })
})

staffList.forEach((s) => {
  users.push({
    _id: s.id,
    name: s.name,
    email: s.email,
    phone: s.phone,
    role: mapRole(s.role),
    language: 'en',
    is_active: s.status !== 'Inactive',
    _password: '123456',
  })
})

const items: any[] = laundryItems.map((i, idx) => ({
  _id: `ITM-${idx + 1}`,
  item_code: i.code,
  name: i.name,
  base_price: i.unitPrice,
  active: true,
}))

function toBackendStatus(displayStatus: string) {
  const s = String(displayStatus || '').toLowerCase()
  if (s.includes('pending')) return 'Pending'
  if (s.includes('picked up')) return 'Assigned'
  if (s.includes('transit')) return 'Transit'
  if (s.includes('received')) return 'Arrived'
  if (s.includes('sorting')) return 'Arrived'
  if (s.includes('washing')) return 'Washing'
  if (s.includes('drying')) return 'Drying'
  if (s.includes('ironing')) return 'Ironing'
  if (s.includes('quality')) return 'QualityCheck'
  if (s.includes('ready')) return 'ReadyToDeliver'
  if (s.includes('out for delivery')) return 'Collected'
  if (s.includes('delivered') || s.includes('completed')) return 'Invoiced'
  return 'Pending'
}

function driverByName(name: string) {
  return users.find((u) => u.role === 'driver' && u.name === name) || null
}

function clientByName(name: string) {
  return clients.find((c) => c.company_name === name) || clients[0] || null
}

const orders: any[] = detailedOrders.map((o) => {
  const client = clientByName(o.client)
  const pickupDriver = driverByName(o.driverPickup || '') || users.find((u) => u.role === 'driver')
  const window = o.pickupTimeWindow?.split('-').map((v: string) => v.trim()) || []
  const start = `${o.pickupDate}T${window[0] || '09:00'}:00Z`
  const end = `${o.pickupDate}T${window[1] || '11:00'}:00Z`

  return {
    _id: o.id,
    order_number: o.id,
    client,
    property: client?.properties?.[0]?._id,
    pickup_date: o.pickupDate,
    pickup_window: {
      start_time: start,
      end_time: end,
    },
    service_type: o.serviceType.toLowerCase().includes('express') ? 'express' : 'standard',
    status: toBackendStatus(o.status),
    estimated_bags: o.estimatedBags,
    actual_bags: o.actualBags,
    special_notes: o.specialNotes,
    items: (o.items || []).map((it: any) => ({
      item_code: it.code,
      name: it.name,
      quantity: it.qty,
      unit_price: it.unitPrice,
    })),
    status_history: (o.timeline || []).map((t: any) => ({
      status: toBackendStatus(t.status),
      timestamp: new Date().toISOString(),
    })),
    pricing_snapshot: {
      total: o.total,
    },
    assigned_driver: pickupDriver
      ? {
          _id: pickupDriver._id,
          name: pickupDriver.name,
          role: pickupDriver.role,
        }
      : null,
    driver: pickupDriver
      ? {
          _id: pickupDriver._id,
          name: pickupDriver.name,
          role: pickupDriver.role,
        }
      : null,
    created_at: new Date().toISOString(),
  }
})

const invoices: any[] = detailedInvoices.map((inv) => ({
  _id: inv.id,
  invoice_number: inv.id,
  orders: [inv.orderId],
  client: clientByName(inv.client),
  issue_date: inv.issueDate,
  due_date: inv.dueDate,
  status: String(inv.status || '').toLowerCase(),
  line_items: (inv.items || []).map((it: any) => ({
    description: it.name,
    quantity: it.qty,
    unit_price: it.unitPrice,
    total_price: it.total,
  })),
  subtotal: inv.subtotal,
  vat_amount: inv.vat,
  total: inv.grandTotal,
  payments: inv.paymentMethod
    ? [{ method: String(inv.paymentMethod).toLowerCase(), amount: inv.grandTotal, paid_at: new Date().toISOString() }]
    : [],
}))

const routes: any[] = [
  {
    _id: 'RTE-001',
    route_date: `${driverRoute.date}T12:00:00.000Z`,
    status: 'active',
    area: 'Valletta / Sliema',
    driver: (() => {
      const d = users.find((u) => u.role === 'driver' && u.name === driverRoute.driverName)
      return d ? { _id: d._id, name: d.name, role: 'driver' } : null
    })(),
    orders: (driverRoute.stops || [])
      .map((s: any) => orders.find((o) => o.order_number === s.orderId || o._id === s.orderId))
      .filter(Boolean),
  },
]

const machines: any[] = facilityInventory.map((m, idx) => {
  const lcType = String(m.type || '').toLowerCase()
  const type = lcType.includes('washer') ? 'washer' : lcType.includes('dryer') ? 'dryer' : 'iron'
  const lcStatus = String(m.status || '').toLowerCase()
  const status = lcStatus.includes('running') || lcStatus.includes('use') ? 'running' : lcStatus.includes('maint') ? 'maintenance' : 'available'
  const current = orders.find((o) => o.order_number === m.currentOrder)
  return {
    _id: `MC-${idx + 1}`,
    name: m.machine,
    type,
    capacity: m.capacity,
    status,
    current_order: current ? { _id: current._id, order_number: current.order_number } : null,
    started_at: current ? new Date().toISOString() : null,
  }
})

const invitations: any[] = [
  {
    token: 'demo-invite',
    email: 'invited.user@staycare.dev',
    role: 'driver',
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    used: false,
  },
]

function publicUser(user: any) {
  if (!user) return null
  const clientObj = typeof user.client === 'string' ? clients.find((c) => c._id === user.client) : user.client
  return {
    _id: user._id,
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    language: user.language || 'en',
    is_active: user.is_active !== false,
    client: clientObj || null,
  }
}

function saveSession(userId: string | null) {
  if (userId) {
    localStorage.setItem(SESSION_KEY, userId)
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
}

function currentUser() {
  const userId = localStorage.getItem(SESSION_KEY)
  if (!userId) return null
  return users.find((u) => u._id === userId) || null
}

function ensureAuth() {
  const user = currentUser()
  if (!user) {
    const err: any = new Error('Unauthorized')
    err.status = 401
    throw err
  }
  return user
}

function findOrder(id: string) {
  return orders.find((o) => o._id === id || o.order_number === id)
}

function normalizePath(path: string) {
  const [pathname, query = ''] = path.split('?')
  return { pathname, query: new URLSearchParams(query) }
}

export async function mockAuthCall(action: string, payload?: any) {
  await wait()

  if (action === 'login') {
    const email = String(payload?.email || '').toLowerCase().trim()
    const password = String(payload?.password || '').trim()
    let user = users.find((u) => String(u.email).toLowerCase() === email)

    if (!user && email) {
      user = {
        _id: `USR-${Date.now()}`,
        name: email.split('@')[0],
        email,
        phone: '',
        role: 'client',
        language: 'en',
        is_active: true,
        client: clients[0]?._id,
        _password: password || '123456',
      }
      users.push(user)
    }

    if (!user || (user._password && password && user._password !== password)) {
      const err: any = new Error('Invalid credentials.')
      err.status = 401
      throw err
    }

    saveSession(user._id)
    return { user: publicUser(user) }
  }

  if (action === 'refresh') {
    const user = currentUser()
    if (!user) throw new Error('refresh failed')
    return { user: publicUser(user) }
  }

  if (action === 'logout') {
    saveSession(null)
    return { success: true }
  }

  if (action === 'register') {
    const email = String(payload?.email || '').toLowerCase().trim()
    if (!email) throw new Error('Email is required')
    if (users.some((u) => String(u.email).toLowerCase() === email)) {
      throw new Error('User already exists')
    }

    const created = {
      _id: `USR-${Date.now()}`,
      name: payload?.name || 'New User',
      email,
      phone: payload?.phone || '',
      role: 'client',
      language: payload?.language || 'en',
      is_active: true,
      client: clients[0]?._id,
      _password: payload?.password || '123456',
    }
    users.push(created)
    return { user: publicUser(created) }
  }

  if (action === 'forgotPassword') {
    return { success: true }
  }

  if (action === 'resetPassword') {
    return { success: true }
  }

  throw new Error('Unsupported mock auth action')
}

export async function mockApiFetch(path: string, options: RequestInit = {}) {
  await wait()

  const method = String(options.method || 'GET').toUpperCase()
  const body = jsonBody(options)
  const { pathname, query } = normalizePath(path)

  // Auth profile
  if (pathname === '/api/auth/me' && method === 'GET') {
    const me = ensureAuth()
    return { user: publicUser(me) }
  }

  if (pathname === '/api/auth/me' && method === 'PATCH') {
    const me = ensureAuth()
    Object.assign(me, body || {})
    return { user: publicUser(me) }
  }

  if (pathname === '/api/auth/password' && method === 'PATCH') {
    ensureAuth()
    return { success: true }
  }

  // Users
  if (pathname === '/api/users' && method === 'GET') {
    let list = users.map((u) => publicUser(u))
    const role = String(query.get('role') || '').trim().toLowerCase()
    const isActive = query.get('is_active')

    if (role) {
      list = list.filter((u) => String(u?.role || '').toLowerCase() === role)
    }
    if (isActive === 'true' || isActive === 'false') {
      const activeBool = isActive === 'true'
      list = list.filter((u) => Boolean(u?.is_active) === activeBool)
    }

    return list
  }

  if (pathname.startsWith('/api/users/') && method === 'GET') {
    const id = pathname.split('/').pop()
    const found = users.find((u) => u._id === id)
    if (!found) throw new Error('User not found')
    const user = publicUser(found)
    const linkedClient = typeof found.client === 'string'
      ? clients.find((c) => c._id === found.client)
      : found.client

    return {
      user,
      client_profile: linkedClient
        ? {
            contact_person: linkedClient.contact_person || user?.name || '',
            billing_address: linkedClient.billing_address || '',
            credits_terms_days: linkedClient.credits_terms_days || 0,
            pricing_tier: linkedClient.pricing_tier || 'standard',
          }
        : null,
      properties: Array.isArray(linkedClient?.properties) ? linkedClient.properties : [],
    }
  }

  // Items
  if (pathname === '/api/items' && method === 'GET') {
    const activeOnly = query.get('active') === 'true'
    return clone(activeOnly ? items.filter((i) => i.active !== false) : items)
  }

  if (pathname === '/api/items' && method === 'POST') {
    const created = {
      _id: `ITM-${Date.now()}`,
      item_code: body.item_code || body.code || `ITM-${items.length + 1}`,
      name: body.name || 'Item',
      base_price: Number(body.base_price ?? body.unitPrice ?? 0),
      active: body.active !== false,
    }
    items.unshift(created)
    return clone(created)
  }

  if (pathname.startsWith('/api/items/') && method === 'PATCH') {
    const id = pathname.split('/').pop()
    const found = items.find((i) => i._id === id)
    if (!found) throw new Error('Item not found')
    Object.assign(found, body)
    return clone(found)
  }

  if (pathname.startsWith('/api/items/') && method === 'DELETE') {
    const id = pathname.split('/').pop()
    const idx = items.findIndex((i) => i._id === id)
    if (idx >= 0) items.splice(idx, 1)
    return { success: true }
  }

  // Orders
  if (pathname === '/api/orders' && method === 'GET') {
    return clone(orders)
  }

  if (pathname === '/api/orders' && method === 'POST') {
    const client = clients.find((c) => c._id === body.client || c._id === body.client_id) || clients[0]
    const created = {
      _id: `ORD-${Date.now()}`,
      order_number: `ORD-${Date.now()}`,
      client,
      property: body.property || client?.properties?.[0]?._id,
      pickup_date: body.pickup_date || new Date().toISOString().slice(0, 10),
      pickup_window: body.pickup_window || null,
      service_type: body.service_type || 'standard',
      status: 'Pending',
      estimated_bags: Number(body.estimated_bags ?? 0),
      actual_bags: null,
      special_notes: body.special_notes || '',
      items: body.items || [],
      status_history: [],
      pricing_snapshot: { total: Number(body.total ?? body.pricing_snapshot?.total ?? 0) },
      created_at: new Date().toISOString(),
    }
    orders.unshift(created)
    return clone(created)
  }

  if (pathname.startsWith('/api/orders/') && method === 'GET') {
    const id = pathname.split('/')[3]
    const found = findOrder(id)
    if (!found) throw new Error('Order not found')
    return clone(found)
  }

  if (/^\/api\/orders\/[^/]+\/status$/.test(pathname) && method === 'PATCH') {
    const id = pathname.split('/')[3]
    const found = findOrder(id)
    if (!found) throw new Error('Order not found')
    found.status = body.status || found.status
    return clone(found)
  }

  if (/^\/api\/orders\/[^/]+\/(pickup|receive|deliver)$/.test(pathname) && method === 'PATCH') {
    const id = pathname.split('/')[3]
    const action = pathname.split('/')[4]
    const found = findOrder(id)
    if (!found) throw new Error('Order not found')

    if (action === 'pickup') found.status = 'Transit'
    if (action === 'receive') found.status = 'Arrived'
    if (action === 'deliver') found.status = 'Invoiced'

    if (typeof body.actual_bags === 'number') found.actual_bags = body.actual_bags
    if (body.notes) found.special_notes = body.notes
    return clone(found)
  }

  if (/^\/api\/orders\/[^/]+\/reassign$/.test(pathname) && method === 'PATCH') {
    const id = pathname.split('/')[3]
    const found = findOrder(id)
    const driver = users.find((u) => u._id === body.driver_id)
    if (!found) throw new Error('Order not found')
    if (driver) found.assigned_driver = { _id: driver._id, name: driver.name, role: 'driver' }
    return clone(found)
  }

  if (/^\/api\/orders\/[^/]+\/reschedule$/.test(pathname) && method === 'PATCH') {
    const id = pathname.split('/')[3]
    const found = findOrder(id)
    if (!found) throw new Error('Order not found')
    found.pickup_date = body.pickup_date || found.pickup_date
    found.pickup_window = body.pickup_window || found.pickup_window
    return clone(found)
  }

  // Invoices
  if (pathname === '/api/invoices' && method === 'GET') {
    return clone(invoices)
  }

  if (pathname === '/api/invoices' && method === 'POST') {
    const client = clients.find((c) => c._id === body.client || c._id === body.client_id) || clients[0]
    const created = {
      _id: `INV-${Date.now()}`,
      invoice_number: `INV-${Date.now()}`,
      orders: body.orders || [],
      client,
      issue_date: body.issue_date || new Date().toISOString().slice(0, 10),
      due_date: body.due_date || new Date().toISOString().slice(0, 10),
      status: 'pending',
      line_items: body.line_items || [],
      subtotal: Number(body.subtotal ?? 0),
      vat_amount: Number(body.vat_amount ?? 0),
      total: Number(body.total ?? 0),
      payments: [],
    }
    invoices.unshift(created)
    return clone(created)
  }

  if (pathname.startsWith('/api/invoices/') && method === 'GET') {
    const id = pathname.split('/')[3]
    const found = invoices.find((i) => i._id === id || i.invoice_number === id)
    if (!found) throw new Error('Invoice not found')
    return clone(found)
  }

  if (/^\/api\/invoices\/[^/]+\/payments$/.test(pathname) && method === 'POST') {
    const id = pathname.split('/')[3]
    const found = invoices.find((i) => i._id === id || i.invoice_number === id)
    if (!found) throw new Error('Invoice not found')
    found.status = 'paid'
    found.payments = [
      {
        method: String(body.method || 'card').toLowerCase(),
        amount: Number(body.amount ?? found.total ?? 0),
        paid_at: new Date().toISOString(),
      },
    ]
    return clone(found)
  }

  // Routes
  if (pathname === '/api/routes' && method === 'GET') {
    return clone(routes)
  }

  if (pathname === '/api/routes' && method === 'POST') {
    const driver = users.find((u) => u._id === body.driver)
    const routeOrders = (body.orders || []).map((id: string) => findOrder(id)).filter(Boolean)
    const created = {
      _id: `RTE-${Date.now()}`,
      route_date: body.route_date || new Date().toISOString(),
      area: body.area || 'General',
      status: 'active',
      driver: driver ? { _id: driver._id, name: driver.name, role: driver.role } : null,
      orders: routeOrders,
    }

    routeOrders.forEach((o: any) => {
      o.status = 'Assigned'
      if (driver) {
        o.driver = { _id: driver._id, name: driver.name, role: driver.role }
        o.assigned_driver = { _id: driver._id, name: driver.name, role: driver.role }
      }
    })

    routes.unshift(created)
    return clone(created)
  }

  if (pathname.startsWith('/api/routes/') && method === 'GET') {
    const id = pathname.split('/')[3]
    const found = routes.find((r) => r._id === id)
    if (!found) throw new Error('Route not found')
    return clone(found)
  }

  if (/^\/api\/routes\/[^/]+\/status$/.test(pathname) && method === 'PATCH') {
    const id = pathname.split('/')[3]
    const found = routes.find((r) => r._id === id)
    if (!found) throw new Error('Route not found')
    found.status = body.status || found.status
    return clone(found)
  }

  if (pathname.startsWith('/api/routes/') && method === 'DELETE') {
    const id = pathname.split('/')[3]
    const idx = routes.findIndex((r) => r._id === id)
    if (idx >= 0) {
      const route = routes[idx]
      ;(route.orders || []).forEach((o: any) => {
        if (o) o.status = 'Pending'
      })
      routes.splice(idx, 1)
    }
    return { success: true }
  }

  // Invitations
  if (pathname === '/api/invitations' && method === 'GET') {
    return clone(invitations)
  }

  if (pathname === '/api/invitations' && method === 'POST') {
    const token = `mock-${Date.now()}`
    const invite = {
      token,
      email: body.email,
      role: body.role || 'driver',
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      used: false,
      invite_url: `${window.location.origin}/invite/${token}`,
    }
    invitations.unshift(invite)
    return { invitation: clone(invite) }
  }

  if (/^\/api\/invitations\/[^/]+\/validate$/.test(pathname) && method === 'GET') {
    const token = pathname.split('/')[3]
    const inv = invitations.find((i) => i.token === token)
    if (!inv || inv.used) {
      const err: any = new Error('Invalid invitation')
      err.status = 404
      throw err
    }
    if (new Date(inv.expires_at).getTime() < Date.now()) {
      const err: any = new Error('Invitation expired')
      err.status = 410
      throw err
    }
    return { invitation: clone(inv) }
  }

  if (/^\/api\/invitations\/[^/]+\/register$/.test(pathname) && method === 'POST') {
    const token = pathname.split('/')[3]
    const inv = invitations.find((i) => i.token === token)
    if (!inv || inv.used) throw new Error('Registration failed. The link may have expired.')

    const created = {
      _id: `USR-${Date.now()}`,
      name: body.name || 'Invited User',
      email: inv.email,
      phone: body.phone || '',
      role: mapRole(inv.role),
      language: body.language || 'en',
      is_active: true,
      _password: body.password || '123456',
    }

    users.push(created)
    inv.used = true
    saveSession(created._id)

    return { user: publicUser(created) }
  }

  // Facility / machines
  if (pathname === '/api/facility/machines' && method === 'GET') {
    return clone(machines)
  }

  if (pathname === '/api/facility/machines' && method === 'POST') {
    const created = {
      _id: `MC-${Date.now()}`,
      name: body.name || `Machine ${machines.length + 1}`,
      type: body.type || 'washer',
      capacity: body.capacity || 'N/A',
      status: 'available',
      current_order: null,
      started_at: null,
    }
    machines.unshift(created)
    return clone(created)
  }

  if (pathname === '/api/facility/machines/seed' && method === 'POST') {
    return clone(machines)
  }

  if (/^\/api\/facility\/machines\/[^/]+\/assign$/.test(pathname) && method === 'POST') {
    const id = pathname.split('/')[4]
    const machine = machines.find((m) => m._id === id)
    const order = findOrder(body.order_id)
    if (!machine || !order) throw new Error('Assign failed')
    machine.current_order = { _id: order._id, order_number: order.order_number }
    machine.status = 'running'
    machine.started_at = new Date().toISOString()
    return clone(machine)
  }

  if (/^\/api\/facility\/machines\/[^/]+\/release$/.test(pathname) && method === 'POST') {
    const id = pathname.split('/')[4]
    const machine = machines.find((m) => m._id === id)
    if (!machine) throw new Error('Release failed')
    machine.current_order = null
    machine.status = 'available'
    machine.started_at = null
    return clone(machine)
  }

  // Safe fallback for unknown endpoints in dev
  return { success: true }
}
