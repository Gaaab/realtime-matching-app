import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should navigate through main sections', async ({ page }) => {
    await page.goto('/')

    // Check header is visible
    await expect(page.getByText('IntroMatch')).toBeVisible()

    // Scroll to features section
    await page.locator('text=Why Choose IntroMatch?').scrollIntoViewIfNeeded()
    await expect(page.locator('text=Verified Profiles')).toBeVisible()
    await expect(page.locator('text=Smart Matching')).toBeVisible()

    // Scroll to testimonials
    await page.locator('text=Success Stories').scrollIntoViewIfNeeded()
    await expect(page.locator('text=Success Stories')).toBeVisible()
  })

  test('should have working footer links', async ({ page }) => {
    await page.goto('/')

    // Scroll to footer
    await page.locator('footer').scrollIntoViewIfNeeded()

    // Check footer sections are visible
    await expect(page.locator('footer').getByText('Product')).toBeVisible()
    await expect(page.locator('footer').getByText('Company')).toBeVisible()
    await expect(page.locator('footer').getByText('Support')).toBeVisible()

    // Check social links exist
    const socialLinks = page.locator('footer a[aria-label]')
    await expect(socialLinks).toHaveCount(4)
  })
})
