/**
 * Icebreaker Types
 *
 * Types for icebreaker conversation starters that help users
 * initiate conversations with their matches.
 */

/**
 * Icebreaker category slugs
 * These are fixed and stable for caching/referencing
 */
export type IcebreakerCategorySlug =
  | 'outdoors'
  | 'food-drink'
  | 'entertainment'
  | 'social-lifestyle'
  | 'travel'
  | 'creative'
  | 'general'

/**
 * Icebreaker category IDs (fixed and stable)
 * | Category ID | Slug             | Name              | Icebreaker ID Range |
 * |-------------|------------------|-------------------|---------------------|
 * | 1           | outdoors         | Outdoors          | 1-50                |
 * | 2           | food-drink       | Food & Drink      | 51-100              |
 * | 3           | entertainment    | Entertainment     | 101-150             |
 * | 4           | social-lifestyle | Social & Lifestyle| 151-200             |
 * | 5           | travel           | Travel            | 201-250             |
 * | 6           | creative         | Creative          | 251-300             |
 * | 7           | general          | General           | 301-350             |
 */
export enum IcebreakerCategoryId {
  OUTDOORS = 1,
  FOOD_DRINK = 2,
  ENTERTAINMENT = 3,
  SOCIAL_LIFESTYLE = 4,
  TRAVEL = 5,
  CREATIVE = 6,
  GENERAL = 7
}

/**
 * Icebreaker prompt object
 * Represents a single icebreaker conversation starter
 */
export interface Icebreaker {
  /** Unique icebreaker ID (fixed and stable) */
  id: number
  /** Category name for display grouping */
  category: string
  /** Category ID for filtering/grouping */
  category_id: number
  /** The icebreaker question/prompt text */
  prompt_text: string
  /** How many times this icebreaker has been used globally */
  usage_count: number
  /** URL to the category icon (may be null) */
  icon_url: string | null
}

/**
 * Icebreaker grouped by category for UI display
 */
export interface IcebreakersByCategory {
  /** Category ID */
  category_id: number
  /** Category name */
  category: string
  /** Category icon URL */
  icon_url: string | null
  /** Icebreakers in this category */
  icebreakers: Icebreaker[]
}

/**
 * Response data from sending an icebreaker
 * Returns the created message object
 */
export interface IcebreakerMessageData {
  /** Message type identifier */
  type: 'icebreaker'
  /** The icebreaker prompt text that was sent */
  content: string
}

/**
 * Message created from sending an icebreaker
 * Matches the API response structure
 */
export interface IcebreakerMessage {
  /** Message ID */
  id: number
  /** Sender type (e.g., "user") */
  sender_type: string
  /** ID of the user who sent the message */
  sender_id: number
  /** Message data with type and content */
  data: IcebreakerMessageData
  /** When the message was created */
  created_at: string
  /** When the message was last updated */
  updated_at: string
  /** When the message was deleted (if soft deleted) */
  deleted_at: string | null
  /** Whether the message has been read */
  is_read: boolean
  /** Any attached media */
  attachments: Array<{
    id: number
    type: string
    url: string
    thumbnail_url?: string
  }>
  /** Link preview data if applicable */
  link_preview: {
    url: string
    title: string | null
    description: string | null
    image: string | null
    site_name: string | null
  } | null
}

/**
 * API error codes specific to icebreaker operations
 */
export type IcebreakerErrorCode =
  | 'NOT_PART_OF_MATCH'
  | 'MATCH_INACTIVE'
  | 'ICEBREAKER_INACTIVE'

/**
 * Icebreaker API error response
 */
export interface IcebreakerError {
  message: string
  error_code?: IcebreakerErrorCode
}

/**
 * State interface for icebreaker store/composable
 */
export interface IcebreakersState {
  /** All available icebreakers */
  icebreakers: Icebreaker[]
  /** Icebreakers for current match (personalized suggestions) */
  matchIcebreakers: Icebreaker[]
  /** Current match ID for which icebreakers were fetched */
  currentMatchId: number | null
  /** Loading state */
  loading: boolean
  /** Error message */
  error: string | null
  /** Last time icebreakers were fetched (for cache invalidation) */
  lastFetchedAt: string | null
}
