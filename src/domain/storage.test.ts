import { afterEach, describe, expect, it } from 'vitest'
import { loadLinks, saveLinks } from './storage'
import type { PaymentLink } from './paymentLinks'

const link: PaymentLink = {
  id: 'stored-link',
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
  url: 'https://pay.ledger.local/stored-link',
}

afterEach(() => localStorage.clear())

describe('payment link storage', () => {
  it('persists partial-payment fields and integer-cent payment records', () => {
    saveLinks([link])
    const saved = JSON.parse(localStorage.getItem('ledger-payment-links') ?? '[]')
    expect(saved[0]).toMatchObject({
      amountCents: 30,
      amountPaid: 10,
      allowPartial: true,
      minFirstPayment: 10,
      payments: [{ amountCents: 10 }],
    })
    expect(loadLinks().links).toEqual([link])
  })

  it('migrates existing dollar-based records to the current integer-cent schema', () => {
    localStorage.setItem('ledger-payment-links', JSON.stringify([{
      id: 'legacy-link',
      title: 'Legacy payment',
      customerName: 'Avery Chen',
      customerEmail: 'avery@example.com',
      amount: 0.3,
      paidAmount: 0.1,
      allowPartialPayments: true,
      minimumFirstPayment: 0.1,
      payments: [{ amount: 0.1, recordedAt: '2026-11-26T10:00:00.000Z' }],
      createdAt: '2026-11-26T10:00:00.000Z',
      expiresAt: '2026-11-27',
      url: 'https://pay.ledger.local/legacy-link',
    }]))

    expect(loadLinks().links[0]).toMatchObject({
      amountCents: 30,
      amountPaid: 10,
      allowPartial: true,
      minFirstPayment: 10,
      payments: [{ amountCents: 10 }],
    })
    expect(JSON.parse(localStorage.getItem('ledger-payment-links') ?? '[]')[0]).not.toHaveProperty('paidAmount')
  })
})