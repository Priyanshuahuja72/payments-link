import type { PaymentLinkStatus } from '../domain/paymentLinks'

interface PaymentStatusProps {
  status: PaymentLinkStatus
}

function PaymentStatus({ status }: PaymentStatusProps) {
  return <span className={`status-badge status-${status.toLowerCase()}`}>{status}</span>
}

export default PaymentStatus