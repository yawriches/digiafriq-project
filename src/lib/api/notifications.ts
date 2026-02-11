import { supabase } from '@/lib/supabase/client'
import type { 
  Notification, 
  UserNotification, 
  NotificationWithStatus,
  CreateNotificationData, 
  UpdateNotificationData,
  NotificationStats 
} from '@/types/notifications'

// Admin functions - Create notifications
export async function createNotification(data: CreateNotificationData): Promise<Notification | null> {
  try {
    // Get the current user first
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Error getting current user:', userError)
      return null
    }

    console.log('Creating notification with user ID:', user.id)
    console.log('Notification data:', data)

    // Prepare the insert data
    const insertData: any = {
      title: data.title,
      message: data.message,
      type: data.type,
      target_audience: data.target_audience,
      priority: data.priority,
      created_by: user.id
    }

    // Only add expires_at if it's provided
    if (data.expires_at) {
      insertData.expires_at = data.expires_at
    }

    console.log('Insert data:', insertData)

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return null
    }

    console.log('Notification created successfully:', notification)
    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

// Admin functions - Get all notifications
export async function getAdminNotifications(): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching admin notifications:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching admin notifications:', error)
    return []
  }
}

// Admin functions - Update notification
export async function updateNotification(id: string, data: UpdateNotificationData): Promise<boolean> {
  try {
    const updateData: Record<string, any> = {}
    
    if (data.title !== undefined) updateData.title = data.title
    if (data.message !== undefined) updateData.message = data.message
    if (data.type !== undefined) updateData.type = data.type
    if (data.target_audience !== undefined) updateData.target_audience = data.target_audience
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.expires_at !== undefined) updateData.expires_at = data.expires_at
    if (data.is_active !== undefined) updateData.is_active = data.is_active

    const { error } = await (supabase
      .from('notifications')
      .update(updateData) as any)
      .eq('id', id)

    if (error) {
      console.error('Error updating notification:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating notification:', error)
    return false
  }
}

// Admin functions - Delete notification
export async function deleteNotification(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting notification:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting notification:', error)
    return false
  }
}

// User functions - Get notifications for current user
// Lazily creates user_notification rows for any active notifications the user hasn't seen yet
export async function getUserNotifications(): Promise<NotificationWithStatus[]> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return []

    // Get the user's role to filter by target_audience
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, active_role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.active_role || profile?.role || 'learner'

    // Fetch all active notifications relevant to this user
    const { data: allNotifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (notifError) {
      console.error('Error fetching notifications:', notifError)
      return []
    }

    // Filter by target_audience
    const relevantNotifications = (allNotifications || []).filter((n: any) => {
      if (n.target_audience === 'all') return true
      if (n.target_audience === 'learners' && userRole === 'learner') return true
      if (n.target_audience === 'affiliates' && userRole === 'affiliate') return true
      if (n.target_audience === 'admins' && userRole === 'admin') return true
      return false
    }).filter((n: any) => {
      // Filter out expired notifications
      if (n.expires_at && new Date(n.expires_at) < new Date()) return false
      return true
    })

    if (relevantNotifications.length === 0) return []

    // Fetch existing user_notification rows for this user
    const { data: existingRows, error: existingError } = await supabase
      .from('user_notifications')
      .select('id, notification_id, is_read, read_at')
      .eq('user_id', user.id)

    if (existingError) {
      console.error('Error fetching user_notifications:', existingError)
    }

    const existingMap = new Map(
      (existingRows || []).map((r: any) => [r.notification_id, r])
    )

    // Lazily create user_notification rows for notifications the user hasn't seen
    const missingNotificationIds = relevantNotifications
      .filter((n: any) => !existingMap.has(n.id))
      .map((n: any) => n.id)

    if (missingNotificationIds.length > 0) {
      const newRows = missingNotificationIds.map((notifId: string) => ({
        notification_id: notifId,
        user_id: user.id,
        is_read: false,
      }))

      const { data: insertedRows, error: insertError } = await supabase
        .from('user_notifications')
        .upsert(newRows, { onConflict: 'notification_id,user_id' })
        .select('id, notification_id, is_read, read_at')

      if (insertError) {
        console.error('Error creating user_notification rows:', insertError)
      } else if (insertedRows) {
        insertedRows.forEach((r: any) => existingMap.set(r.notification_id, r))
      }
    }

    // Build the final list
    const result: NotificationWithStatus[] = relevantNotifications.map((n: any) => {
      const userRow = existingMap.get(n.id)
      return {
        ...n,
        is_read: userRow?.is_read ?? false,
        read_at: userRow?.read_at ?? null,
        user_notification_id: userRow?.id ?? null,
      }
    })

    return result
  } catch (error) {
    console.error('Error fetching user notifications:', error)
    return []
  }
}

// User functions - Mark notification as read
export async function markNotificationAsRead(userNotificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', userNotificationId)

    if (error) {
      console.error('Error marking notification as read:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return false
  }
}

// User functions - Mark all notifications as read
export async function markAllNotificationsAsRead(): Promise<boolean> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return false

    const { error } = await supabase
      .from('user_notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) {
      console.error('Error marking all notifications as read:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return false
  }
}

// User functions - Get notification statistics
export async function getNotificationStats(): Promise<NotificationStats> {
  try {
    const notifications = await getUserNotifications()
    
    const stats: NotificationStats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.is_read).length,
      byType: {
        info: notifications.filter(n => n.type === 'info').length,
        success: notifications.filter(n => n.type === 'success').length,
        warning: notifications.filter(n => n.type === 'warning').length,
        error: notifications.filter(n => n.type === 'error').length,
        announcement: notifications.filter(n => n.type === 'announcement').length
      },
      byPriority: {
        low: notifications.filter(n => n.priority === 'low').length,
        normal: notifications.filter(n => n.priority === 'normal').length,
        high: notifications.filter(n => n.priority === 'high').length,
        urgent: notifications.filter(n => n.priority === 'urgent').length
      }
    }

    return stats
  } catch (error) {
    console.error('Error getting notification stats:', error)
    return {
      total: 0,
      unread: 0,
      byType: { info: 0, success: 0, warning: 0, error: 0, announcement: 0 },
      byPriority: { low: 0, normal: 0, high: 0, urgent: 0 }
    }
  }
}
