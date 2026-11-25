import { useState } from 'react'
import { loadLinks, saveLinks } from './domain/storage'
import { getPaymentLinkStatus, recordPayment, type PaymentLink, type PaymentLinkStatus } from './domain/paymentLinks'
import PaymentLinkForm from './components/PaymentLinkForm'
import PaymentLinksTable from './components/PaymentLinksTable'
import './manager.css'

const filters: Array<'All' | PaymentLinkStatus> = ['All', 'Active', 'Partially paid', 'Paid', 'Expired']

function PaymentManager() {
  const [storedLinks, setStoredLinks] = useState(() => loadLinks())
  const [filter, setFilter] = useState<(typeof filters)[number]>('All')
  const [notice, setNotice] = useState('')
  const [storageError, setStorageError] = useState(false)

  const statuses = storedLinks.links.map((link) => getPaymentLinkStatus(link))
  const visibleLinks = storedLinks.links.filter((link) =>
    filter === 'All' || getPaymentLinkStatus(link) === filter,
  )
  const paidTotal = storedLinks.links.reduce((sum, link) => sum + link.paidAmount, 0)
  const activeCount = statuses.filter((status) => status === 'Active').length

  function createLink(link: PaymentLink): boolean {
    const updatedLinks = [link, ...storedLinks.links]
    try {
      saveLinks(updatedLinks)
      setStoredLinks({ links: updatedLinks, error: false })
      setStorageError(false)
      setNotice(`Payment link created for ${link.customerName}.`)
      return true
    } catch {
      setStorageError(true)
      setNotice('')
      return false
    }
  }

  function addPayment(linkId: string, amount: number): boolean {
    const updatedLinks = storedLinks.links.map((link) =>
      link.id === linkId ? recordPayment(link, amount) : link,
    )
    try {
      saveLinks(updatedLinks)
      setStoredLinks({ links: updatedLinks, error: false })
      setStorageError(false)
      const link = updatedLinks.find((item) => item.id === linkId)
      setNotice(`Payment recorded for ${link?.customerName ?? 'customer'}.`)
      return true
    } catch {
      setStorageError(true)
      setNotice('')
      return false
    }
  }

  function retryLoad() {
    setStoredLinks(loadLinks())
    setStorageError(false)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Ledger home">
          <span className="brand-mark" aria-hidden="true">L</span>
          <span>ledger<span className="brand-period">.</span></span>
        </a>
        <div className="topbar-right">
          <span className="workspace-label">PAYMENTS</span>
          <span className="avatar" aria-label="Profile initials">PA</span>
        </div>
      </header>

      <main id="home" className="main-content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">COLLECTIONS / PAYMENT LINKS</p>
            <h1>Payment links</h1>
            <p className="page-subtitle">Create and track one-time payment requests.</p>
          </div>
          <span className="secure-note"><span aria-hidden="true">●</span> Workspace only</span>
        </div>

        <section className="summary-strip" aria-label="Payment link summary">
          <div className="summary-item">
            <span className="summary-label">LINKS CREATED</span>
            <strong>{storedLinks.links.length}</strong>
            <span className="summary-detail">all time</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">AWAITING PAYMENT</span>
            <strong>{activeCount}</strong>
            <span className="summary-detail">active requests</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">COLLECTED</span>
            <strong>{formatCurrency(paidTotal)}</strong>
            <span className="summary-detail">across all links</span>
          </div>
        </section>

        {storageError && (
          <div className="alert alert-error" role="alert">
            <span>Payment links could not be loaded or saved in this browser.</span>
            <button type="button" className="text-button" onClick={retryLoad}>Try again</button>
          </div>
        )}
        {notice && <p className="alert alert-success" role="status">{notice}</p>}
        {storedLinks.error && !storageError && (
          <div className="alert alert-error" role="alert">
            Saved payment links could not be read. You can still create a new link.
          </div>
        )}

        <div className="workspace-grid">
          <section className="form-panel" aria-labelledby="create-heading">
            <div className="panel-heading">
              <span className="step-number">01</span>
              <div>
                <h2 id="create-heading">Create a link</h2>
                <p>Send a secure request to your customer.</p>
              </div>
            </div>
            <PaymentLinkForm onCreate={createLink} />
          </section>

          <section className="links-panel" aria-labelledby="links-heading">
            <div className="list-heading">
              <div>
                <p className="eyebrow">YOUR ACTIVITY</p>
                <h2 id="links-heading">Recent links</h2>
              </div>
              <span className="count-label">{storedLinks.links.length} total</span>
            </div>

            <div className="filter-tabs" role="group" aria-label="Filter payment links by status">
              {filters.map((status) => (
                <button
                  type="button"
                  key={status}
                  className={`filter-tab${filter === status ? ' is-active' : ''}`}
                  aria-pressed={filter === status}
                  onClick={() => setFilter(status)}
                >
                  {status}
                  {status !== 'All' && <span className="filter-count">{statuses.filter((item) => item === status).length}</span>}
                </button>
              ))}
            </div>

            <PaymentLinksTable links={visibleLinks} filter={filter} onRecordPayment={addPayment} />
          </section>
        </div>
        <footer className="page-footer">
          <span>LEDGER PAYMENTS</span>
          <span>Demo workspace · Data stays in this browser</span>
        </footer>
      </main>
    </div>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

export default PaymentManager