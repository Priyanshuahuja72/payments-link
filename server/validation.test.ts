import { describe, expect, it } from 'vitest'
import { validateCreateRequest, validatePaymentRequest } from './validation.js'
import type { PaymentLink } from '../src/domain/paymentLinks.js'

const validInput = {
  title: 'Consulting session',
  customerName: 'Avery Chen',
  customerEmail: 'avery@example.com',
  amount: '0.30',
  expiresAt: '2026-11-27',
  allowPartial: true,
  minFirstPayment: '0.10',
}

const link: PaymentLink = {
  id: 'api-link',
  title: 'Consulting session',
  customerName: 'Avery Chen',
  customerEmail: 'avery@example.com',
  amountCents: 30,
  amountPaid: 10,
  allowPartial: true,
  minFirstPayment: 10,
  payments: [{ amountCents: 10, recordedAt: '2026-11-26T10:00:00.000Z' }],
  createdAt: '2026-11-26T10:00:00.000Z',
  expiresAt: '2026-11-27',
  url: 'https://pay.ledger.local/api-link',
}

describe('backend payment validation', () => {
  it('rejects missing, non-positive, and over-total minimum first payments', () => {
    expect(validateCreateRequest({ ...validInput, minFirstPayment: '' }).valid).toBe(false)
    expect(validateCreateRequest({ ...validInput, minFirstPayment: '0' }).valid).toBe(false)
    expect(validateCreateRequest({ ...validInput, minFirstPayment: '0.31' }).valid).toBe(false)
    expect(validateCreateRequest(validInput)).toEqual({ valid: true })
  })

  it('rejects payments outside the amount due and accepts exact integer-cent due', () => {
    expect(validatePaymentRequest({ link, amountCents: 21 })).toBe('Payment cannot exceed the amount due.')
    expect(validatePaymentRequest({ link, amountCents: 0 })).toBe('Payment must be greater than zero.')
    expect(validatePaymentRequest({ link, amountCents: 20 })).toBeUndefined()
    expect(validatePaymentRequest({ link: { ...link, expiresAt: '2020-01-01' }, amountCents: 20 }))
      .toBe('Payment cannot be recorded for this link.')
    expect(validatePaymentRequest({ link, amountCents: 1.5 })).toBe('Payment request is invalid.')
  })
})