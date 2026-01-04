# Onboarding Data Loading Test Report

**Date:** 2026-01-05
**Test Suite:** Onboarding Data Loading E2E Tests
**Total Tests:** 19
**Passed:** 14
**Failed:** 5

## Executive Summary

The test suite successfully identified critical issues with the onboarding data loading functionality. **Existing user data is NOT being populated in onboarding forms**, confirming the reported bug.

## Test Results Overview

### Passed Tests (14)
- Error handling for API failures (graceful degradation)
- Empty data handling for new users
- Network timeout handling
- Basic page navigation and loading

### Failed Tests (5)

#### 1. Name Fields Not Populated from Profile Data
**Test:** `should populate name fields from profile data in auth store`
**Status:** FAILED
**Issue:** Both first name and last name fields are empty despite user profile data being available in localStorage

**Actual Behavior:**
```
First Name: "" (empty)
Last Name: "" (empty)
```

**Expected Behavior:**
```
First Name: "Jane"
Last Name: "Smith"
```

**Root Cause:** The `loadExistingData()` function is being called, but the data is not being properly propagated to the form input fields.

---

#### 2. User Attributes API Not Being Called
**Test:** `should make API call to fetch user attributes on mount`
**Status:** FAILED
**Issue:** The `/api/v1/profile/user/attributes` endpoint is NOT being called when navigating to attribute-related pages (ethnicity, work, etc.)

**Actual Behavior:**
```
attributesApiCalled: false
```

**Expected Behavior:**
```
attributesApiCalled: true
```

**Root Cause:** The `loadExistingData()` function may not be executing the API call, or the API call is failing silently.

---

#### 3. User Preferences API Not Being Called
**Test:** `should make API call to fetch user preferences on mount`
**Status:** FAILED
**Issue:** The `/api/v1/profile/user/preferences` endpoint is NOT being called when navigating to preferences pages

**Actual Behavior:**
```
preferencesApiCalled: false
```

**Expected Behavior:**
```
preferencesApiCalled: true
```

**Root Cause:** Similar to attributes - the data loading logic is not triggering API calls.

---

#### 4. User Interests API Not Being Called
**Test:** `should make API call to fetch user interests on mount`
**Status:** FAILED
**Issue:** The `/api/v1/profile/user/interests` endpoint is NOT being called when navigating to interests page

**Actual Behavior:**
```
interestsApiCalled: false
```

**Expected Behavior:**
```
interestsApiCalled: true
```

---

#### 5. Age Range Not Populated with Existing Data
**Test:** `should populate age range sliders with existing data`
**Status:** FAILED
**Issue:** Age range sliders show default values (20-30) instead of existing user preferences (25-35)

**Actual Behavior:**
```
Age Min: 20 (default)
Age Max: 30 (default)
```

**Expected Behavior:**
```
Age Min: 25 (from user preferences)
Age Max: 35 (from user preferences)
```

---

## Critical Findings

### Issue #1: API Calls Not Being Made
The most critical finding is that the three data-loading API endpoints are NOT being called:
- `/api/v1/profile/user/attributes`
- `/api/v1/profile/user/preferences`
- `/api/v1/profile/user/interests`

**Evidence:**
```javascript
API call counts: {
  attributes: 0,    // Should be called
  preferences: 0,   // Should be called
  interests: 0      // Should be called
}
```

### Issue #2: Data Not Propagating to Form Fields
Even when data exists in the auth store (localStorage), it's not being populated into form input fields.

### Issue #3: Data Loading Caching Works (But Has No Data)
Interestingly, the caching mechanism appears to work correctly (API calls limited to prevent multiple calls), but there's no data to cache because the initial load isn't happening.

## Technical Analysis

### Code Review: useOnboarding.ts

The `loadExistingData()` function in `/composables/useOnboarding.ts` is designed to:

1. Check `dataLoaded` flag to prevent duplicate calls
2. Load from auth store profile
3. Make API calls to fetch attributes, preferences, interests
4. Populate the onboarding state

**Potential Issues:**

1. **dataLoaded Flag:** The function checks `if (dataLoaded.value && !forceReload) return;`
   - If this flag gets set prematurely, subsequent calls will skip loading
   - Need to verify this flag is properly managed

2. **API Call Errors:** The function has try-catch blocks that suppress errors:
   ```typescript
   catch (err) {
     console.warn('Failed to load user attributes:', err)
   }
   ```
   - Errors are being silently caught and logged as warnings
   - The page continues loading even if API calls fail

3. **Component Initialization:** In `pages/onboarding/name.vue`:
   ```typescript
   onMounted(async () => {
     syncStepById('name')
     await loadExistingData()
     initFromState()
   })
   ```
   - `loadExistingData()` is called, but there may be a race condition
   - The local reactive refs may not be updating properly

### Recommendations

#### Immediate Actions Required:

1. **Verify API Endpoints Are Accessible**
   - Ensure the endpoints `/profile/user/attributes`, `/profile/user/preferences`, `/profile/user/interests` exist and are reachable
   - Check if authentication headers are being sent properly

2. **Add Better Error Logging**
   - Replace `console.warn()` with more visible error handling
   - Show user-facing error messages when data loading fails

3. **Fix Data Propagation**
   - Ensure the state updates from `loadExistingData()` properly trigger Vue reactivity
   - Verify the `watch()` statements in onboarding pages are functioning

4. **Debug the dataLoaded Flag**
   - Add logging to track when this flag is set
   - Ensure it's not preventing legitimate data loading

5. **Add Loading States**
   - Show loading indicators while data is being fetched
   - Disable form submission until data loading completes

#### Longer-term Improvements:

1. **Implement Retry Logic**
   - Add automatic retries for failed API calls
   - Implement exponential backoff

2. **Add User Feedback**
   - Show clear messages when data fails to load
   - Provide manual refresh button

3. **Improve Test Coverage**
   - Add tests for API authentication
   - Test network conditions (offline, slow connection)

## Test Files Created

1. **Test Fixtures:**
   - `/tests/fixtures/onboarding-data-loading.ts`
   - Contains mock API responses and expected form values

2. **Test Spec:**
   - `/tests/e2e/onboarding-data-loading.spec.ts`
   - Comprehensive test suite covering data loading, error handling, and persistence

## How to Run Tests

```bash
# Run all onboarding data loading tests
npm test -- tests/e2e/onboarding-data-loading.spec.ts

# Run specific test
npm test -- tests/e2e/onboarding-data-loading.spec.ts -g "should populate name fields"

# Run with UI mode for debugging
npm run test:ui
```

## Next Steps

1. Fix the API endpoint issues (ensure they're being called)
2. Fix the data propagation from state to form fields
3. Re-run the test suite to verify fixes
4. Add additional tests for edge cases
5. Deploy fixes to production

## Conclusion

The test suite successfully identified the root cause of the reported issue: **existing user data is not being loaded or populated in onboarding forms**. The specific problems are:

1. API calls to fetch user data are not being made
2. Even when data exists in the auth store, it's not populating form fields
3. Default values are being used instead of existing user preferences

These issues need to be addressed before users can successfully resume their onboarding progress.
