import type { CreatePaymentLinkInput, PaymentLink, PaymentLinkErrors } from './paymentLinks'

export async function validateCreateOnServer(input: CreatePaymentLinkInput): Promise<PaymentLinkErrors> {
  const response = await fetch('/api/validate/payment-link', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  const result = await response.json() as { errors?: PaymentLinkErrors }
  if (response.ok) return {}
  return result.errors ?? { title: 'The server rejected this payment link.' }
}

export async function validatePaymentOnServer(link: PaymentLink, amountCents: number): Promise<string | undefined> {
  const response = await fetch('/api/validate/payment', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ link, amountCents }),
  })
  const result = await response.json() as { error?: string }
  if (response.ok) return undefined
  return result.error ?? 'The server rejected this payment.'
}