export interface AppNotification {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, any>
  read_at: string | null
  created_at: string
}
