import { expect, test } from '@playwright/test'

test('creates a payment link and filters the list by status', async ({ page }) => {
  await page.goto('/')
  const invalidServerValidation = await page.request.post('/api/validate/payment-link', {
    data: {
      title: 'Invalid partial link',
      customerName: 'Jordan Lee',
      customerEmail: 'jordan@example.com',
      amount: '0.30',
      expiresAt: '2026-11-27',
      allowPartial: true,
      minFirstPayment: '0.31',
    },
  })
  expect(invalidServerValidation.status()).toBe(422)
  expect((await invalidServerValidation.json()).errors.minFirstPayment)
    .toBe('Minimum first payment cannot exceed the total amount.')

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const expiry = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`

  await page.getByLabel('Payment description').fill('Website redesign deposit')
  await page.getByLabel('Customer name').fill('Jordan Lee')
  await page.getByLabel('Customer email').fill('jordan@example.com')
  await page.getByLabel('Amount (USD)').fill('480.00')
  await page.getByLabel('Expires on').fill(expiry)
  await page.getByLabel('Allow partial payments').check()
  await page.getByLabel('Minimum first payment').fill('25.00')
  await page.getByRole('button', { name: /create payment link/i }).click()

  const createdRow = page.getByRole('row').filter({ hasText: 'Website redesign deposit' })
  await expect(createdRow).toContainText('Jordan Lee')
  await expect(createdRow).toContainText('$480.00')
  await expect(createdRow).toContainText('Active')
  const storedLink = await page.evaluate(() => JSON.parse(localStorage.getItem('ledger-payment-links') ?? '[]')[0])
  expect(storedLink).toMatchObject({ amountCents: 48000, amountPaid: 0, allowPartial: true, minFirstPayment: 2500 })
  const rejectedPayment = await page.request.post('/api/validate/payment', {
    data: { link: storedLink, amountCents: 48001 },
  })
  expect(rejectedPayment.status()).toBe(422)

  await createdRow.getByRole('button', { name: 'Record payment' }).click()
  await page.getByLabel('Payment amount for Website redesign deposit').fill('30.00')
  await createdRow.getByRole('button', { name: 'Save' }).click()
  await expect(createdRow).toContainText('Partially paid')
  await expect(createdRow).toContainText('$30.00')
  await expect(createdRow).toContainText('$450.00')

  await page.getByRole('button', { name: /^Partially paid/ }).click()
  await expect(createdRow).toBeVisible()
  await expect(page.getByRole('button', { name: /^Partially paid/ })).toHaveAttribute('aria-pressed', 'true')

  await page.reload()
  const persistedRow = page.getByRole('row').filter({ hasText: 'Website redesign deposit' })
  await expect(persistedRow).toContainText('Partially paid')
  await expect(persistedRow).toContainText('$30.00')
  await expect(persistedRow).toContainText('$450.00')

  await persistedRow.getByRole('button', { name: 'Record payment' }).click()
  await page.getByLabel('Payment amount for Website redesign deposit').fill('450.00')
  await persistedRow.getByRole('button', { name: 'Save' }).click()
  await expect(persistedRow).toContainText('Paid')
  await expect(persistedRow).toContainText('$480.00')
  await expect(persistedRow).toContainText('$0.00')

  await page.reload()
  const completedRow = page.getByRole('row').filter({ hasText: 'Website redesign deposit' })
  await expect(completedRow).toContainText('Paid')
  const completedLink = await page.evaluate(() => JSON.parse(localStorage.getItem('ledger-payment-links') ?? '[]')[0])
  expect(completedLink.amountPaid).toBe(48000)
  expect(completedLink.payments.map((payment: { amountCents: number }) => payment.amountCents)).toEqual([3000, 45000])
})