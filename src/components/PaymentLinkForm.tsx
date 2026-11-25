import { useState, type FormEvent, type ReactNode } from 'react'
import {
  createPaymentLink,
  localDateString,
  validatePaymentLink,
  type CreatePaymentLinkInput,
  type PaymentLink,
  type PaymentLinkErrors,
} from '../domain/paymentLinks'

interface PaymentLinkFormProps {
  onCreate: (link: PaymentLink) => boolean
}

const initialForm: CreatePaymentLinkInput = {
  title: '',
  customerName: '',
  customerEmail: '',
  amount: '',
  expiresAt: '',
}

function PaymentLinkForm({ onCreate }: PaymentLinkFormProps) {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState<PaymentLinkErrors>({})
  const [submitted, setSubmitted] = useState(false)

  function updateField(field: keyof CreatePaymentLinkInput, value: string) {
    const updated = { ...form, [field]: value }
    setForm(updated)
    if (submitted) setErrors(validatePaymentLink(updated))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    const validationErrors = validatePaymentLink(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      const firstInvalid = Object.keys(validationErrors)[0]
      document.getElementById(firstInvalid)?.focus()
      return
    }
    if (!onCreate(createPaymentLink(form))) return
    setForm(initialForm)
    setErrors({})
    setSubmitted(false)
  }

  return (
    <form className="payment-form" onSubmit={handleSubmit} noValidate>
      <Field id="title" label="Payment description" error={errors.title}>
        <input id="title" name="title" value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder="e.g. Brand strategy session" autoComplete="off" aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'title-error' : undefined} />
      </Field>
      <Field id="customerName" label="Customer name" error={errors.customerName}>
        <input id="customerName" name="customerName" value={form.customerName} onChange={(event) => updateField('customerName', event.target.value)} placeholder="Full name" autoComplete="name" aria-invalid={Boolean(errors.customerName)} aria-describedby={errors.customerName ? 'customerName-error' : undefined} />
      </Field>
      <Field id="customerEmail" label="Customer email" error={errors.customerEmail}>
        <input id="customerEmail" name="customerEmail" type="email" value={form.customerEmail} onChange={(event) => updateField('customerEmail', event.target.value)} placeholder="name@company.com" autoComplete="email" aria-invalid={Boolean(errors.customerEmail)} aria-describedby={errors.customerEmail ? 'customerEmail-error' : undefined} />
      </Field>
      <div className="field-row">
        <Field id="amount" label="Amount (USD)" error={errors.amount}>
          <div className="amount-input">
            <span aria-hidden="true">$</span>
            <input id="amount" name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" value={form.amount} onChange={(event) => updateField('amount', event.target.value)} placeholder="0.00" aria-invalid={Boolean(errors.amount)} aria-describedby={errors.amount ? 'amount-error' : undefined} />
          </div>
        </Field>
        <Field id="expiresAt" label="Expires on" error={errors.expiresAt}>
          <input id="expiresAt" name="expiresAt" type="date" min={localDateString()} value={form.expiresAt} onChange={(event) => updateField('expiresAt', event.target.value)} aria-invalid={Boolean(errors.expiresAt)} aria-describedby={errors.expiresAt ? 'expiresAt-error' : undefined} />
        </Field>
      </div>
      <button className="primary-button" type="submit"><span aria-hidden="true">+</span> Create payment link</button>
      <p className="form-footnote">A shareable demo URL will be created. No payment is processed.</p>
    </form>
  )
}

interface FieldProps {
  id: string
  label: string
  error?: string
  children: ReactNode
}

function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <span className="field-error" id={`${id}-error`} role="alert">{error}</span>}
    </div>
  )
}

export default PaymentLinkForm