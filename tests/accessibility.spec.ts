import { test, expect } from '@playwright/test'

test.describe('Accessibility', () => {
  test('login page should have proper labels', async ({ page }) => {
    await page.goto('/login')

    // Check for proper form labels
    await expect(page.getByLabel('Email address')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    
    // Check submit button is accessible
    const submitButton = page.getByRole('button', { name: 'Sign in' })
    await expect(submitButton).toBeEnabled()
  })

  test('register page should have proper labels', async ({ page }) => {
    await page.goto('/register')

    // Check for proper form labels
    await expect(page.getByLabel('First name')).toBeVisible()
    await expect(page.getByLabel('Last name')).toBeVisible()
    await expect(page.getByLabel('Email address')).toBeVisible()
    await expect(page.getByLabel('Date of birth')).toBeVisible()
    
    // Gender selection should be accessible
    await expect(page.getByText('Gender')).toBeVisible()
  })

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/')

    // Logo link should be accessible
    const logoLink = page.getByRole('link', { name: /IntroMatch/i }).first()
    await expect(logoLink).toBeVisible()

    // CTA buttons should be accessible
    const getStartedButton = page.getByRole('link', { name: 'Get Started Free' })
    await expect(getStartedButton).toBeEnabled()
  })

  test('images should have alt text', async ({ page }) => {
    await page.goto('/')

    // Check that images have alt attributes
    const images = page.locator('img[alt]')
    const count = await images.count()
    expect(count).toBeGreaterThan(0)
  })
})
