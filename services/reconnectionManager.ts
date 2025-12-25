export interface ReconnectionConfig {
  maxAttempts: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  jitterFactor: number
}

export type ReconnectionState = 'idle' | 'reconnecting' | 'connected' | 'failed'

const DEFAULT_CONFIG: ReconnectionConfig = {
  maxAttempts: 10,
  initialDelayMs: 1000,
  maxDelayMs: 60000,
  backoffMultiplier: 2,
  jitterFactor: 0.25
}

/**
 * Reconnection Manager
 * Handles automatic reconnection with exponential backoff
 */
export class ReconnectionManager {
  private config: ReconnectionConfig
  private state = ref<ReconnectionState>('idle')
  private attempts = ref(0)
  private nextRetryMs = ref(0)
  private retryTimeout: NodeJS.Timeout | null = null
  private countdownInterval: NodeJS.Timeout | null = null

  private onReconnect: (() => Promise<void>) | null = null
  private onSuccess: (() => void) | null = null
  private onFailure: ((error: Error) => void) | null = null
  private onStateChange: ((state: ReconnectionState) => void) | null = null

  constructor(config: Partial<ReconnectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Set the reconnection handler
   */
  setReconnectHandler(handler: () => Promise<void>) {
    this.onReconnect = handler
  }

  /**
   * Set success callback
   */
  setOnSuccess(callback: () => void) {
    this.onSuccess = callback
  }

  /**
   * Set failure callback
   */
  setOnFailure(callback: (error: Error) => void) {
    this.onFailure = callback
  }

  /**
   * Set state change callback
   */
  setOnStateChange(callback: (state: ReconnectionState) => void) {
    this.onStateChange = callback
  }

  /**
   * Start reconnection process
   */
  startReconnecting(): void {
    if (this.state.value === 'reconnecting') {
      return
    }

    this.setState('reconnecting')
    this.attempts.value = 0
    this.scheduleReconnect()
  }

  /**
   * Stop reconnection attempts
   */
  stop(): void {
    this.clearTimers()
    this.setState('idle')
    this.attempts.value = 0
    this.nextRetryMs.value = 0
  }

  /**
   * Mark as successfully connected
   */
  markConnected(): void {
    this.clearTimers()
    this.setState('connected')
    this.attempts.value = 0
    this.nextRetryMs.value = 0
    this.onSuccess?.()
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.attempts.value >= this.config.maxAttempts) {
      this.setState('failed')
      this.onFailure?.(new Error('Max reconnection attempts exceeded'))
      return
    }

    const delay = this.calculateDelay()
    this.nextRetryMs.value = delay

    // Start countdown
    this.startCountdown(delay)

    this.retryTimeout = setTimeout(() => {
      this.attemptReconnect()
    }, delay)
  }

  /**
   * Attempt to reconnect
   */
  private async attemptReconnect(): Promise<void> {
    this.attempts.value++
    this.nextRetryMs.value = 0

    console.log(`[Reconnection] Attempt ${this.attempts.value}/${this.config.maxAttempts}`)

    try {
      await this.onReconnect?.()
      this.markConnected()
    } catch (error) {
      console.error('[Reconnection] Attempt failed:', error)

      if (this.attempts.value < this.config.maxAttempts) {
        this.scheduleReconnect()
      } else {
        this.setState('failed')
        this.onFailure?.(error instanceof Error ? error : new Error(String(error)))
      }
    }
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(): number {
    const baseDelay = this.config.initialDelayMs *
      Math.pow(this.config.backoffMultiplier, this.attempts.value)

    const cappedDelay = Math.min(baseDelay, this.config.maxDelayMs)

    // Add jitter
    const jitter = cappedDelay * this.config.jitterFactor * Math.random()

    return Math.floor(cappedDelay + jitter)
  }

  /**
   * Start countdown timer
   */
  private startCountdown(totalMs: number): void {
    this.clearCountdown()

    const startTime = Date.now()

    this.countdownInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, totalMs - elapsed)
      this.nextRetryMs.value = remaining

      if (remaining <= 0) {
        this.clearCountdown()
      }
    }, 100)
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    this.clearRetryTimeout()
    this.clearCountdown()
  }

  private clearRetryTimeout(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
      this.retryTimeout = null
    }
  }

  private clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval)
      this.countdownInterval = null
    }
  }

  /**
   * Set state and notify
   */
  private setState(newState: ReconnectionState): void {
    this.state.value = newState
    this.onStateChange?.(newState)
  }

  /**
   * Get current state (reactive)
   */
  getState() {
    return {
      state: readonly(this.state),
      attempts: readonly(this.attempts),
      nextRetryMs: readonly(this.nextRetryMs),
      maxAttempts: this.config.maxAttempts
    }
  }
}

// Singleton instance
let reconnectionManagerInstance: ReconnectionManager | null = null

export const useReconnectionManager = () => {
  if (!reconnectionManagerInstance) {
    reconnectionManagerInstance = new ReconnectionManager()
  }
  return reconnectionManagerInstance
}
