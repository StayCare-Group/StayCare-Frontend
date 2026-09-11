import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildOrderPdfDoc, generateOrderPdf, printOrderPdf } from '@/utils/generateOrderPdf.js'

// Mock jsPDF and jspdf-autotable
const mockSave = vi.fn()
const mockAutoPrint = vi.fn()
const mockOutput = vi.fn().mockReturnValue(new Blob(['dummy pdf'], { type: 'application/pdf' }))

vi.mock('jspdf', () => {
  return {
    default: class MockJsPDF {
      internal = {
        pageSize: {
          getWidth: () => 102,
          getHeight: () => 152,
        },
      }
      lastAutoTable = { finalY: 50 }
      setTextColor = vi.fn()
      setFont = vi.fn()
      setFontSize = vi.fn()
      text = vi.fn()
      getTextWidth = vi.fn().mockReturnValue(10)
      setDrawColor = vi.fn()
      setLineWidth = vi.fn()
      line = vi.fn()
      rect = vi.fn()
      splitTextToSize = vi.fn((str) => [str])
      save = mockSave
      autoPrint = mockAutoPrint
      output = mockOutput
    },
  }
})

vi.mock('jspdf-autotable', () => {
  return {
    default: vi.fn(),
  }
})

describe('generateOrderPdf utils', () => {
  const mockOrder = {
    id: 'ORD-1001',
    client: 'Hotel Sunset',
    serviceType: 'Standard (48h)',
    pickupDate: '2026-03-01',
    pickupTimeWindow: '10:00 - 12:00',
    pickupAddress: 'Av. Principal 123',
    estimatedBags: 3,
    actualBags: 3,
    driverPickup: 'Driver John',
    specialNotes: 'Fragile linens',
    status: 'ready_to_delivery',
    statusLabel: 'Ready for Delivery',
    items: [
      { itemId: 'item-1', code: 'SHT', name: 'Sheet', qty: 5, qtyGood: 4, qtyBad: 1, qtyStained: 0 },
      { itemId: 'item-2', code: 'TWL', name: 'Towel', qty: 10, qtyGood: 10, qtyBad: 0, qtyStained: 0 },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('buildOrderPdfDoc creates and returns a jsPDF document instance', () => {
    const doc = buildOrderPdfDoc(mockOrder)
    expect(doc).toBeDefined()
    expect(doc.internal.pageSize.getWidth()).toBe(102)
    expect(doc.internal.pageSize.getHeight()).toBe(152)
  })

  it('generateOrderPdf calls doc.save with order ID', () => {
    generateOrderPdf(mockOrder)
    expect(mockSave).toHaveBeenCalledWith('order-ORD-1001.pdf')
  })

  it('printOrderPdf calls doc.autoPrint and prepares blob for printing', () => {
    const createElementSpy = vi.spyOn(document, 'createElement')
    const appendChildSpy = vi.spyOn(document.body, 'appendChild')

    printOrderPdf(mockOrder)

    expect(mockAutoPrint).toHaveBeenCalled()
    expect(mockOutput).toHaveBeenCalledWith('blob')
    expect(createElementSpy).toHaveBeenCalledWith('iframe')
    expect(appendChildSpy).toHaveBeenCalled()

    createElementSpy.mockRestore()
    appendChildSpy.mockRestore()
  })
})
