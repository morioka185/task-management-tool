import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Database } from '../types/database'
import { useAuth } from '../contexts/AuthContext'

type Notification = Database['public']['Tables']['notifications']['Row']
type NotificationInsert = Database['public']['Tables']['notifications']['Insert']

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchNotifications = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const createNotification = async (notification: NotificationInsert) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      throw error instanceof Error ? error : new Error('エラーが発生しました')
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)

      if (error) throw error
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      )
    } catch (error) {
      throw error instanceof Error ? error : new Error('エラーが発生しました')
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) throw error
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      )
    } catch (error) {
      throw error instanceof Error ? error : new Error('エラーが発生しました')
    }
  }

  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length
  }

  useEffect(() => {
    fetchNotifications()

    if (user) {
      const subscription = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications(prev => [payload.new as Notification, ...prev])
            
            if (Notification.permission === 'granted') {
              new Notification(payload.new.title, {
                body: payload.new.message || undefined,
                icon: '/favicon.ico',
              })
            }
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [user])

  return {
    notifications,
    loading,
    error,
    createNotification,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    refetch: fetchNotifications,
  }
}