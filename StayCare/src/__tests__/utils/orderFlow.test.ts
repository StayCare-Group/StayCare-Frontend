import { describe, it, expect } from 'vitest'
import {
  normalizeStatus,
  isCancelableStatus,
  isEditableStatus,
  isPickupAssignableStatus,
  isDeliveryAssignableStatus,
} from '@/utils/orderFlow'

describe('orderFlow utils', () => {
  describe('normalizeStatus', () => {
    it('normaliza valores con guiones, espacios y variantes legadas', () => {
      expect(normalizeStatus('pending_pickup')).toBe('pending')
      expect(normalizeStatus('in_transit')).toBe('transit')
      expect(normalizeStatus('received_at_facility')).toBe('arrived')
      expect(normalizeStatus('quality_control')).toBe('quality_check')
      expect(normalizeStatus('ready_to_deliver')).toBe('ready_to_delivery')
      expect(normalizeStatus('out_for_delivery')).toBe('collected')
      expect(normalizeStatus('cancelado')).toBe('cancelled')
      expect(normalizeStatus('')).toBe('')
      expect(normalizeStatus(undefined)).toBe('')
    })
  })

  describe('isCancelableStatus', () => {
    it('permite cancelar solo en pending y assigned', () => {
      expect(isCancelableStatus('pending')).toBe(true)
      expect(isCancelableStatus('assigned')).toBe(true)
      expect(isCancelableStatus('transit')).toBe(false)
      expect(isCancelableStatus('arrived')).toBe(false)
      expect(isCancelableStatus('washing')).toBe(false)
      expect(isCancelableStatus('completed')).toBe(false)
    })
  })

  describe('isEditableStatus', () => {
    it('permite editar ordenes antes de la recepcion en planta (pending, assigned, rescheduled, transit)', () => {
      expect(isEditableStatus('pending')).toBe(true)
      expect(isEditableStatus('assigned')).toBe(true)
      expect(isEditableStatus('rescheduled')).toBe(true)
      expect(isEditableStatus('transit')).toBe(true)
      expect(isEditableStatus('in_transit')).toBe(true)
    })

    it('bloquea la edicion a partir del receive y estados posteriores', () => {
      expect(isEditableStatus('arrived')).toBe(false)
      expect(isEditableStatus('received_at_facility')).toBe(false)
      expect(isEditableStatus('washing')).toBe(false)
      expect(isEditableStatus('drying')).toBe(false)
      expect(isEditableStatus('ironing')).toBe(false)
      expect(isEditableStatus('quality_check')).toBe(false)
      expect(isEditableStatus('ready_to_delivery')).toBe(false)
      expect(isEditableStatus('collected')).toBe(false)
      expect(isEditableStatus('delivered')).toBe(false)
      expect(isEditableStatus('completed')).toBe(false)
      expect(isEditableStatus('cancelled')).toBe(false)
      expect(isEditableStatus('')).toBe(false)
      expect(isEditableStatus(undefined)).toBe(false)
    })
  })

  describe('isPickupAssignableStatus & isDeliveryAssignableStatus', () => {
    it('isPickupAssignableStatus retorna true para pending, assigned, transit', () => {
      expect(isPickupAssignableStatus('pending')).toBe(true)
      expect(isPickupAssignableStatus('assigned')).toBe(true)
      expect(isPickupAssignableStatus('transit')).toBe(true)
      expect(isPickupAssignableStatus('arrived')).toBe(false)
    })

    it('isDeliveryAssignableStatus retorna true para ready_to_delivery, collected', () => {
      expect(isDeliveryAssignableStatus('ready_to_delivery')).toBe(true)
      expect(isDeliveryAssignableStatus('collected')).toBe(true)
      expect(isDeliveryAssignableStatus('arrived')).toBe(false)
    })
  })
})
