import { ChatErrorType, type ChatError } from '~/types/chat'

export interface ErrorHandlerConfig {
  onError?: (error: ChatError) => void
  onRetry?: (error: ChatError, attempt: number) => void
  onMaxRetries?: (error: ChatError) => void
}

/**
 * Chat Error Handler
 * Parses and categorizes errors, provides retry logic
 */
export class ChatErrorHandler {
  private config: ErrorHandlerConfig

  constructor(config: ErrorHandlerConfig = {}) {
    this.config = config
  }

  /**
   * Parse and categorize an error
   */
  parseError(error: unknown): ChatError {
    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        type: ChatErrorType.NETWORK,
        code: 'NETWORK_ERROR',
        message: error.message,
        userMessage: 'Unable to connect. Please check your internet connection.',
        retryable: true,
        originalError: error
      }
    }

    // API errors
    if (typeof error === 'object' && error !== null && 'http_status' in error) {
      const apiError = error as { http_status: number; message: string; errors?: unknown }

      switch (apiError.http_status) {
        case 401:
          return {
            type: ChatErrorType.AUTH,
            code: 'UNAUTHORIZED',
            message: apiError.message,
            userMessage: 'Your session has expired. Please log in again.',
            retryable: false,
            originalError: error
          }

        case 403:
          return {
            type: ChatErrorType.AUTH,
            code: 'FORBIDDEN',
            message: apiError.message,
            userMessage: 'You do not have permission to perform this action.',
            retryable: false,
            originalError: error
          }

        case 429:
          return {
            type: ChatErrorType.RATE_LIMIT,
            code: 'RATE_LIMITED',
            message: apiError.message,
            userMessage: 'Too many requests. Please wait a moment.',
            retryable: true,
            retryAfterMs: 60000, // Default 1 minute
            originalError: error
          }

        case 422:
          return {
            type: ChatErrorType.VALIDATION,
            code: 'VALIDATION_ERROR',
            message: apiError.message,
            userMessage: apiError.message || 'Please check your input.',
            retryable: false,
            originalError: error
          }

        default:
          if (apiError.http_status >= 500) {
            return {
              type: ChatErrorType.SERVER,
              code: 'SERVER_ERROR',
              message: apiError.message,
              userMessage: 'Something went wrong on our end. Please try again.',
              retryable: true,
              originalError: error
            }
          }
      }
    }

    // Ably-specific errors
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const ablyError = error as { code: number; message: string; statusCode?: number }

      // Token errors
      if (ablyError.code >= 40100 && ablyError.code < 40200) {
        return {
          type: ChatErrorType.AUTH,
          code: `ABLY_${ablyError.code}`,
          message: ablyError.message,
          userMessage: 'Connection authentication failed. Please refresh the page.',
          retryable: false,
          originalError: error
        }
      }

      // Rate limit errors
      if (ablyError.code === 42910) {
        return {
          type: ChatErrorType.RATE_LIMIT,
          code: 'ABLY_RATE_LIMIT',
          message: ablyError.message,
          userMessage: 'Message rate limit exceeded. Please slow down.',
          retryable: true,
          retryAfterMs: 5000,
          originalError: error
        }
      }
    }

    // Unknown errors
    return {
      type: ChatErrorType.UNKNOWN,
      code: 'UNKNOWN',
      message: error instanceof Error ? error.message : String(error),
      userMessage: 'An unexpected error occurred. Please try again.',
      retryable: true,
      originalError: error
    }
  }

  /**
   * Handle an error with appropriate action
   */
  async handleError(
    error: unknown,
    context?: { action?: string; channelId?: number }
  ): Promise<ChatError> {
    const chatError = this.parseError(error)

    console.error(`[ChatError] ${chatError.type}:${chatError.code}`, {
      message: chatError.message,
      context,
      retryable: chatError.retryable
    })

    this.config.onError?.(chatError)

    // Handle specific error types
    switch (chatError.type) {
      case ChatErrorType.AUTH:
        await this.handleAuthError(chatError)
        break

      case ChatErrorType.RATE_LIMIT:
        // Could show a rate limit notification
        break
    }

    return chatError
  }

  /**
   * Handle authentication errors
   */
  private async handleAuthError(error: ChatError): Promise<void> {
    if (error.code === 'UNAUTHORIZED') {
      const authStore = useAuthStore()
      const router = useRouter()

      // Clear auth and redirect to login
      authStore.logout()
      await router.push('/login?reason=session_expired')
    }
  }

  /**
   * Execute with retry logic
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    options?: {
      maxRetries?: number
      initialDelayMs?: number
      maxDelayMs?: number
    }
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? 3
    const initialDelay = options?.initialDelayMs ?? 1000
    const maxDelay = options?.maxDelayMs ?? 30000

    let lastError: ChatError | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = this.parseError(error)

        if (!lastError.retryable || attempt === maxRetries) {
          this.config.onMaxRetries?.(lastError)
          throw lastError
        }

        this.config.onRetry?.(lastError, attempt + 1)

        // Calculate delay with exponential backoff
        const delay = Math.min(
          lastError.retryAfterMs || initialDelay * Math.pow(2, attempt),
          maxDelay
        )

        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }
}

// Singleton with default configuration
let errorHandlerInstance: ChatErrorHandler | null = null

export const useChatErrorHandler = () => {
  if (!errorHandlerInstance) {
    errorHandlerInstance = new ChatErrorHandler({
      onError: (error) => {
        // Could integrate with a toast notification system
        console.error('[Chat Error]', error.userMessage)
      },
      onRetry: (error, attempt) => {
        console.log(`[Chat] Retrying... (attempt ${attempt})`)
      },
      onMaxRetries: (error) => {
        console.error('[Chat] Max retries reached:', error.userMessage)
      }
    })
  }
  return errorHandlerInstance
}
