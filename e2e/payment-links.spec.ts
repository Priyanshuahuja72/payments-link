import { expect, test } from '@playwright/test'

test('creates a payment link and filters the list by status', async ({ page }) => {
  await page.goto('/')
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
  await expect(page.getByRole('row').filter({ hasText: 'Website redesign deposit' })).toContainText('Paid')
})