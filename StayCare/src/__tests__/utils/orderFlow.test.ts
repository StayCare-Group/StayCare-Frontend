import { describe, it, expect } from 'vitest'
import {
  normalizeStatus,
  isCancelableStatus,
  isEditableStatus,
  isPickupAssignableStatus,
  isDeliveryAssignableStatus,
  canAdvanceProcessingStage,
  canManageStageMachine,
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
    it('permite a admin y staff editar ordenes desde pending hasta quality_check', () => {
      expect(isEditableStatus('pending', true)).toBe(true)
      expect(isEditableStatus('assigned', true)).toBe(true)
      expect(isEditableStatus('rescheduled', true)).toBe(true)
      expect(isEditableStatus('transit', true)).toBe(true)
      expect(isEditableStatus('arrived', true)).toBe(true)
      expect(isEditableStatus('washing', true)).toBe(true)
      expect(isEditableStatus('drying', true)).toBe(true)
      expect(isEditableStatus('ironing', true)).toBe(true)
      expect(isEditableStatus('quality_check', true)).toBe(true)
    })

    it('bloquea a clientes y subusuarios una vez recibida la orden en planta (arrived onwards)', () => {
      expect(isEditableStatus('pending', false)).toBe(true)
      expect(isEditableStatus('assigned', false)).toBe(true)
      expect(isEditableStatus('rescheduled', false)).toBe(true)
      expect(isEditableStatus('transit', false)).toBe(true)
      expect(isEditableStatus('arrived', false)).toBe(false)
      expect(isEditableStatus('washing', false)).toBe(false)
      expect(isEditableStatus('drying', false)).toBe(false)
      expect(isEditableStatus('ironing', false)).toBe(false)
      expect(isEditableStatus('quality_check', false)).toBe(false)
    })

    it('bloquea la edicion a partir de ready_to_delivery y estados posteriores para todos los roles', () => {
      expect(isEditableStatus('ready_to_delivery', true)).toBe(false)
      expect(isEditableStatus('collected', true)).toBe(false)
      expect(isEditableStatus('delivered', true)).toBe(false)
      expect(isEditableStatus('completed', true)).toBe(false)
      expect(isEditableStatus('cancelled', true)).toBe(false)
      expect(isEditableStatus('', true)).toBe(false)
      expect(isEditableStatus(undefined, true)).toBe(false)
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

  describe('canAdvanceProcessingStage & canManageStageMachine', () => {
    it('permite a admin y staff avanzar todas las etapas de procesamiento y gestionar todas las maquinas', () => {
      for (const role of ['admin', 'staff']) {
        expect(canAdvanceProcessingStage('arrived', role)).toBe(true)
        expect(canAdvanceProcessingStage('washing', role)).toBe(true)
        expect(canAdvanceProcessingStage('drying', role)).toBe(true)
        expect(canAdvanceProcessingStage('ironing', role)).toBe(true)
        expect(canAdvanceProcessingStage('quality_check', role)).toBe(true)
        expect(canAdvanceProcessingStage('ready_to_delivery', role)).toBe(false)

        expect(canManageStageMachine('washing', 'washer', role)).toBe(true)
        expect(canManageStageMachine('drying', 'dryer', role)).toBe(true)
        expect(canManageStageMachine('ironing', 'iron', role)).toBe(true)
      }
    })

    it('restringe a operator para que solo pueda avanzar en ironing (hacia quality_check) y solo gestionar planchas en ironing', () => {
      expect(canAdvanceProcessingStage('arrived', 'operator')).toBe(false)
      expect(canAdvanceProcessingStage('washing', 'operator')).toBe(false)
      expect(canAdvanceProcessingStage('drying', 'operator')).toBe(false)
      expect(canAdvanceProcessingStage('ironing', 'operator')).toBe(true)
      expect(canAdvanceProcessingStage('quality_check', 'operator')).toBe(false)
      expect(canAdvanceProcessingStage('ready_to_delivery', 'operator')).toBe(false)

      expect(canManageStageMachine('washing', 'washer', 'operator')).toBe(false)
      expect(canManageStageMachine('drying', 'dryer', 'operator')).toBe(false)
      expect(canManageStageMachine('ironing', 'iron', 'operator')).toBe(true)
      expect(canManageStageMachine('ironing', 'washer', 'operator')).toBe(false)
    })
  })
})
