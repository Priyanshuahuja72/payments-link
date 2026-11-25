import type { PaymentLink } from './paymentLinks'

const STORAGE_KEY = 'ledger-payment-links'

export interface LoadedLinks {
  links: PaymentLink[]
  error: boolean
}

export function loadLinks(): LoadedLinks {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return { links: [], error: false }
    const parsed: unknown = JSON.parse(saved)
    if (!Array.isArray(parsed)) {
      throw new Error('Stored payment links are invalid')
    }
    const normalized = parsed.map(normalizePaymentLink)
    if (normalized.some((item) => item === null)) throw new Error('Stored payment links are invalid')
    const links = normalized.map((item) => (item as NonNullable<typeof item>).link)
    if (normalized.some((item) => (item as NonNullable<typeof item>).migrated)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(links))
    }
    return { links, error: false }
  } catch {
    return { links: [], error: true }
  }
}

export function saveLinks(links: PaymentLink[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links))
}

function normalizePaymentLink(value: unknown): { link: PaymentLink; migrated: boolean } | null {
  if (!value || typeof value !== 'object') return null
  const link = value as Record<string, unknown>
  if (
    typeof link.id !== 'string'
    || typeof link.title !== 'string'
    || typeof link.customerName !== 'string'
    || typeof link.customerEmail !== 'string'
    || typeof link.createdAt !== 'string'
    || typeof link.expiresAt !== 'string'
    || typeof link.url !== 'string'
  ) return null

  if (typeof link.amountCents === 'number' && typeof link.amountPaid === 'number') {
    if (!Number.isSafeInteger(link.amountCents) || link.amountCents <= 0 || !Number.isSafeInteger(link.amountPaid) || link.amountPaid < 0) return null
    const allowPartial = typeof link.allowPartial === 'boolean' ? link.allowPartial : false
    const minFirstPayment = typeof link.minFirstPayment === 'number' ? link.minFirstPayment : undefined
    const payments = Array.isArray(link.payments) ? link.payments : []
    if (payments.some((payment) => !isPaymentRecord(payment))) return null
    if (minFirstPayment !== undefined && (!Number.isSafeInteger(minFirstPayment) || minFirstPayment <= 0)) return null
    return {
      link: {
        id: link.id,
        title: link.title,
        customerName: link.customerName,
        customerEmail: link.customerEmail,
        amountCents: link.amountCents,
        amountPaid: link.amountPaid,
        allowPartial,
        minFirstPayment,
        payments: payments as PaymentLink['payments'],
        createdAt: link.createdAt,
        expiresAt: link.expiresAt,
        url: link.url,
      },
      migrated: typeof link.allowPartial !== 'boolean' || !Array.isArray(link.payments),
    }
  }

  if (typeof link.amount !== 'number' || typeof link.paidAmount !== 'number' || link.amount <= 0 || link.paidAmount < 0) return null
  const payments = Array.isArray(link.payments) ? link.payments.map((payment) => {
    if (!payment || typeof payment !== 'object') return null
    const record = payment as Record<string, unknown>
    if (typeof record.recordedAt !== 'string') return null
    const amountCents = typeof record.amountCents === 'number'
      ? record.amountCents
      : typeof record.amount === 'number' ? Math.round(record.amount * 100) : null
    return amountCents !== null && Number.isSafeInteger(amountCents)
      ? { amountCents, recordedAt: record.recordedAt }
      : null
  }) : []
  if (payments.some((payment) => payment === null)) return null
  const minFirstPayment = typeof link.minFirstPayment === 'number'
    ? link.minFirstPayment
    : typeof link.minimumFirstPayment === 'number' ? Math.round(link.minimumFirstPayment * 100) : undefined

  return {
    link: {
      id: link.id,
      title: link.title,
      customerName: link.customerName,
      customerEmail: link.customerEmail,
      amountCents: Math.round(link.amount * 100),
      amountPaid: Math.round(link.paidAmount * 100),
      allowPartial: link.allowPartial === true || link.allowPartialPayments === true,
      minFirstPayment,
      payments: payments.filter((payment) => payment !== null),
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
      url: link.url,
    },
    migrated: true,
  }
}

function isPaymentRecord(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return Number.isSafeInteger(record.amountCents) && typeof record.recordedAt === 'string'
}