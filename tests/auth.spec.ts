import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test from the home page
    await page.goto('/')
  })

  test('should display landing page correctly', async ({ page }) => {
    // Check if the page title is correct
    await expect(page).toHaveTitle(/Dating App/)

    // Check for main heading
    await expect(page.locator('h1')).toContainText('Find Your')
    await expect(page.locator('h1')).toContainText('Perfect Match')

    // Check for CTA buttons
    await expect(page.getByRole('link', { name: 'Get Started Free' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible()
  })

  test('should navigate to login page', async ({ page }) => {
    // Click on Sign In button
    await page.getByRole('link', { name: 'Sign In' }).first().click()

    // Verify we're on the login page
    await expect(page).toHaveURL('/login')
    await expect(page.locator('h2')).toContainText('Welcome back')

    // Check for form fields
    await expect(page.getByLabel('Email address')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })

  test('should navigate to register page', async ({ page }) => {
    // Click on Get Started button
    await page.getByRole('link', { name: 'Get Started Free' }).first().click()

    // Verify we're on the register page
    await expect(page).toHaveURL('/register')
    await expect(page.locator('h2')).toContainText('Create your account')

    // Check for form fields
    await expect(page.getByLabel('First name')).toBeVisible()
    await expect(page.getByLabel('Last name')).toBeVisible()
    await expect(page.getByLabel('Email address')).toBeVisible()
    await expect(page.getByLabel('Date of birth')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible()
  })

  test('should show validation errors on empty login form submit', async ({ page }) => {
    await page.goto('/login')

    // Submit empty form
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Check for validation errors
    await expect(page.getByText('Email is required')).toBeVisible()
    await expect(page.getByText('Password is required')).toBeVisible()
  })

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/login')

    // Enter invalid email
    await page.getByLabel('Email address').fill('invalid-email')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Check for email validation error
    await expect(page.getByText('Email is invalid')).toBeVisible()
  })

  test('should show password length validation on register', async ({ page }) => {
    await page.goto('/register')

    // Fill form with short password
    await page.getByLabel('First name').fill('John')
    await page.getByLabel('Last name').fill('Doe')
    await page.getByLabel('Email address').fill('john@example.com')
    await page.getByLabel('Date of birth').fill('1990-01-01')
    await page.getByLabel('Password', { exact: true }).fill('123')
    await page.getByLabel('Confirm password').fill('123')
    await page.getByRole('button', { name: 'Create account' }).click()

    // Check for password length error
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible()
  })

  test('should show password mismatch error', async ({ page }) => {
    await page.goto('/register')

    // Fill form with mismatched passwords
    await page.getByLabel('Password', { exact: true }).fill('password123')
    await page.getByLabel('Confirm password').fill('password456')
    await page.getByRole('button', { name: 'Create account' }).click()

    // Check for password mismatch error
    await expect(page.getByText('Passwords do not match')).toBeVisible()
  })

  test('should navigate between login and register pages', async ({ page }) => {
    await page.goto('/login')

    // Click create account link
    await page.getByRole('link', { name: 'Create an account' }).click()
    await expect(page).toHaveURL('/register')

    // Click sign in link
    await page.getByRole('link', { name: 'Sign in' }).click()
    await expect(page).toHaveURL('/login')
  })
})
