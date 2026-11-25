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
  allowPartial: false,
  minFirstPayment: '',
}

const baseLink: PaymentLink = {
  id: 'link-1',
  title: 'Consulting session',
  customerName: 'Avery Chen',
  customerEmail: 'avery@example.com',
  amountCents: 12550,
  amountPaid: 0,
  allowPartial: true,
  minFirstPayment: 2500,
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
    expect(validatePaymentLink({ ...validInput, allowPartial: true }, '2026-11-26').minFirstPayment)
      .toBe('Enter a minimum first payment.')
    expect(validatePaymentLink({ ...validInput, allowPartial: true, minFirstPayment: '0' }, '2026-11-26').minFirstPayment)
      .toBe('Minimum first payment must be greater than zero.')
    expect(validatePaymentLink({ ...validInput, allowPartial: true, minFirstPayment: '-0.01' }, '2026-11-26').minFirstPayment)
      .toBe('Minimum first payment must be greater than zero.')
    expect(validatePaymentLink({ ...validInput, allowPartial: true, minFirstPayment: '126' }, '2026-11-26').minFirstPayment)
      .toBe('Minimum first payment cannot exceed the total amount.')
    expect(validatePaymentLink({ ...validInput, allowPartial: true, minFirstPayment: '25' }, '2026-11-26').minFirstPayment)
      .toBeUndefined()
  })
})

describe('payment link status', () => {
  it('gives expiry precedence over active and partially paid, but never over paid', () => {
    expect(getPaymentLinkStatus({ ...baseLink, expiresAt: '2026-11-25' }, '2026-11-26')).toBe('Expired')
    expect(getPaymentLinkStatus({ ...baseLink, amountPaid: 3000, expiresAt: '2026-11-25' }, '2026-11-26')).toBe('Expired')
    expect(getPaymentLinkStatus({ ...baseLink, expiresAt: '2026-11-25', amountPaid: 12550 }, '2026-11-26')).toBe('Paid')
    expect(getPaymentLinkStatus(baseLink, '2026-11-26')).toBe('Active')
    expect(getPaymentLinkStatus({ ...baseLink, amountPaid: 3000 }, '2026-11-26')).toBe('Partially paid')
    expect(getPaymentLinkStatus({ ...baseLink, amountPaid: 12550 }, '2026-11-26')).toBe('Paid')
  })
})

describe('recording payments', () => {
  it('records a partial payment and then the final payment, reaching Paid', () => {
    const first = recordPayment(baseLink, 4000, new Date('2026-11-26T12:00:00.000Z'))
    expect(first.amountPaid).toBe(4000)
    expect(first.payments).toHaveLength(1)
    expect(getPaymentLinkStatus(first, '2026-11-26')).toBe('Partially paid')
    expect(validatePaymentAmount(first, 1)).toBeUndefined()

    const final = recordPayment(first, 8550, new Date('2026-11-26T13:00:00.000Z'))
    expect(final.amountPaid).toBe(12550)
    expect(final.payments).toHaveLength(2)
    expect(getPaymentLinkStatus({ ...final, expiresAt: '2026-11-25' }, '2026-11-26')).toBe('Paid')
  })

  it('rejects payments that are zero, above the due amount, or below the first-payment minimum', () => {
    expect(validatePaymentAmount(baseLink, 0)).toBe('Payment must be greater than zero.')
    expect(validatePaymentAmount(baseLink, 12551)).toBe('Payment cannot exceed the amount due.')
    expect(validatePaymentAmount(baseLink, 2000)).toBe('First payment must be at least $25.00.')
    expect(validatePaymentAmount({ ...baseLink, allowPartial: false }, 5000))
      .toBe('This link does not allow partial payments.')
  })

  it('reaches the exact due amount for 0.10 plus 0.20 using integer cents', () => {
    const tenCentLink: PaymentLink = {
      ...baseLink,
      amountCents: 30,
      amountPaid: 0,
      minFirstPayment: 1,
    }
    const first = recordPayment(tenCentLink, 10)
    const completed = recordPayment(first, 20)
    expect(completed.amountPaid).toBe(30)
    expect(getPaymentLinkStatus(completed, '2026-11-26')).toBe('Paid')
  })
})