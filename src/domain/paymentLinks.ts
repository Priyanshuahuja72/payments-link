export type PaymentLinkStatus = 'Active' | 'Partially paid' | 'Paid' | 'Expired'

export interface PaymentRecord {
  amount: number
  recordedAt: string
}

export interface PaymentLink {
  id: string
  title: string
  customerName: string
  customerEmail: string
  amount: number
  paidAmount: number
  allowPartialPayments?: boolean
  minimumFirstPayment?: number
  payments?: PaymentRecord[]
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
  allowPartialPayments: boolean
  minimumFirstPayment: string
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
  if (input.allowPartialPayments) {
    const minimumPayment = Number(input.minimumFirstPayment)
    if (!input.minimumFirstPayment.trim()) {
      errors.minimumFirstPayment = 'Enter a minimum first payment.'
    } else if (!Number.isFinite(minimumPayment) || minimumPayment <= 0) {
      errors.minimumFirstPayment = 'Minimum first payment must be greater than zero.'
    } else if (minimumPayment > amount) {
      errors.minimumFirstPayment = 'Minimum first payment cannot exceed the total amount.'
    } else if (!/^\d+(\.\d{1,2})?$/.test(input.minimumFirstPayment)) {
      errors.minimumFirstPayment = 'Use no more than two decimal places.'
    }
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
  if (link.paidAmount > 0) return 'Partially paid'
  return 'Active'
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
    allowPartialPayments: input.allowPartialPayments,
    minimumFirstPayment: input.allowPartialPayments ? Number(input.minimumFirstPayment) : undefined,
    payments: [],
    createdAt: now.toISOString(),
    expiresAt: input.expiresAt,
    url: `https://pay.ledger.local/${id}`,
  }
}

export function validatePaymentAmount(link: PaymentLink, amount: number): string | undefined {
  const amountDue = Math.max(0, link.amount - link.paidAmount)
  if (!Number.isFinite(amount) || amount <= 0) return 'Payment must be greater than zero.'
  if (amount > amountDue) return 'Payment cannot exceed the amount due.'
  if (link.paidAmount === 0 && !link.allowPartialPayments && amount < amountDue) {
    return 'This link does not allow partial payments.'
  }
  if (link.paidAmount === 0 && link.allowPartialPayments && amount < (link.minimumFirstPayment ?? 0)) {
    return `First payment must be at least ${formatCurrency(link.minimumFirstPayment ?? 0)}.`
  }
  return undefined
}

export function recordPayment(link: PaymentLink, amount: number, recordedAt = new Date()): PaymentLink {
  const error = validatePaymentAmount(link, amount)
  if (error) throw new Error(error)
  return {
    ...link,
    paidAmount: Math.round((link.paidAmount + amount) * 100) / 100,
    payments: [...(link.payments ?? []), { amount, recordedAt: recordedAt.toISOString() }],
  }
}

export function localDateString(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}