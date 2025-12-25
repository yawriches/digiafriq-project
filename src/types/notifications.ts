export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'announcement'
export type NotificationAudience = 'all' | 'learners' | 'affiliates' | 'admins'
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  target_audience: NotificationAudience
  priority: NotificationPriority
  is_active: boolean
  expires_at?: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface UserNotification {
  id: string
  notification_id: string
  user_id: string
  is_read: boolean
  read_at?: string | null
  created_at: string
  notification?: Notification
}

export interface NotificationWithStatus extends Notification {
  is_read?: boolean
  read_at?: string | null
  user_notification_id?: string
}

export interface CreateNotificationData {
  title: string
  message: string
  type: NotificationType
  target_audience: NotificationAudience
  priority: NotificationPriority
  expires_at?: string | null
}

export interface UpdateNotificationData extends Partial<CreateNotificationData> {
  is_active?: boolean
}

export interface NotificationStats {
  total: number
  unread: number
  byType: Record<NotificationType, number>
  byPriority: Record<NotificationPriority, number>
}
