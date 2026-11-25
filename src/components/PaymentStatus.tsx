import type { PaymentLinkStatus } from '../domain/paymentLinks'

interface PaymentStatusProps {
  status: PaymentLinkStatus
}

function PaymentStatus({ status }: PaymentStatusProps) {
  const className = status.toLowerCase().replaceAll(' ', '-')
  return <span className={`status-badge status-${className}`}>{status}</span>
}

export default PaymentStatus