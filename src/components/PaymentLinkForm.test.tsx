import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import PaymentLinkForm from './PaymentLinkForm'

describe('PaymentLinkForm', () => {
  it('shows field-level errors and focuses the first invalid field on submit', () => {
    const onCreate = vi.fn()
    render(<PaymentLinkForm onCreate={onCreate} />)

    fireEvent.click(screen.getByRole('button', { name: /create payment link/i }))

    expect(screen.getByText('Enter a payment description.')).toBeInTheDocument()
    expect(screen.getByText('Enter the customer name.')).toBeInTheDocument()
    expect(screen.getByText('Enter the customer email.')).toBeInTheDocument()
    expect(onCreate).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Payment description')).toHaveFocus()
  })
})