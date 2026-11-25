export type PaymentLinkStatus = 'Active' | 'Partially paid' | 'Paid' | 'Expired'

export interface PaymentRecord {
  amountCents: number
  recordedAt: string
}

export interface PaymentLink {
  id: string
  title: string
  customerName: string
  customerEmail: string
  amountCents: number
  amountPaid: number
  allowPartial: boolean
  minFirstPayment?: number
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
  allowPartial: boolean
  minFirstPayment: string
}

export type PaymentLinkErrors = Partial<Record<keyof CreatePaymentLinkInput, string>>

export function validatePaymentLink(input: CreatePaymentLinkInput, today = localDateString()): PaymentLinkErrors {
  const errors: PaymentLinkErrors = {}
  const amountCents = moneyToMinorUnits(input.amount)

  if (!input.title.trim()) errors.title = 'Enter a payment description.'
  if (!input.customerName.trim()) errors.customerName = 'Enter the customer name.'
  if (!input.customerEmail.trim()) {
    errors.customerEmail = 'Enter the customer email.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.customerEmail.trim())) {
    errors.customerEmail = 'Enter a valid email address.'
  }
  if (!input.amount.trim()) {
    errors.amount = 'Enter an amount.'
  } else if (!hasMoneyPrecision(input.amount)) {
    errors.amount = 'Use no more than two decimal places.'
  } else if (amountCents === null || amountCents <= 0) {
    errors.amount = 'Amount must be greater than zero.'
  }
  if (input.allowPartial) {
    const minFirstPayment = moneyToMinorUnits(input.minFirstPayment)
    if (!input.minFirstPayment.trim()) {
      errors.minFirstPayment = 'Enter a minimum first payment.'
    } else if (!hasMoneyPrecision(input.minFirstPayment)) {
      errors.minFirstPayment = 'Use no more than two decimal places.'
    } else if (minFirstPayment === null || minFirstPayment <= 0) {
      errors.minFirstPayment = 'Minimum first payment must be greater than zero.'
    } else if (amountCents !== null && minFirstPayment > amountCents) {
      errors.minFirstPayment = 'Minimum first payment cannot exceed the total amount.'
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
  if (link.amountPaid >= link.amountCents) return 'Paid'
  if (link.expiresAt < today) return 'Expired'
  if (link.amountPaid > 0) return 'Partially paid'
  return 'Active'
}

export function createPaymentLink(input: CreatePaymentLinkInput, now = new Date()): PaymentLink {
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${now.getTime()}-${Math.random().toString(36).slice(2)}`

  const amountCents = moneyToMinorUnits(input.amount)
  if (amountCents === null || amountCents <= 0) throw new Error('Invalid payment amount.')
  const minFirstPayment = input.allowPartial ? moneyToMinorUnits(input.minFirstPayment) : null
  if (input.allowPartial && (minFirstPayment === null || minFirstPayment <= 0 || minFirstPayment > amountCents)) {
    throw new Error('Invalid minimum first payment.')
  }

  return {
    id,
    title: input.title.trim(),
    customerName: input.customerName.trim(),
    customerEmail: input.customerEmail.trim(),
    amountCents,
    amountPaid: 0,
    allowPartial: input.allowPartial,
    minFirstPayment: minFirstPayment ?? undefined,
    payments: [],
    createdAt: now.toISOString(),
    expiresAt: input.expiresAt,
    url: `https://pay.ledger.local/${id}`,
  }
}

export function validatePaymentAmount(link: PaymentLink, amountCents: number): string | undefined {
  const amountDue = Math.max(0, link.amountCents - link.amountPaid)
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) return 'Payment must be greater than zero.'
  if (amountCents > amountDue) return 'Payment cannot exceed the amount due.'
  if (link.amountPaid === 0 && !link.allowPartial && amountCents < amountDue) {
    return 'This link does not allow partial payments.'
  }
  if (link.amountPaid === 0 && link.allowPartial && amountCents < (link.minFirstPayment ?? 0)) {
    return `First payment must be at least ${formatMinorCurrency(link.minFirstPayment ?? 0)}.`
  }
  return undefined
}

export function recordPayment(link: PaymentLink, amountCents: number, recordedAt = new Date()): PaymentLink {
  const error = validatePaymentAmount(link, amountCents)
  if (error) throw new Error(error)
  return {
    ...link,
    amountPaid: link.amountPaid + amountCents,
    payments: [...(link.payments ?? []), { amountCents, recordedAt: recordedAt.toISOString() }],
  }
}

export function moneyToMinorUnits(value: string): number | null {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim())
  if (!match) return null
  const whole = Number(match[1])
  const fraction = Number((match[2] ?? '').padEnd(2, '0'))
  const minorUnits = whole * 100 + fraction
  return Number.isSafeInteger(minorUnits) ? minorUnits : null
}

function hasMoneyPrecision(value: string): boolean {
  return /^-?\d+(?:\.\d{1,2})?$/.test(value.trim())
}

export function formatMinorCurrency(amountCents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amountCents / 100)
}

export function minorUnitsToMoneyString(amountCents: number): string {
  const whole = Math.floor(amountCents / 100)
  const cents = String(amountCents % 100).padStart(2, '0')
  return `${whole}.${cents}`
}

export function localDateString(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
