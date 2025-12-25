# Dating App - Playwright Tests

## Overview

This directory contains end-to-end tests for the Dating App using Playwright.

## Test Files

- **auth.spec.ts** - Authentication flow tests (login, register, validation)
- **navigation.spec.ts** - Navigation and routing tests
- **responsive.spec.ts** - Responsive design tests across different viewports
- **accessibility.spec.ts** - Accessibility compliance tests
- **map-markers.spec.ts** - Google Maps markers functionality tests (placement, interaction, visibility)

## Running Tests

### Run all tests
```bash
npm run test
```

### Run tests in UI mode
```bash
npm run test:ui
```

### Run specific test file
```bash
npx playwright test tests/auth.spec.ts
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run tests in a specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Debug tests
```bash
npx playwright test --debug
```

## Test Coverage

### Authentication Tests
- ✅ Landing page display
- ✅ Navigate to login/register
- ✅ Form validation (empty fields, invalid email, password length)
- ✅ Password mismatch validation
- ✅ Navigation between auth pages

### Navigation Tests
- ✅ Main sections navigation
- ✅ Footer links
- ✅ Header visibility

### Responsive Design Tests
- ✅ Mobile viewport (375x667)
- ✅ Tablet viewport (768x1024)
- ✅ Desktop viewport (1920x1080)

### Accessibility Tests
- ✅ Form labels
- ✅ ARIA roles
- ✅ Image alt text
- ✅ Keyboard navigation

### Map Markers Tests
- ✅ Map initialization with geolocation
- ✅ Marker placement and rendering
- ✅ Active vs inactive venue markers
- ✅ User location marker display
- ✅ Marker click interactions
- ✅ Venue detail panel display
- ✅ User count badges on markers
- ✅ Distance information display
- ✅ Venue search and filtering
- ✅ Marker refresh functionality
- ✅ Invalid coordinates handling
- ✅ Marker animations
- ✅ Responsive map behavior
- ✅ Edge cases (empty results, API errors, large datasets)

## Writing New Tests

When adding new tests:

1. Create a new `.spec.ts` file in the `tests/` directory
2. Import test and expect from '@playwright/test'
3. Group related tests in `test.describe()` blocks
4. Use descriptive test names
5. Follow the AAA pattern: Arrange, Act, Assert

Example:
```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test('should do something specific', async ({ page }) => {
    // Arrange
    await page.goto('/some-page')
    
    // Act
    await page.click('button')
    
    // Assert
    await expect(page.locator('.result')).toBeVisible()
  })
})
```

## Best Practices

1. **Use data-testid attributes** for stable selectors
2. **Keep tests independent** - each test should work in isolation
3. **Clean up after tests** - reset state when needed
4. **Use proper waits** - rely on Playwright's auto-waiting
5. **Screenshot on failure** - already configured in playwright.config.ts

## CI/CD Integration

Tests are configured to run in CI with:
- Retries: 2 attempts on failure
- Single worker for consistent results
- HTML reporter for viewing results

## Debugging Tips

1. Use `page.pause()` to pause test execution
2. Use `--debug` flag to step through tests
3. Check `test-results/` for screenshots and videos of failures
4. Use `--ui` mode for interactive debugging
