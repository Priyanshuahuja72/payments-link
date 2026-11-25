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
  await page.getByRole('button', { name: /create payment link/i }).click()

  const createdRow = page.getByRole('row').filter({ hasText: 'Website redesign deposit' })
  await expect(createdRow).toContainText('Jordan Lee')
  await expect(createdRow).toContainText('$480.00')
  await expect(createdRow).toContainText('Unpaid')

  await page.getByRole('button', { name: /^Unpaid/ }).click()
  await expect(createdRow).toBeVisible()
  await expect(page.getByRole('button', { name: /^Unpaid/ })).toHaveAttribute('aria-pressed', 'true')
})