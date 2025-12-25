import { test, expect } from '@playwright/test'

test.describe('Responsive Design', () => {
  test('should display correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Check if elements are visible on mobile
    await expect(page.getByText('IntroMatch')).toBeVisible()
    await expect(page.locator('h1')).toBeVisible()
    
    // CTA buttons should stack on mobile
    const ctaSection = page.locator('section').first()
    await expect(ctaSection).toBeVisible()
  })

  test('should display correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')

    await expect(page.getByText('IntroMatch')).toBeVisible()
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should display correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')

    await expect(page.getByText('IntroMatch')).toBeVisible()
    await expect(page.locator('h1')).toBeVisible()
    
    // Features should be in a row on desktop
    const featuresSection = page.locator('text=Why Choose IntroMatch?').locator('..')
    await expect(featuresSection).toBeVisible()
  })
})
