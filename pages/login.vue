<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const router = useRouter()
const api = useApi()

const step = ref<'phone' | 'otp'>('phone')
const form = reactive({
  phone_number: '',
  otp_code: ''
})

const errors = reactive({
  phone_number: '',
  otp_code: '',
  general: ''
})

const loading = ref(false)
const resendCountdown = ref(0)
let countdownInterval: NodeJS.Timeout | null = null

const validatePhone = () => {
  errors.phone_number = ''
  errors.general = ''

  if (!form.phone_number) {
    errors.phone_number = 'Phone number is required'
    return false
  }

  // Basic validation for phone number (should start with + and have digits)
  if (!/^\+?[1-9]\d{1,14}$/.test(form.phone_number.replace(/\s/g, ''))) {
    errors.phone_number = 'Please enter a valid phone number'
    return false
  }

  return true
}

const handleSendOTP = async () => {
  if (!validatePhone()) return

  try {
    loading.value = true

    // First, check if username (phone number) exists
    const checkResponse = await api.post('/auth/check-username', {
      username: form.phone_number
    }, false)

    // If we get here, username exists - proceed to generate OTP
    if (checkResponse) {
      const otpResponse = await api.post('/auth/otp/generate', {
        phone_number: form.phone_number
      }, false)

      if (otpResponse.success) {
        step.value = 'otp'
        startResendCountdown()
      }
    }
  } catch (error: any) {
    // If username not found, show appropriate error
    if (error.error_code === 'PHONE_NUMBER_NOT_FOUND' || error.http_status === 404) {
      errors.general = 'This phone number is not registered. Please sign up first.'
    } else {
      errors.general = error.message || 'Failed to send verification code'
    }
  } finally {
    loading.value = false
  }
}

const handleVerifyOTP = async () => {
  errors.otp_code = ''
  errors.general = ''

  if (!form.otp_code || form.otp_code.length !== 5) {
    errors.otp_code = 'Please enter the 5-digit code'
    return
  }

  try {
    loading.value = true
    const response = await api.post('/auth/login', {
      username: form.phone_number,
      otp: form.otp_code
    }, false)

    // Response structure: { success, data: { access_token, user } } or direct { access_token, user }
    const authData = response.data || response

    if (authData.access_token && authData.user) {
      const authStore = useAuthStore()
      authStore.setToken(authData.access_token)
      authStore.setUser(authData.user)
      authStore.persistToStorage()

      await router.push('/dashboard')
    }
  } catch (error: any) {
    errors.general = error.message || 'Invalid verification code'
    form.otp_code = ''
  } finally {
    loading.value = false
  }
}

const handleResend = () => {
  if (resendCountdown.value > 0) return
  form.otp_code = ''
  errors.otp_code = ''
  errors.general = ''
  handleSendOTP()
}

const startResendCountdown = () => {
  resendCountdown.value = 60
  countdownInterval = setInterval(() => {
    resendCountdown.value--
    if (resendCountdown.value <= 0 && countdownInterval) {
      clearInterval(countdownInterval)
    }
  }, 1000)
}

const goBack = () => {
  step.value = 'phone'
  form.otp_code = ''
  errors.otp_code = ''
  errors.general = ''
  if (countdownInterval) {
    clearInterval(countdownInterval)
    resendCountdown.value = 0
  }
}

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-pink-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full">
      <UiCard variant="elevated" padding="lg">
        <!-- Back Button (only on OTP step) -->
        <button
          v-if="step === 'otp'"
          @click="goBack"
          class="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span class="text-sm font-medium">Back</span>
        </button>

        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="w-16 h-16 mx-auto bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mb-4">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-900">
            {{ step === 'phone' ? 'Welcome Back' : 'Verification Code' }}
          </h2>
          <p class="text-gray-600 mt-2">
            {{ step === 'phone' ? 'Enter your phone number to log in' : `Enter the code sent to ${form.phone_number}` }}
          </p>
        </div>

        <!-- Error Alert -->
        <div v-if="errors.general" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p class="text-sm text-red-600">{{ errors.general }}</p>
        </div>

        <!-- Phone Number Step -->
        <form v-if="step === 'phone'" @submit.prevent="handleSendOTP" class="space-y-5">
          <UiPhoneInput
            v-model="form.phone_number"
            label="Phone Number"
            placeholder="+61 000 000 000"
            :error="errors.phone_number"
            required
          />

          <UiButton
            type="submit"
            size="lg"
            :loading="loading"
            :disabled="loading"
            fullWidth
          >
            {{ loading ? 'Sending code...' : 'Continue' }}
          </UiButton>
        </form>

        <!-- OTP Verification Step -->
        <form v-if="step === 'otp'" @submit.prevent="handleVerifyOTP" class="space-y-6">
          <UiOTPInput
            v-model="form.otp_code"
            :length="5"
            :error="errors.otp_code"
            @complete="handleVerifyOTP"
          />

          <div class="text-center">
            <button
              type="button"
              @click="handleResend"
              :disabled="resendCountdown > 0"
              class="text-sm font-medium transition-colors"
              :class="resendCountdown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-primary-600 hover:text-primary-700'"
            >
              {{ resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend' }}
            </button>
          </div>

          <UiButton
            type="submit"
            size="lg"
            :loading="loading"
            :disabled="loading || form.otp_code.length !== 5"
            fullWidth
          >
            {{ loading ? 'Verifying...' : 'Confirm Code' }}
          </UiButton>
        </form>

        <!-- Sign Up Link -->
        <p class="mt-6 text-center text-sm text-gray-600">
          Don't have an account?
          <NuxtLink to="/register" class="font-medium text-primary-600 hover:text-primary-700">
            Create an account
          </NuxtLink>
        </p>
      </UiCard>
    </div>
  </div>
</template>
