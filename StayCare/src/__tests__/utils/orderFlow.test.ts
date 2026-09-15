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
    it('normaliza strings a snake_case y mapea PascalCase de MySQL', () => {
      expect(normalizeStatus('pending')).toBe('pending')
      expect(normalizeStatus('transit')).toBe('transit')
      expect(normalizeStatus('arrived')).toBe('arrived')
      expect(normalizeStatus('QualityCheck')).toBe('quality_check')
      expect(normalizeStatus('ReadyToDeliver')).toBe('ready_to_delivery')
      expect(normalizeStatus('quality_check')).toBe('quality_check')
      expect(normalizeStatus('ready_to_delivery')).toBe('ready_to_delivery')
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
    it('permite editar ordenes desde pending hasta quality_check', () => {
      expect(isEditableStatus('pending')).toBe(true)
      expect(isEditableStatus('assigned')).toBe(true)
      expect(isEditableStatus('rescheduled')).toBe(true)
      expect(isEditableStatus('transit')).toBe(true)
      expect(isEditableStatus('arrived')).toBe(true)
      expect(isEditableStatus('washing')).toBe(true)
      expect(isEditableStatus('drying')).toBe(true)
      expect(isEditableStatus('ironing')).toBe(true)
      expect(isEditableStatus('quality_check')).toBe(true)
    })

    it('bloquea la edicion a partir de ready_to_delivery y estados posteriores', () => {
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
