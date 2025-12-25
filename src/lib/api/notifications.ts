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
export async function getUserNotifications(): Promise<NotificationWithStatus[]> {
  try {
    const { data: userNotifications, error } = await supabase
      .from('user_notifications')
      .select(`
        id,
        is_read,
        read_at,
        notification:notifications(*)
      `)
      .order('created_at', { ascending: false }) as any

    if (error) {
      console.error('Error fetching user notifications:', error)
      return []
    }

    // Transform the data to match our interface
    const notifications: NotificationWithStatus[] = (userNotifications || [])
      .filter((un: any) => un.notification) // Only include notifications that exist
      .map((un: any) => ({
        ...(un.notification as Notification),
        is_read: un.is_read,
        read_at: un.read_at,
        user_notification_id: un.id
      }))

    // Deduplicate notifications by notification ID (keep the first occurrence)
    const uniqueNotifications = notifications.reduce((acc: NotificationWithStatus[], current) => {
      const existingIndex = acc.findIndex(item => item.id === current.id)
      if (existingIndex === -1) {
        acc.push(current)
      } else {
        // If duplicate found, keep the one that's unread (if any) to preserve user_notification_id
        if (!current.is_read && acc[existingIndex].is_read) {
          acc[existingIndex] = current
        }
      }
      return acc
    }, [])

    return uniqueNotifications
  } catch (error) {
    console.error('Error fetching user notifications:', error)
    return []
  }
}

// User functions - Mark notification as read
export async function markNotificationAsRead(userNotificationId: string): Promise<boolean> {
  try {
    const updateData: Record<string, any> = {
      is_read: true,
      read_at: new Date().toISOString()
    }

    const { error } = await (supabase
      .from('user_notifications')
      .update(updateData) as any)
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
    const updateData: Record<string, any> = {
      is_read: true,
      read_at: new Date().toISOString()
    }

    const { error } = await (supabase
      .from('user_notifications')
      .update(updateData) as any)
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
