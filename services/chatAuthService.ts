export interface ChatAuthToken {
  token: string
  expiresAt: number
  refreshToken?: string
}

export interface ChatAuthConfig {
  tokenRefreshThresholdMs: number
  maxRefreshAttempts: number
}

const DEFAULT_CONFIG: ChatAuthConfig = {
  tokenRefreshThresholdMs: 5 * 60 * 1000, // 5 minutes before expiry
  maxRefreshAttempts: 3
}

/**
 * Chat Authentication Service
 * Handles token management and refresh for chat operations
 */
export class ChatAuthService {
  private config: ChatAuthConfig
  private refreshPromise: Promise<ChatAuthToken> | null = null
  private refreshAttempts = 0

  constructor(config: Partial<ChatAuthConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Get current auth token, refreshing if needed
   */
  async getValidToken(api: any): Promise<string | null> {
    const currentToken = api.getAuthToken()

    if (!currentToken) {
      return null
    }

    // Check if token needs refresh
    const tokenData = this.parseJwtPayload(currentToken)
    if (tokenData && this.shouldRefreshToken(tokenData.exp * 1000)) {
      try {
        const newToken = await this.refreshToken(api)
        return newToken.token
      } catch (error) {
        console.error('[ChatAuth] Token refresh failed:', error)
        // If refresh fails, try with current token
        return currentToken
      }
    }

    return currentToken
  }

  /**
   * Check if token should be refreshed
   */
  private shouldRefreshToken(expiresAt: number): boolean {
    return Date.now() + this.config.tokenRefreshThresholdMs >= expiresAt
  }

  /**
   * Refresh the auth token
   */
  private async refreshToken(api: any): Promise<ChatAuthToken> {
    // Prevent concurrent refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    if (this.refreshAttempts >= this.config.maxRefreshAttempts) {
      throw new Error('Max refresh attempts exceeded')
    }

    this.refreshAttempts++

    this.refreshPromise = this.performRefresh(api)

    try {
      const result = await this.refreshPromise
      this.refreshAttempts = 0
      return result
    } finally {
      this.refreshPromise = null
    }
  }

  private async performRefresh(api: any): Promise<ChatAuthToken> {
    const response = await api.post<{ token: string; expires_at: string }>('/auth/refresh')

    if (!response.success || !response.data) {
      throw new Error('Token refresh failed')
    }

    const newToken = response.data.token
    api.setAuthToken(newToken)

    return {
      token: newToken,
      expiresAt: new Date(response.data.expires_at).getTime()
    }
  }

  /**
   * Parse JWT payload without verification (client-side only)
   */
  private parseJwtPayload(token: string): { exp: number; sub: string } | null {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return null

      const payload = JSON.parse(atob(parts[1]))
      return payload
    } catch {
      return null
    }
  }

  /**
   * Get Ably token for real-time connection
   */
  async getAblyToken(api: any): Promise<unknown> {
    // Ensure we have a valid main token first
    await this.getValidToken(api)

    const response = await api.post('/chat/auth', { formatted: true })

    if (!response.success || !response.data) {
      throw new Error('Failed to get Ably token')
    }

    return response.data
  }
}

// Singleton
let chatAuthInstance: ChatAuthService | null = null

export const useChatAuth = () => {
  if (!chatAuthInstance) {
    chatAuthInstance = new ChatAuthService()
  }
  return chatAuthInstance
}
