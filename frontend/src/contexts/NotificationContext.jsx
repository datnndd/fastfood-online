import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../lib/authContext'
import { NotificationAPI } from '../lib/api'
import { NotificationContext } from './notificationContext'

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async (params = {}) => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    setLoading(true)
    try {
      const response = await NotificationAPI.list({
        ...params,
        limit: params.limit || 20
      })
      // Handle both paginated and non-paginated responses
      const notificationsData = response.data.results || response.data || []
      setNotifications(notificationsData)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0)
      return
    }

    try {
      const response = await NotificationAPI.unreadCount()
      setUnreadCount(response.data.count || 0)
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }, [user])

  const markAsRead = useCallback(async (notifOrId) => {
    // Support local notifications (id like 'local-...') or objects with _local flag
    const isObject = typeof notifOrId === 'object' && notifOrId !== null
    const id = isObject ? notifOrId.id : notifOrId
    const isLocal = (isObject && notifOrId._local) || (typeof id === 'string' && id.startsWith('local-'))

    if (isLocal) {
      // Mark only in client state
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)))
      setUnreadCount(prev => Math.max(0, prev - 1))
      return
    }

    try {
      await NotificationAPI.markRead(id)
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await NotificationAPI.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }, [])

  // Add local notification immediately (client-side fallback)
  const pushLocalNotification = useCallback((notification) => {
    // Shape: { id?: number, type, title, message, order_id?, created_at? }
    const local = {
      id: notification.id ?? `local-${Date.now()}`,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      order_id: notification.order_id ?? null,
      is_read: false,
      created_at: notification.created_at ?? new Date().toISOString(),
      // mark as local for UI (optional)
      _local: true,
    }
    setNotifications(prev => [local, ...prev])
    setUnreadCount(prev => prev + 1)
  }, [])

  // Fetch notifications and unread count when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications()
      fetchUnreadCount()
    } else {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [user, fetchNotifications, fetchUnreadCount])

  // Auto refresh every 30 seconds
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      fetchNotifications()
      fetchUnreadCount()
    }, 30000)

    return () => clearInterval(interval)
  }, [user, fetchNotifications, fetchUnreadCount])

  // Listen for order placed event
  useEffect(() => {
    if (!user) return

    const handleOrderPlaced = () => {
      // Refresh notifications when order is placed
      fetchNotifications({ limit: 20 })
      fetchUnreadCount()
    }

    window.addEventListener('orderPlaced', handleOrderPlaced)
    return () => {
      window.removeEventListener('orderPlaced', handleOrderPlaced)
    }
  }, [user, fetchNotifications, fetchUnreadCount])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        pushLocalNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

