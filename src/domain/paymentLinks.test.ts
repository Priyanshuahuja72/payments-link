import { describe, expect, it } from 'vitest'
import { getPaymentLinkStatus, validatePaymentLink, type PaymentLink } from './paymentLinks'

const validInput = {
  title: 'Consulting session',
  customerName: 'Avery Chen',
  customerEmail: 'avery@example.com',
  amount: '125.50',
  expiresAt: '2026-11-27',
}

const baseLink: PaymentLink = {
  id: 'link-1',
  title: 'Consulting session',
  customerName: 'Avery Chen',
  customerEmail: 'avery@example.com',
  amount: 125.5,
  paidAmount: 0,
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
})

describe('payment link status', () => {
  it('marks unpaid expired links as expired while completed payments remain paid', () => {
    expect(getPaymentLinkStatus({ ...baseLink, expiresAt: '2026-11-25' }, '2026-11-26')).toBe('Expired')
    expect(getPaymentLinkStatus({ ...baseLink, expiresAt: '2026-11-25', paidAmount: 125.5 }, '2026-11-26')).toBe('Paid')
    expect(getPaymentLinkStatus(baseLink, '2026-11-26')).toBe('Unpaid')
  })
})