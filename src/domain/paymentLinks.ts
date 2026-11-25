export type PaymentLinkStatus = 'Unpaid' | 'Paid' | 'Expired'

export interface PaymentLink {
  id: string
  title: string
  customerName: string
  customerEmail: string
  amount: number
  paidAmount: number
  createdAt: string
  expiresAt: string
  url: string
}

export interface CreatePaymentLinkInput {
  title: string
  customerName: string
  customerEmail: string
  amount: string
  expiresAt: string
}

export type PaymentLinkErrors = Partial<Record<keyof CreatePaymentLinkInput, string>>

export function validatePaymentLink(input: CreatePaymentLinkInput, today = localDateString()): PaymentLinkErrors {
  const errors: PaymentLinkErrors = {}
  const amount = Number(input.amount)

  if (!input.title.trim()) errors.title = 'Enter a payment description.'
  if (!input.customerName.trim()) errors.customerName = 'Enter the customer name.'
  if (!input.customerEmail.trim()) {
    errors.customerEmail = 'Enter the customer email.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.customerEmail.trim())) {
    errors.customerEmail = 'Enter a valid email address.'
  }
  if (!input.amount.trim()) {
    errors.amount = 'Enter an amount.'
  } else if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = 'Amount must be greater than zero.'
  } else if (!/^\d+(\.\d{1,2})?$/.test(input.amount)) {
    errors.amount = 'Use no more than two decimal places.'
  }
  if (!input.expiresAt) {
    errors.expiresAt = 'Choose an expiry date.'
  } else if (input.expiresAt < today) {
    errors.expiresAt = 'Expiry date cannot be in the past.'
  }

  return errors
}

export function getPaymentLinkStatus(link: PaymentLink, today = localDateString()): PaymentLinkStatus {
  if (link.paidAmount >= link.amount) return 'Paid'
  if (link.expiresAt < today) return 'Expired'
  return 'Unpaid'
}

export function createPaymentLink(input: CreatePaymentLinkInput, now = new Date()): PaymentLink {
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${now.getTime()}-${Math.random().toString(36).slice(2)}`

  return {
    id,
    title: input.title.trim(),
    customerName: input.customerName.trim(),
    customerEmail: input.customerEmail.trim(),
    amount: Number(input.amount),
    paidAmount: 0,
    createdAt: now.toISOString(),
    expiresAt: input.expiresAt,
    url: `https://pay.ledger.local/${id}`,
  }
}

export function localDateString(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}