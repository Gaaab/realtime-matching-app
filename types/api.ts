export interface ApiResponse<T = any> {
  success: boolean
  http_status: number
  data: T
  message: string
}

export interface ApiError {
  success: false
  http_status: number
  message: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

export interface ValidationError {
  field: string
  messages: string[]
}
