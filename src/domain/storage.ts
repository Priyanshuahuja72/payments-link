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
    if (!Array.isArray(parsed) || !parsed.every(isPaymentLink)) {
      throw new Error('Stored payment links are invalid')
    }
    return { links: parsed, error: false }
  } catch {
    return { links: [], error: true }
  }
}

export function saveLinks(links: PaymentLink[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links))
}

function isPaymentLink(value: unknown): value is PaymentLink {
  if (!value || typeof value !== 'object') return false
  const link = value as Record<string, unknown>
  return typeof link.id === 'string'
    && typeof link.title === 'string'
    && typeof link.customerName === 'string'
    && typeof link.customerEmail === 'string'
    && typeof link.amount === 'number'
    && typeof link.paidAmount === 'number'
    && typeof link.createdAt === 'string'
    && typeof link.expiresAt === 'string'
    && typeof link.url === 'string'
}