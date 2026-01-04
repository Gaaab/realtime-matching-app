export interface ReportCategory {
  id: number
  name: string
  label?: string
  created_at: string
  updated_at: string
}

export interface ReportSubmission {
  reason_id: number
  description?: string
  media_ids?: number[]
}
