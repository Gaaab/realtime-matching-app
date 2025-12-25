import type { PendingMessage, SendMessageData, QueuedMessage } from '~/types/chat'

/**
 * Generate a simple UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2
}

/**
 * Message Queue Service for offline message support with retry logic
 */
export class MessageQueueService {
  private queue: Map<string, QueuedMessage> = new Map()
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map()
  private isProcessing = false
  private retryConfig: RetryConfig
  private onSendMessage: ((channelId: number, data: SendMessageData) => Promise<unknown>) | null = null
  private onMessageSent: ((clientId: string, serverMessage: unknown) => void) | null = null
  private onMessageFailed: ((clientId: string, error: Error) => void) | null = null

  constructor(config: Partial<RetryConfig> = {}) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
    this.loadFromStorage()
  }

  /**
   * Set the send message handler (usually the API call)
   */
  setSendHandler(handler: (channelId: number, data: SendMessageData) => Promise<unknown>) {
    this.onSendMessage = handler
  }

  /**
   * Set success callback
   */
  setOnMessageSent(callback: (clientId: string, serverMessage: unknown) => void) {
    this.onMessageSent = callback
  }

  /**
   * Set failure callback
   */
  setOnMessageFailed(callback: (clientId: string, error: Error) => void) {
    this.onMessageFailed = callback
  }

  /**
   * Add message to queue
   */
  enqueue(
    channelId: number,
    data: SendMessageData,
    options?: { priority?: number; expiresInMs?: number }
  ): string {
    const clientId = generateUUID()
    const now = new Date().toISOString()

    const queuedMessage: QueuedMessage = {
      clientId,
      channelId,
      content: data.content,
      messageType: data.message_type || 'text',
      mediaUrl: data.media_url,
      createdAt: now,
      status: 'pending',
      retryCount: 0,
      priority: options?.priority || 0,
      expiresAt: options?.expiresInMs
        ? new Date(Date.now() + options.expiresInMs).toISOString()
        : null
    }

    this.queue.set(clientId, queuedMessage)
    this.persistToStorage()
    this.processQueue()

    return clientId
  }

  /**
   * Remove message from queue
   */
  dequeue(clientId: string): boolean {
    const timeout = this.retryTimeouts.get(clientId)
    if (timeout) {
      clearTimeout(timeout)
      this.retryTimeouts.delete(clientId)
    }

    const removed = this.queue.delete(clientId)
    if (removed) {
      this.persistToStorage()
    }
    return removed
  }

  /**
   * Get all queued messages for a channel
   */
  getQueuedMessages(channelId?: number): QueuedMessage[] {
    const messages = Array.from(this.queue.values())

    if (channelId !== undefined) {
      return messages.filter(msg => msg.channelId === channelId)
    }

    return messages.sort((a, b) => {
      // Sort by priority (higher first), then by creation time (older first)
      if (a.priority !== b.priority) {
        return b.priority - a.priority
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  }

  /**
   * Process the queue - attempt to send pending messages
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || !this.onSendMessage) {
      return
    }

    this.isProcessing = true

    try {
      const pendingMessages = this.getQueuedMessages().filter(
        msg => msg.status === 'pending' || msg.status === 'failed'
      )

      for (const message of pendingMessages) {
        // Check if expired
        if (message.expiresAt && new Date(message.expiresAt) < new Date()) {
          this.handleExpired(message.clientId)
          continue
        }

        // Check retry limit
        if (message.retryCount >= this.retryConfig.maxRetries) {
          this.handleMaxRetriesReached(message.clientId)
          continue
        }

        await this.attemptSend(message)
      }
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Attempt to send a single message
   */
  private async attemptSend(message: QueuedMessage): Promise<void> {
    if (!this.onSendMessage) return

    // Update status
    this.updateMessage(message.clientId, {
      status: 'sending',
      lastAttemptAt: new Date().toISOString()
    })

    try {
      const data: SendMessageData = {
        content: message.content,
        message_type: message.messageType,
        media_url: message.mediaUrl
      }

      const result = await this.onSendMessage(message.channelId, data)

      // Success - remove from queue
      this.dequeue(message.clientId)
      this.onMessageSent?.(message.clientId, result)

    } catch (error: any) {
      console.error(`[MessageQueue] Failed to send message ${message.clientId}:`, error)

      const newRetryCount = message.retryCount + 1

      if (newRetryCount >= this.retryConfig.maxRetries) {
        this.handleMaxRetriesReached(message.clientId)
      } else {
        // Schedule retry with exponential backoff
        this.updateMessage(message.clientId, {
          status: 'failed',
          retryCount: newRetryCount
        })

        this.scheduleRetry(message.clientId, newRetryCount)
      }
    }
  }

  /**
   * Schedule a retry with exponential backoff
   */
  private scheduleRetry(clientId: string, retryCount: number): void {
    const delay = Math.min(
      this.retryConfig.initialDelayMs * Math.pow(this.retryConfig.backoffMultiplier, retryCount - 1),
      this.retryConfig.maxDelayMs
    )

    // Add jitter (0-25% of delay)
    const jitter = Math.random() * 0.25 * delay
    const finalDelay = delay + jitter

    console.log(`[MessageQueue] Scheduling retry for ${clientId} in ${finalDelay}ms (attempt ${retryCount})`)

    const timeout = setTimeout(() => {
      this.retryTimeouts.delete(clientId)
      const message = this.queue.get(clientId)
      if (message) {
        this.attemptSend(message)
      }
    }, finalDelay)

    this.retryTimeouts.set(clientId, timeout)
  }

  /**
   * Handle expired message
   */
  private handleExpired(clientId: string): void {
    console.warn(`[MessageQueue] Message ${clientId} expired`)
    this.dequeue(clientId)
    this.onMessageFailed?.(clientId, new Error('Message expired'))
  }

  /**
   * Handle max retries reached
   */
  private handleMaxRetriesReached(clientId: string): void {
    console.error(`[MessageQueue] Max retries reached for message ${clientId}`)

    this.updateMessage(clientId, {
      status: 'failed'
    })

    this.onMessageFailed?.(clientId, new Error('Max retries exceeded'))
  }

  /**
   * Update a queued message
   */
  private updateMessage(clientId: string, updates: Partial<QueuedMessage>): void {
    const message = this.queue.get(clientId)
    if (message) {
      this.queue.set(clientId, { ...message, ...updates })
      this.persistToStorage()
    }
  }

  /**
   * Persist queue to localStorage
   */
  private persistToStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const data = Array.from(this.queue.entries())
      localStorage.setItem('chat_message_queue', JSON.stringify(data))
    } catch (error) {
      console.error('[MessageQueue] Failed to persist to storage:', error)
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const data = localStorage.getItem('chat_message_queue')
      if (data) {
        const entries: [string, QueuedMessage][] = JSON.parse(data)
        this.queue = new Map(entries)

        // Reset all 'sending' messages to 'pending' on load
        this.queue.forEach((msg, key) => {
          if (msg.status === 'sending') {
            this.queue.set(key, { ...msg, status: 'pending' })
          }
        })
      }
    } catch (error) {
      console.error('[MessageQueue] Failed to load from storage:', error)
    }
  }

  /**
   * Flush all messages for a channel (retry immediately)
   */
  async flushChannel(channelId: number): Promise<void> {
    const messages = this.getQueuedMessages(channelId)

    for (const message of messages) {
      // Clear any pending retry
      const timeout = this.retryTimeouts.get(message.clientId)
      if (timeout) {
        clearTimeout(timeout)
        this.retryTimeouts.delete(message.clientId)
      }

      // Reset to pending and attempt send
      this.updateMessage(message.clientId, { status: 'pending' })
    }

    await this.processQueue()
  }

  /**
   * Clear all queued messages
   */
  clearAll(): void {
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout))
    this.retryTimeouts.clear()
    this.queue.clear()
    this.persistToStorage()
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    total: number
    pending: number
    failed: number
    sending: number
  } {
    const messages = Array.from(this.queue.values())
    return {
      total: messages.length,
      pending: messages.filter(m => m.status === 'pending').length,
      failed: messages.filter(m => m.status === 'failed').length,
      sending: messages.filter(m => m.status === 'sending').length
    }
  }
}

// Singleton instance
let messageQueueInstance: MessageQueueService | null = null

export const useMessageQueue = () => {
  if (!messageQueueInstance) {
    messageQueueInstance = new MessageQueueService()
  }
  return messageQueueInstance
}
