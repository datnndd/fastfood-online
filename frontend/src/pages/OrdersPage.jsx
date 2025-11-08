import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { OrderAPI } from '../lib/api'
import Protected from '../components/Protected'

const canCancelOrder = (order) => {
  if (order.payment_method === 'card' && order.payment_completed_at) {
    const paymentTime = new Date(order.payment_completed_at)
    const diffInSeconds = (Date.now() - paymentTime.getTime()) / 1000
    return diffInSeconds <= 60
  }
  const createdAt = new Date(order.created_at)
  const diffInSeconds = (Date.now() - createdAt.getTime()) / 1000
  return diffInSeconds <= 60
}

const getTimeRemaining = (order) => {
  const referenceTime = order.payment_method === 'card' && order.payment_completed_at
    ? new Date(order.payment_completed_at)
    : new Date(order.created_at)
  const diffInSeconds = (Date.now() - referenceTime.getTime()) / 1000
  const remaining = Math.max(0, 60 - diffInSeconds)
  return Math.ceil(remaining)
}

const STATUSES = ['PREPARING', 'READY', 'DELIVERING', 'COMPLETED', 'CANCELLED']

const statusLabels = {
  PREPARING: 'Chờ xác nhận',
  READY: 'Chờ lấy hàng',
  DELIVERING: 'Chờ giao hàng',
  COMPLETED: 'Đã giao',
  CANCELLED: 'Đã hủy',
}

const statusColors = {
  PREPARING: 'text-yellow-700 bg-yellow-100 border-yellow-200',
  READY: 'text-blue-700 bg-blue-100 border-blue-200',
  DELIVERING: 'text-purple-700 bg-purple-100 border-purple-200',
  COMPLETED: 'text-green-700 bg-green-100 border-green-200',
  CANCELLED: 'text-red-700 bg-red-100 border-red-200',
}

const tabColors = {
  PREPARING: 'border-yellow-500 text-yellow-700',
  READY: 'border-blue-500 text-blue-700',
  DELIVERING: 'border-purple-500 text-purple-700',
  COMPLETED: 'border-green-500 text-green-700',
  CANCELLED: 'border-red-500 text-red-700',
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('PREPARING')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState({})
  const [timeRemaining, setTimeRemaining] = useState({})

  const loadOrders = useCallback(async (status = activeTab) => {
    setLoading(true)
    try {
      const response = await OrderAPI.my.list(1, status)
      const ordersData = response.data.results || []
      setOrders(ordersData)

      if (status === 'PREPARING') {
        const remainingMap = {}
        ordersData.forEach((order) => {
          remainingMap[order.id] = getTimeRemaining(order)
        })
        setTimeRemaining(remainingMap)
      } else {
        setTimeRemaining({})
      }
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
      return
    }

    setCancelling((prev) => ({ ...prev, [orderId]: true }))
    try {
      await OrderAPI.my.cancel(orderId)
      await loadOrders(activeTab)
      alert('Đơn hàng đã được hủy thành công!')
    } catch (error) {
      console.error('Failed to cancel order:', error)
      alert('Có lỗi xảy ra khi hủy đơn hàng. Vui lòng thử lại!')
    } finally {
      setCancelling((prev) => ({ ...prev, [orderId]: false }))
    }
  }

  useEffect(() => {
    loadOrders(activeTab)
  }, [activeTab, loadOrders])

  useEffect(() => {
    const interval = setInterval(() => {
      loadOrders(activeTab)
    }, 30000)
    return () => clearInterval(interval)
  }, [activeTab, loadOrders])

  useEffect(() => {
    if (activeTab !== 'PREPARING') return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const updated = {}
        let changed = false
        orders.forEach((order) => {
          const remaining = getTimeRemaining(order)
          updated[order.id] = remaining
          if (prev[order.id] !== remaining) {
            changed = true
          }
        })
        return changed ? updated : prev
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [activeTab, orders])

  useEffect(() => {
    const handleOrderPlaced = () => loadOrders(activeTab)
    window.addEventListener('orderPlaced', handleOrderPlaced)
    return () => window.removeEventListener('orderPlaced', handleOrderPlaced)
  }, [activeTab, loadOrders])

  return (
    <Protected>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Đơn hàng của tôi</h1>
          <button
            onClick={() => loadOrders(activeTab)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>Làm mới</span>
          </button>
        </div>

        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg overflow-x-auto">
          {STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`flex-shrink-0 py-3 px-4 rounded-md font-medium text-sm transition-all ${
                activeTab === status
                  ? `bg-white shadow-sm border-b-2 ${tabColors[status]}`
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="whitespace-nowrap">{statusLabels[status]}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải đơn hàng...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-500 text-lg mb-2">Không có đơn hàng nào</p>
            <p className="text-gray-400 text-sm">
              {activeTab === 'PREPARING' && 'Bạn chưa có đơn hàng nào đang chờ xác nhận'}
              {activeTab === 'READY' && 'Bạn chưa có đơn hàng nào đang chờ lấy hàng'}
              {activeTab === 'DELIVERING' && 'Bạn chưa có đơn hàng nào đang được giao'}
              {activeTab === 'COMPLETED' && 'Bạn chưa có đơn hàng nào đã hoàn thành'}
              {activeTab === 'CANCELLED' && 'Bạn chưa có đơn hàng nào bị hủy'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const items = order.items || []
              const previewItems = items.slice(0, 4)
              const remainingPreview = Math.max(items.length - previewItems.length, 0)

              return (
                <div key={order.id} className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-lg">Đơn hàng #{order.id}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Đặt lúc: {new Date(order.created_at).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="font-bold text-xl text-gray-900">
                        {parseFloat(order.total_amount).toLocaleString()}₫
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="text-sm text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline"
                      >
                        Theo dõi đơn
                      </button>
                    </div>
                  </div>

                  {items.length > 0 && (
                    <div className="border-t border-b py-3 my-4">
                      <div className="flex gap-3 overflow-x-auto">
                        {previewItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 flex-shrink-0 min-w-0">
                            <div className="w-14 h-14 rounded border bg-gray-50 overflow-hidden flex items-center justify-center">
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.menu_item_name} className="w-full h-full object-cover" />
                              ) : (
                                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7M3 7l3.5 3.5M21 7l-6 6M8 13l3 3" />
                                </svg>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{item.menu_item_name}</div>
                              <div className="text-xs text-gray-500">x{item.quantity}</div>
                            </div>
                          </div>
                        ))}
                        {remainingPreview > 0 && (
                          <div className="w-14 h-14 rounded border border-dashed flex items-center justify-center text-xs text-gray-500">
                            +{remainingPreview} món
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-700 mb-3">Chi tiết đơn hàng:</h4>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div key={item.id} className="flex justify-between items-start text-sm">
                          <div className="flex-1">
                            <span className="font-medium">{item.menu_item_name}</span>
                            <span className="text-gray-500"> × {item.quantity}</span>
                            {item.options_text && (
                              <div className="text-gray-500 text-xs mt-1">Tùy chọn: {item.options_text}</div>
                            )}
                          </div>
                          <span className="font-medium text-gray-900">
                            {parseFloat(item.unit_price).toLocaleString()}₫
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        Thanh toán: <span className="font-medium text-gray-900">{order.payment_method}</span>
                      </div>
                      {order.note && (
                        <div>
                          Ghi chú: <span className="font-medium text-gray-700">"{order.note}"</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {activeTab === 'PREPARING' && (
                        <div className="flex items-center gap-2 text-xs text-orange-600 font-medium">
                          {canCancelOrder(order) ? (
                            <>
                              <span>Còn {timeRemaining[order.id] || 0}s để hủy</span>
                              <button
                                onClick={() => cancelOrder(order.id)}
                                disabled={cancelling[order.id]}
                                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                {cancelling[order.id] ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                                    <span>Đang hủy...</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    <span>Hủy đơn</span>
                                  </>
                                )}
                              </button>
                            </>
                          ) : (
                            <span>Đã hết thời gian hủy đơn</span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center text-xs text-gray-600">
                        {activeTab === 'PREPARING' && 'Đang chờ xác nhận'}
                        {activeTab === 'READY' && 'Sẵn sàng lấy hàng'}
                        {activeTab === 'DELIVERING' && 'Đang giao hàng'}
                        {activeTab === 'COMPLETED' && 'Đã giao thành công'}
                        {activeTab === 'CANCELLED' && 'Đơn hàng đã bị hủy'}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Protected>
  )
}
