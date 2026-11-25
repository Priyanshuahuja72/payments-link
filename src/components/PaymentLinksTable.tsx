import { useState, type FormEvent } from 'react'
import { formatMinorCurrency, getPaymentLinkStatus, moneyToMinorUnits, validatePaymentAmount, type PaymentLink, type PaymentLinkStatus } from '../domain/paymentLinks'
import PaymentStatus from './PaymentStatus'

interface PaymentLinksTableProps {
  links: PaymentLink[]
  filter: 'All' | PaymentLinkStatus
  onRecordPayment: (linkId: string, amountCents: number) => Promise<boolean>
}

function PaymentLinksTable({ links, filter, onRecordPayment }: PaymentLinksTableProps) {
  const [copiedId, setCopiedId] = useState('')
  const [recordingId, setRecordingId] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentError, setPaymentError] = useState('')

  async function copyLink(link: PaymentLink) {
    try {
      await navigator.clipboard.writeText(link.url)
      setCopiedId(link.id)
      window.setTimeout(() => setCopiedId(''), 1800)
    } catch {
      setCopiedId('')
    }
  }

  async function submitPayment(event: FormEvent<HTMLFormElement>, link: PaymentLink) {
    event.preventDefault()
    const amountCents = moneyToMinorUnits(paymentAmount) ?? 0
    const error = validatePaymentAmount(link, amountCents)
    if (error) {
      setPaymentError(error)
      return
    }
    if (!await onRecordPayment(link.id, amountCents)) return
    setRecordingId('')
    setPaymentAmount('')
    setPaymentError('')
  }

  if (links.length === 0) {
    const isFiltered = filter !== 'All'
    return (
      <div className="empty-state" role="status">
        <span className="empty-mark" aria-hidden="true">↗</span>
        <h3>{isFiltered ? `No ${filter.toLowerCase()} links` : 'No payment links yet'}</h3>
        <p>{isFiltered ? 'Try another status filter to see more payment requests.' : 'Create your first payment link and it will appear here.'}</p>
      </div>
    )
  }

  return (
    <div className="table-wrap">
      <table className="links-table">
        <thead>
          <tr>
            <th scope="col">PAYMENT LINK</th>
            <th scope="col">CUSTOMER</th>
            <th scope="col">AMOUNT</th>
            <th scope="col">PAID</th>
            <th scope="col">DUE</th>
            <th scope="col">CREATED</th>
            <th scope="col">EXPIRES</th>
            <th scope="col">STATUS</th>
            <th scope="col"><span className="visually-hidden">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {links.map((link) => {
            const status = getPaymentLinkStatus(link)
            return (
              <tr key={link.id}>
                <td><div className="link-name" title={link.title}>{link.title}</div></td>
                <td>
                  <div className="customer-name">{link.customerName}</div>
                  <div className="customer-email" title={link.customerEmail}>{link.customerEmail}</div>
                </td>
                <td className="amount-cell">{formatMinorCurrency(link.amountCents)}</td>
                <td>{formatMinorCurrency(link.amountPaid)}</td>
                <td>{formatMinorCurrency(Math.max(0, link.amountCents - link.amountPaid))}</td>
                <td>{formatDate(link.createdAt)}</td>
                <td>{formatDate(link.expiresAt)}</td>
                <td><PaymentStatus status={status} /></td>
                <td className="row-actions">
                  {(status === 'Active' || status === 'Partially paid') && (
                    recordingId === link.id ? (
                      <form className="record-payment-form" onSubmit={(event) => submitPayment(event, link)}>
                        <label className="visually-hidden" htmlFor={`payment-${link.id}`}>Payment amount for {link.title}</label>
                        <input id={`payment-${link.id}`} type="number" min="0.01" max={(link.amountCents - link.amountPaid) / 100} step="0.01" inputMode="decimal" value={paymentAmount} onChange={(event) => { setPaymentAmount(event.target.value); setPaymentError('') }} placeholder="0.00" aria-describedby={paymentError ? `payment-error-${link.id}` : undefined} />
                        <button className="record-submit" type="submit">Save</button>
                        <button className="record-cancel" type="button" onClick={() => { setRecordingId(''); setPaymentError('') }}>Cancel</button>
                        {paymentError && <span className="record-error" id={`payment-error-${link.id}`} role="alert">{paymentError}</span>}
                      </form>
                    ) : (
                      <button className="record-button" type="button" onClick={() => { setRecordingId(link.id); setPaymentAmount(''); setPaymentError('') }}>Record payment</button>
                    )
                  )}
                  <button className="copy-button" type="button" onClick={() => void copyLink(link)} aria-label={`Copy payment link for ${link.title}`} title="Copy payment link">{copiedId === link.id ? 'Copied' : 'Copy'}</button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function formatDate(value: string) {
  const date = value.includes('T') ? new Date(value) : new Date(`${value}T00:00:00`)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

export default PaymentLinksTable