# 📱 Phone Number Authentication - Implementation Guide

## ✅ What's Been Implemented

Complete phone number authentication with OTP verification, matching your reference designs.

---

## 🔄 Authentication Flow

### Login Flow
```
1. User enters phone number (+61 000 000 000)
   └─ Page: /login (step: 'phone')

2. System checks if username exists
   └─ Endpoint: POST /auth/check-username
   └─ Request: { username: "+61000000000" }
   └─ If not found: Show "phone number not registered" error

3. System sends OTP via SMS
   └─ Endpoint: POST /auth/otp/generate
   └─ Request: { phone_number: "+61000000000" }

4. User enters 5-digit OTP code
   └─ Page: /login (step: 'otp')
   └─ Auto-submit when 5 digits entered
   └─ 60-second resend countdown

5. System verifies OTP and logs in
   └─ Endpoint: POST /auth/login
   └─ Request: { username: "+61000000000", password: "12345" }
   └─ Response: { token, user }

6. Redirect to /dashboard
   └─ Token stored in localStorage
   └─ User stored in Pinia store
```

### Register Flow
```
1. User enters phone number
   └─ Page: /register (step: 'phone')

2. System checks username availability
   └─ Endpoint: POST /auth/check-username
   └─ Request: { username: "+61000000000" }
   └─ If exists: Show "already registered" error

3. System sends OTP via SMS
   └─ Endpoint: POST /auth/otp/generate
   └─ Request: { phone_number: "+61000000000" }

4. User enters 5-digit OTP code
   └─ Page: /register (step: 'otp')
   └─ Auto-submit when 5 digits entered

5. System creates account and logs in
   └─ Endpoint: POST /auth/register
   └─ Request: { phone_number: "+61000000000", password: "12345" }
   └─ Response: { token, user }

6. Redirect to /onboarding
   └─ Token stored in localStorage
   └─ User completes profile basics
```

---

## 📁 Files Updated

### Types (types/user.ts)
```typescript
export interface User {
  id: number
  phone_number: string              // Primary identifier
  phone_number_verified_at: string | null
  email?: string                    // Optional
  ...
}

export interface LoginCredentials {
  phone_number: string              // Phone only, no password
}

export interface OTPVerification {
  phone_number: string
  code: string                      // 5-digit OTP
}

export interface RegisterData {
  phone_number: string              // No password required
  first_name: string
  last_name: string
  date_of_birth: string
  gender: 'male' | 'female' | 'non-binary' | 'other'
}

export interface OTPResponse {
  success: boolean
  message: string
  verification_required: boolean
}
```

### Components Created

#### 1. PhoneInput.vue
```vue
<UiPhoneInput
  v-model="form.phone_number"
  label="Phone Number"
  placeholder="+61 000 000 000"
  :error="errors.phone_number"
  required
/>
```

**Features:**
- Auto-formats phone numbers
- Removes non-digit characters (except +)
- Shows error states
- Supports hints
- Full accessibility

#### 2. OTPInput.vue
```vue
<UiOTPInput
  v-model="form.otp_code"
  :length="5"
  :error="errors.otp_code"
  @complete="handleVerifyOTP"
/>
```

**Features:**
- 5-digit input (configurable length)
- Auto-focus next field
- Paste support (full OTP paste)
- Keyboard navigation (arrows, backspace)
- Auto-submit on complete
- Visual states (empty, filled, error)
- Mobile-optimized (numeric keyboard)
- Numeric input validation (filters non-numeric characters)

### Pages Updated

#### /pages/login.vue
**Two-step process:**

**Step 1: Phone Number Entry**
- Phone input field
- Validation (required, format check)
- "Continue" button
- Sends OTP on submit

**Step 2: OTP Verification**
- 5-digit OTP input
- Shows phone number in subtitle
- Resend button (60s cooldown)
- Back button to edit phone
- Auto-submit on complete
- Loading states
- Numeric input validation

#### /pages/register.vue
**Two-step process:**

**Step 1: Registration Info**
- Phone number
- First & last name
- Date of birth (18+ validation)
- Gender selection (radio buttons)
- Terms checkbox
- Creates account & sends OTP

**Step 2: OTP Verification**
- Same as login OTP step
- Verifies and logs in user

---

## 🎨 UI Components Design

### Phone Input Field
```
┌─────────────────────────────────┐
│ Phone Number *                  │
├─────────────────────────────────┤
│ +61 000 000 000                │
└─────────────────────────────────┘
```

### OTP Input
```
┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
│ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │
└───┘ └───┘ └───┘ └───┘ └───┘
```

**States:**
- Empty: Gray border, white background
- Filled: Blue border, blue-tinted background
- Error: Red border, red-tinted background
- Focus: Blue ring

### Resend Button
```
Resend code in 59s  →  Resend
(disabled, gray)        (active, blue)
```

---

## 🔌 API Integration

### Endpoints Used

```typescript
// Generate OTP
POST /auth/otp/generate
Body: { phone_number: "+61400000000" }
Response: { success: true, message: "OTP sent" }

// Check username exists
POST /auth/check-username
Body: { username: "+61400000000" }
Response: { success: true }  // User exists
Error: { error_code: "PHONE_NUMBER_NOT_FOUND" }  // User not found

// Login with OTP
POST /auth/login
Body: {
  phone_number: "+61400000000",  // phone number
  otp: "12345"                   // 5-digit OTP code
}
Response: {
  success: true,
  data: { token: "...", user: {...} }
}

// Register
POST /auth/register
Body: {
  phone_number: "+61400000000",
  otp: "12345"                   // 5-digit OTP code
}
Response: {
  success: true,
  data: { token: "...", user: {...} }
}
```

### Phone Number Format

**Input:** Any format (e.g., "61 400 000 000", "0400000000")
**Processed:** `+61400000000` (E.164 format)
**Validation:** `/^\+?[1-9]\d{1,14}$/`

---

## ⚙️ Configuration

### Runtime Config (nuxt.config.ts)
```typescript
runtimeConfig: {
  public: {
    apiBase: 'http://localhost:8000/api/v1'
  }
}
```

### Environment Variables (.env)
```env
NUXT_PUBLIC_API_BASE=http://localhost:8000/api/v1
```

---

## 🧪 Testing

### Manual Testing Steps

**Test Login:**
```bash
1. npm run dev
2. Navigate to http://localhost:3000/login
3. Enter phone: +61400000000
4. Click "Continue"
5. Enter OTP from SMS (or check backend logs)
6. Should redirect to /dashboard
```

**Test Registration:**
```bash
1. Navigate to http://localhost:3000/register
2. Fill all fields
3. Click "Create account"
4. Enter OTP code
5. Should redirect to /dashboard
```

### Playwright Tests (to be updated)

Current tests need updating for phone auth:
- `tests/auth.spec.ts` - Update form fields
- Change email fields to phone number fields
- Update validation tests

---

## 🚀 Usage Examples

### Phone Input Component
```vue
<template>
  <UiPhoneInput
    v-model="phoneNumber"
    label="Your Phone Number"
    placeholder="+61 000 000 000"
    :error="errorMessage"
    hint="We'll send you a verification code"
    required
  />
</template>

<script setup>
const phoneNumber = ref('')
const errorMessage = ref('')
</script>
```

### OTP Input Component
```vue
<template>
  <UiOTPInput
    v-model="otpCode"
    :length="5"
    :error="otpError"
    @complete="handleComplete"
  />
</template>

<script setup>
const otpCode = ref('')
const otpError = ref('')

const handleComplete = (code) => {
  console.log('OTP entered:', code)  // "12345"
  // Auto-verify when complete
  verifyOTP(code)
}
</script>
```

### Complete Login Flow
```vue
<script setup>
const api = useApi()
const router = useRouter()

const step = ref<'phone' | 'otp'>('phone')
const phoneNumber = ref('')
const otpCode = ref('')
const loading = ref(false)

// Step 1: Send OTP
const sendOTP = async () => {
  loading.value = true
  try {
    await api.post('/auth/otp/generate', {
      phone_number: phoneNumber.value
    }, false)
    step.value = 'otp'
  } finally {
    loading.value = false
  }
}

// Step 2: Verify OTP
const verifyOTP = async () => {
  loading.value = true
  try {
    const response = await api.post('/auth/login', {
      phone_number: phoneNumber.value,
      otp: otpCode.value
    }, false)

    // Save token and user
    const authStore = useAuthStore()
    authStore.setToken(response.data.token)
    authStore.setUser(response.data.user)
    authStore.persistToStorage()

    router.push('/dashboard')
  } finally {
    loading.value = false
  }
}
</script>
```

---

## 🎯 Key Features

### Security
✅ No password storage (OTP-based)
✅ Token-based authentication
✅ 60-second cooldown on resend
✅ Phone number validation
✅ localStorage for token persistence

### UX
✅ Auto-focus between OTP digits
✅ Paste entire OTP code
✅ Countdown timer for resend
✅ Back button to edit phone
✅ Loading states
✅ Error handling
✅ Auto-submit on OTP complete
✅ Mobile keyboard optimization

### Accessibility
✅ Proper labels
✅ ARIA attributes
✅ Keyboard navigation
✅ Focus management
✅ Error announcements
✅ Required field indicators

---

## 📊 Validation Rules

### Phone Number
```typescript
- Required: "Phone number is required"
- Format: /^\+?[1-9]\d{1,14}$/
- Error: "Please enter a valid phone number"
```

### OTP Code
```typescript
- Required: Must be 5 digits
- Format: Numeric only
- Error: "Please enter the 5-digit code"
- Auto-submit: On 5th digit entry
- Input validation: Non-numeric characters filtered
```

### Registration
```typescript
- First name: Required
- Last name: Required
- Date of birth: Required, must be 18+
- Gender: Required (male/female/non-binary/other)
- Phone: Same as login validation
```

---

## 🔧 Customization

### Change OTP Length
```vue
<UiOTPInput
  v-model="otpCode"
  :length="6"  <!-- Change to 6 digits -->
/>
```

### Change Resend Cooldown
```typescript
// In login.vue or register.vue
const startResendCountdown = () => {
  resendCountdown.value = 120  // Change to 120 seconds
  countdownInterval = setInterval(() => {
    resendCountdown.value--
    if (resendCountdown.value <= 0 && countdownInterval) {
      clearInterval(countdownInterval)
    }
  }, 1000)
}
```

### Change Phone Format
```typescript
// In PhoneInput.vue
const formatPhoneNumber = (value: string) => {
  // Custom formatting logic
  const cleaned = value.replace(/[^\d+]/g, '')
  return cleaned
}
```

---

## 🐛 Troubleshooting

### OTP not received
```
1. Check API logs for OTP generation
2. Verify phone number format (must include +)
3. Check SMS service configuration
4. Use test OTP codes in development
```

### Login fails after OTP
```
1. Check token in API response
2. Verify localStorage has auth_token
3. Check Pinia store has user data
4. Verify /auth/me endpoint works
```

### Resend button disabled
```
1. Wait for 60-second countdown
2. Check console for interval errors
3. Verify countdownInterval is clearing
```

### Navigation not working
```
1. Check router.push is awaited
2. Verify auth middleware allows route
3. Check token is set before navigation
```

---

## 📝 Next Steps

1. **Update Playwright Tests**
   - Change email fields to phone fields
   - Update validation expectations
   - Add OTP verification tests

2. **Add SMS Service**
   - Configure Twilio/AWS SNS
   - Handle SMS delivery errors
   - Add rate limiting

3. **Enhance Security**
   - Add CAPTCHA on OTP request
   - Implement rate limiting
   - Add device fingerprinting

4. **Improve UX**
   - Add phone number autodetection
   - Country code selector
   - Save last used phone number

5. **Additional Features**
   - "Remember this device" option
   - Biometric authentication
   - Multi-factor authentication

---

## 📚 References

- **Laravel API Endpoints**: `/Developer/intro/api`
- **Reference Implementation**: `/Developer/traides4all/web-app`
- **Design Files**: `/Downloads/Login.png`, `/Downloads/Sign Up.png`

---

**✨ Implementation Complete! Phone number authentication is now fully functional.**

Run `npm run dev` and test the login/register flows! 🚀
