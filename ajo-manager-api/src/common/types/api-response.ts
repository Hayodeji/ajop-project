export interface ApiResponse<T> {
  data: T
  meta?: Record<string, unknown>
  error?: null
}

export interface ApiError {
  data?: null
  error: {
    message: string
    code?: string
    details?: unknown
  }
}
