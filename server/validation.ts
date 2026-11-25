import {
  getPaymentLinkStatus,
  validatePaymentAmount,
  validatePaymentLink,
  type CreatePaymentLinkInput,
  type PaymentLink,
  type PaymentLinkErrors,
} from '../src/domain/paymentLinks.js'

export type CreateValidationResult =
  | { valid: true }
  | { valid: false; errors: PaymentLinkErrors }

export function validateCreateRequest(value: unknown): CreateValidationResult {
  if (!isCreateInput(value)) {
    return { valid: false, errors: { title: 'Payment link request is invalid.' } }
  }
  const errors = validatePaymentLink(value)
  return Object.keys(errors).length === 0 ? { valid: true } : { valid: false, errors }
}

export function validatePaymentRequest(value: unknown): string | undefined {
  if (!isRecord(value) || !isPaymentLink(value.link) || !Number.isSafeInteger(value.amountCents)) {
    return 'Payment request is invalid.'
  }
  const link = value.link
  if (getPaymentLinkStatus(link) === 'Paid' || getPaymentLinkStatus(link) === 'Expired') {
    return 'Payment cannot be recorded for this link.'
  }
  return validatePaymentAmount(link, value.amountCents as number)
}

function isCreateInput(value: unknown): value is CreatePaymentLinkInput {
  return isRecord(value)
    && typeof value.title === 'string'
    && typeof value.customerName === 'string'
    && typeof value.customerEmail === 'string'
    && typeof value.amount === 'string'
    && typeof value.expiresAt === 'string'
    && typeof value.allowPartial === 'boolean'
    && typeof value.minFirstPayment === 'string'
}

function isPaymentLink(value: unknown): value is PaymentLink {
  if (!isRecord(value)) return false
  if (!(typeof value.id === 'string'
    && typeof value.title === 'string'
    && typeof value.customerName === 'string'
    && typeof value.customerEmail === 'string'
    && Number.isSafeInteger(value.amountCents)
    && (value.amountCents as number) > 0
    && Number.isSafeInteger(value.amountPaid)
    && (value.amountPaid as number) >= 0
    && (value.amountPaid as number) <= (value.amountCents as number)
    && typeof value.allowPartial === 'boolean'
    && (value.minFirstPayment === undefined || Number.isSafeInteger(value.minFirstPayment))
    && typeof value.createdAt === 'string'
    && typeof value.expiresAt === 'string'
    && typeof value.url === 'string')) return false
  const amountCents = value.amountCents as number
  const amountPaid = value.amountPaid as number
  if (value.allowPartial) {
    const minFirstPayment = value.minFirstPayment as number
    return typeof value.minFirstPayment === 'number'
      && minFirstPayment > 0
      && minFirstPayment <= amountCents
  }
  return amountPaid === 0 || amountPaid === amountCents
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}