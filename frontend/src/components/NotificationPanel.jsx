import { Link, useNavigate } from 'react-router-dom'
import { useNotifications } from '../hooks/useNotifications'

const getNotificationIcon = (type) => {
  switch (type) {
    case 'ORDER_PLACED':
      return (
        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-md">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      )
    case 'ORDER_CONFIRMED':
      return (
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )
    case 'ORDER_READY':
      return (
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )
    case 'ORDER_DELIVERING':
      return (
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )
    case 'ORDER_COMPLETED':
      return (
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )
    case 'ORDER_CANCELLED':
      return (
        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center shadow-md">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )
    default:
      return (
        <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center shadow-md">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
      )
  }
}

const formatTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)

  if (diffInSeconds < 60) {
    return 'Vừa xong'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} phút trước`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} giờ trước`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} ngày trước`
  } else {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }
}

// Component cho banner lớn (giống Shopee)
const OrderBanner = ({ notification, onClick }) => {
  const { type, title, message, order_id } = notification

  if (type === 'ORDER_PLACED') {
    return (
      <div
        onClick={onClick}
        className="mx-4 my-3 bg-gradient-to-r from-red-500 via-red-600 to-orange-500 rounded-xl shadow-lg overflow-hidden cursor-pointer transform hover:scale-[1.02] transition-transform"
      >
        <div className="p-5 text-white relative">
          {/* Decorative elements */}
          <div className="absolute top-2 right-2 opacity-20">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-2">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-white/90 text-sm font-medium">McDono</span>
            </div>

            <h3 className="text-xl font-bold mb-1 drop-shadow-md">{title}</h3>
            <p className="text-white/90 text-sm leading-relaxed">{message}</p>

            {order_id && (
              <div className="mt-3 flex items-center space-x-2">
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">
                  Đơn hàng #{order_id}
                </span>
                <span className="text-white/80 text-xs">Theo dõi đơn hàng →</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}

// Component cho notification thông thường
const NotificationItem = ({ notification, onClick }) => {
  const { type, title, message, is_read, created_at, order_id } = notification

  return (
    <div
      onClick={onClick}
      className={`px-4 py-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 ${!is_read ? 'bg-blue-50/30' : 'bg-white'
        }`}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        {getNotificationIcon(type)}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <p className={`text-sm font-bold ${!is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                  {title}
                </p>
                {!is_read && (
                  <span className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0"></span>
                )}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                {message}
              </p>
              <div className="flex items-center space-x-3 mt-2">
                <span className="text-xs text-gray-400">
                  {formatTime(created_at)}
                </span>
                {order_id && (
                  <Link
                    to={`/orders/${order_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Xem đơn hàng →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NotificationPanel({ onClose }) {
  const navigate = useNavigate()
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications()

  // No need to fetch on mount - context already maintains the notification list

  const handleNotificationClick = (notification) => {
    // Navigate immediately for better responsiveness
    if (notification.order_id) {
      onClose()
      navigate(`/orders/${notification.order_id}`)
    }

    // Defer markAsRead to avoid blocking navigation with state update
    if (!notification.is_read) {
      setTimeout(() => {
        markAsRead(notification)
      }, 0)
    }
  }

  // Tách notifications thành banner và items
  const bannerNotifications = notifications.filter(n => n.type === 'ORDER_PLACED' && !n.is_read)
  const regularNotifications = notifications.filter(n => n.type !== 'ORDER_PLACED' || n.is_read)

  return (
    <div className="w-[420px] bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[650px] flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white sticky top-0 z-10 rounded-t-lg">
        <h3 className="text-lg font-bold text-gray-900">Thông Báo Mới Nhận</h3>
        <div className="flex items-center space-x-3">
          {notifications.some(n => !n.is_read) && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors"
            >
              Đánh dấu đã đọc tất cả
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
            aria-label="Đóng"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-gray-500 text-base font-medium">Không có thông báo nào</p>
            <p className="text-gray-400 text-sm mt-1">Các thông báo về đơn hàng sẽ hiển thị ở đây</p>
          </div>
        ) : (
          <div>
            {/* Banner notifications (ORDER_PLACED) */}
            {bannerNotifications.map((notification) => (
              <OrderBanner
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
              />
            ))}

            {/* Regular notifications */}
            {regularNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <Link
            to="/orders"
            onClick={onClose}
            className="block text-center text-sm text-red-600 hover:text-red-700 font-semibold"
          >
            Xem tất cả
          </Link>
        </div>
      )}
    </div>
  )
}
