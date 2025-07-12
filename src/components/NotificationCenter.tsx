import { useState, useEffect } from 'react'
import { useNotifications } from '../hooks/useNotifications'

export default function NotificationCenter() {
  const { notifications, getUnreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const [permissionRequested, setPermissionRequested] = useState(false)

  const unreadCount = getUnreadCount()

  useEffect(() => {
    if (!permissionRequested && 'Notification' in window) {
      setPermissionRequested(true)
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [permissionRequested])

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
  }

  const recentNotifications = notifications.slice(0, 10)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-5-5.5V6a6 6 0 1 0-12 0v5.5L0 17h5m5 0v1a3 3 0 0 1-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">通知</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  すべて既読
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                通知はありません
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                        !notification.read ? 'bg-blue-500' : 'bg-gray-300'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${
                          !notification.read ? 'font-medium text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </p>
                        {notification.message && (
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.created_at).toLocaleString('ja-JP')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 10 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button className="text-sm text-blue-600 hover:text-blue-800">
                すべての通知を表示
              </button>
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}