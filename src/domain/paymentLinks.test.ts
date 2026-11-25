import { describe, expect, it } from 'vitest'
import {
  getPaymentLinkStatus,
  recordPayment,
  validatePaymentAmount,
  validatePaymentLink,
  type PaymentLink,
} from './paymentLinks'

const validInput = {
  title: 'Consulting session',
  customerName: 'Avery Chen',
  customerEmail: 'avery@example.com',
  amount: '125.50',
  expiresAt: '2026-11-27',
  allowPartialPayments: false,
  minimumFirstPayment: '',
}

const baseLink: PaymentLink = {
  id: 'link-1',
  title: 'Consulting session',
  customerName: 'Avery Chen',
  customerEmail: 'avery@example.com',
  amount: 125.5,
  paidAmount: 0,
  allowPartialPayments: true,
  minimumFirstPayment: 25,
  payments: [],
  createdAt: '2026-11-26T10:00:00.000Z',
  expiresAt: '2026-11-27',
  url: 'https://pay.ledger.local/link-1',
}

describe('payment link validation', () => {
  it('accepts a complete request with a positive amount and current-or-future expiry', () => {
    expect(validatePaymentLink(validInput, '2026-11-26')).toEqual({})
  })

  it('rejects invalid email, non-positive amounts, excess precision, and past expiry', () => {
    const errors = validatePaymentLink({
      ...validInput,
      customerEmail: 'not-an-email',
      amount: '0.001',
      expiresAt: '2026-11-25',
    }, '2026-11-26')

    expect(errors.customerEmail).toBe('Enter a valid email address.')
    expect(errors.amount).toBe('Use no more than two decimal places.')
    expect(errors.expiresAt).toBe('Expiry date cannot be in the past.')
  })

  it('requires a valid minimum first payment when partial payments are enabled', () => {
    expect(validatePaymentLink({ ...validInput, allowPartialPayments: true }, '2026-11-26').minimumFirstPayment)
      .toBe('Enter a minimum first payment.')
    expect(validatePaymentLink({ ...validInput, allowPartialPayments: true, minimumFirstPayment: '0' }, '2026-11-26').minimumFirstPayment)
      .toBe('Minimum first payment must be greater than zero.')
    expect(validatePaymentLink({ ...validInput, allowPartialPayments: true, minimumFirstPayment: '126' }, '2026-11-26').minimumFirstPayment)
      .toBe('Minimum first payment cannot exceed the total amount.')
    expect(validatePaymentLink({ ...validInput, allowPartialPayments: true, minimumFirstPayment: '25' }, '2026-11-26').minimumFirstPayment)
      .toBeUndefined()
  })
})

describe('payment link status', () => {
  it('gives expiry precedence over active and partially paid, but never over paid', () => {
    expect(getPaymentLinkStatus({ ...baseLink, expiresAt: '2026-11-25' }, '2026-11-26')).toBe('Expired')
    expect(getPaymentLinkStatus({ ...baseLink, paidAmount: 30, expiresAt: '2026-11-25' }, '2026-11-26')).toBe('Expired')
    expect(getPaymentLinkStatus({ ...baseLink, expiresAt: '2026-11-25', paidAmount: 125.5 }, '2026-11-26')).toBe('Paid')
    expect(getPaymentLinkStatus(baseLink, '2026-11-26')).toBe('Active')
    expect(getPaymentLinkStatus({ ...baseLink, paidAmount: 30 }, '2026-11-26')).toBe('Partially paid')
    expect(getPaymentLinkStatus({ ...baseLink, paidAmount: 125.5 }, '2026-11-26')).toBe('Paid')
  })
})

describe('recording payments', () => {
  it('records a partial payment and then the final payment, reaching Paid', () => {
    const first = recordPayment(baseLink, 40, new Date('2026-11-26T12:00:00.000Z'))
    expect(first.paidAmount).toBe(40)
    expect(first.payments).toHaveLength(1)
    expect(getPaymentLinkStatus(first, '2026-11-26')).toBe('Partially paid')

    const final = recordPayment(first, 85.5, new Date('2026-11-26T13:00:00.000Z'))
    expect(final.paidAmount).toBe(125.5)
    expect(final.payments).toHaveLength(2)
    expect(getPaymentLinkStatus({ ...final, expiresAt: '2026-11-25' }, '2026-11-26')).toBe('Paid')
  })

  it('rejects payments that are zero, above the due amount, or below the first-payment minimum', () => {
    expect(validatePaymentAmount(baseLink, 0)).toBe('Payment must be greater than zero.')
    expect(validatePaymentAmount(baseLink, 126)).toBe('Payment cannot exceed the amount due.')
    expect(validatePaymentAmount(baseLink, 20)).toBe('First payment must be at least $25.00.')
    expect(validatePaymentAmount({ ...baseLink, allowPartialPayments: false }, 50))
      .toBe('This link does not allow partial payments.')
  })
})