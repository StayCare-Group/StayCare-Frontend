import { describe, it, expect } from 'vitest'
import {
  isAdminRole,
  isStaffRole,
  isClientRole,
  isDriverRole,
  isOperatorRole,
  isAdminOrStaffRole,
  isInternalRole,
  toSystemRole,
  getRoleLabel,
} from '@/constants/roles'

describe('roles constants & helper functions', () => {
  describe('isAdminRole', () => {
    it('devuelve true para "admin"', () => {
      expect(isAdminRole('admin')).toBe(true)
    })
    it('devuelve false para roles no admin o valores nulos', () => {
      expect(isAdminRole('staff')).toBe(false)
      expect(isAdminRole('client')).toBe(false)
      expect(isAdminRole(null)).toBe(false)
      expect(isAdminRole(undefined)).toBe(false)
    })
  })

  describe('isStaffRole', () => {
    it('devuelve true para "staff"', () => {
      expect(isStaffRole('staff')).toBe(true)
    })
    it('devuelve false para roles no staff', () => {
      expect(isStaffRole('admin')).toBe(false)
      expect(isStaffRole('driver')).toBe(false)
    })
  })

  describe('isClientRole', () => {
    it('devuelve true para "client"', () => {
      expect(isClientRole('client')).toBe(true)
    })
    it('devuelve false para roles no client', () => {
      expect(isClientRole('admin')).toBe(false)
      expect(isClientRole('staff')).toBe(false)
    })
  })

  describe('isDriverRole', () => {
    it('devuelve true para "driver"', () => {
      expect(isDriverRole('driver')).toBe(true)
    })
    it('devuelve false para roles no driver', () => {
      expect(isDriverRole('client')).toBe(false)
    })
  })

  describe('isOperatorRole', () => {
    it('devuelve true para "operator"', () => {
      expect(isOperatorRole('operator')).toBe(true)
    })
    it('devuelve false para roles no operator', () => {
      expect(isOperatorRole('staff')).toBe(false)
    })
  })

  describe('isAdminOrStaffRole', () => {
    it('devuelve true para "admin" y "staff"', () => {
      expect(isAdminOrStaffRole('admin')).toBe(true)
      expect(isAdminOrStaffRole('staff')).toBe(true)
    })
    it('devuelve false para client, driver, etc.', () => {
      expect(isAdminOrStaffRole('client')).toBe(false)
      expect(isAdminOrStaffRole('driver')).toBe(false)
      expect(isAdminOrStaffRole(null)).toBe(false)
    })
  })

  describe('isInternalRole', () => {
    it('devuelve true para admin, staff y operator', () => {
      expect(isInternalRole('admin')).toBe(true)
      expect(isInternalRole('staff')).toBe(true)
      expect(isInternalRole('operator')).toBe(true)
    })
    it('devuelve false para client y driver', () => {
      expect(isInternalRole('client')).toBe(false)
      expect(isInternalRole('driver')).toBe(false)
    })
  })

  describe('toSystemRole & getRoleLabel', () => {
    it('resuelve fallback "client" si el rol es inválido o nulo', () => {
      expect(toSystemRole(null)).toBe('client')
      expect(toSystemRole('unknown')).toBe('client')
    })
    it('devuelve la etiqueta adecuada', () => {
      expect(getRoleLabel('admin')).toBe('Admin')
      expect(getRoleLabel('staff')).toBe('Facility Staff')
      expect(getRoleLabel('client')).toBe('Client')
    })
  })
})
