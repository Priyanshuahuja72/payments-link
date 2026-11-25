import { useState } from 'react'
import { getPaymentLinkStatus, type PaymentLink, type PaymentLinkStatus } from '../domain/paymentLinks'
import PaymentStatus from './PaymentStatus'

interface PaymentLinksTableProps {
  links: PaymentLink[]
  filter: 'All' | PaymentLinkStatus
}

function PaymentLinksTable({ links, filter }: PaymentLinksTableProps) {
  const [copiedId, setCopiedId] = useState('')

  async function copyLink(link: PaymentLink) {
    try {
      await navigator.clipboard.writeText(link.url)
      setCopiedId(link.id)
      window.setTimeout(() => setCopiedId(''), 1800)
    } catch {
      setCopiedId('')
    }
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
                <td className="amount-cell">{formatCurrency(link.amount)}</td>
                <td>{formatDate(link.createdAt)}</td>
                <td>{formatDate(link.expiresAt)}</td>
                <td><PaymentStatus status={status} /></td>
                <td><button className="copy-button" type="button" onClick={() => void copyLink(link)} aria-label={`Copy payment link for ${link.title}`} title="Copy payment link">{copiedId === link.id ? 'Copied' : 'Copy'}</button></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function formatDate(value: string) {
  const date = value.includes('T') ? new Date(value) : new Date(`${value}T00:00:00`)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

export default PaymentLinksTable