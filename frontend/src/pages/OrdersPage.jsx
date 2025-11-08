import { useState, useEffect, useCallback } from 'react'
import { OrderAPI } from '../lib/api'
import Protected from '../components/Protected'

// Helper function để kiểm tra đơn hàng có thể hủy không (trong 60s)
const canCancelOrder = (order) => {
  // Nếu đã thanh toán bằng thẻ, kiểm tra từ payment_completed_at
  if (order.payment_method === 'card' && order.payment_completed_at) {
    const paymentTime = new Date(order.payment_completed_at)
    const currentTime = new Date()
    const diffInSeconds = (currentTime - paymentTime) / 1000
    return diffInSeconds <= 60
  }
  // Nếu chưa thanh toán, kiểm tra từ created_at
  const orderTime = new Date(order.created_at)
  const currentTime = new Date()
  const diffInSeconds = (currentTime - orderTime) / 1000
  return diffInSeconds <= 60
}

// Helper function để tính thời gian còn lại
const getTimeRemaining = (order) => {
  // Nếu đã thanh toán bằng thẻ, tính từ payment_completed_at
  if (order.payment_method === 'card' && order.payment_completed_at) {
    const paymentTime = new Date(order.payment_completed_at)
    const currentTime = new Date()
    const diffInSeconds = (currentTime - paymentTime) / 1000
    const remaining = Math.max(0, 60 - diffInSeconds)
    return Math.ceil(remaining)
  }
  // Nếu chưa thanh toán, tính từ created_at
  const orderTime = new Date(order.created_at)
  const currentTime = new Date()
  const diffInSeconds = (currentTime - orderTime) / 1000
  const remaining = Math.max(0, 60 - diffInSeconds)
  return Math.ceil(remaining)
}

const STATUSES = ['PREPARING', 'READY', 'DELIVERING', 'COMPLETED', 'CANCELLED']

const statusLabels = {
  'PREPARING': 'Chờ xác nhận',
  'READY': 'Chờ lấy hàng', 
  'DELIVERING': 'Chờ giao hàng',
  'COMPLETED': 'Đã giao',
  'CANCELLED': 'Đã hủy'
}

const statusColors = {
  'PREPARING': 'text-yellow-700 bg-yellow-100 border-yellow-200',
  'READY': 'text-blue-700 bg-blue-100 border-blue-200',
  'DELIVERING': 'text-purple-700 bg-purple-100 border-purple-200',
  'COMPLETED': 'text-green-700 bg-green-100 border-green-200',
  'CANCELLED': 'text-red-700 bg-red-100 border-red-200'
}

const tabColors = {
  'PREPARING': 'border-yellow-500 text-yellow-700',
  'READY': 'border-blue-500 text-blue-700',
  'DELIVERING': 'border-purple-500 text-purple-700',
  'COMPLETED': 'border-green-500 text-green-700',
  'CANCELLED': 'border-red-500 text-red-700'
}

export default function OrdersPage() {
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
      
      // Khởi tạo time remaining cho các đơn PREPARING
      if (status === 'PREPARING') {
        const timeRemainingData = {}
        ordersData.forEach(order => {
          timeRemainingData[order.id] = getTimeRemaining(order)
        })
        setTimeRemaining(timeRemainingData)
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

    setCancelling(prev => ({ ...prev, [orderId]: true }))
    try {
      await OrderAPI.my.cancel(orderId)
      await loadOrders(activeTab)
      alert('Đơn hàng đã được hủy thành công!')
    } catch (error) {
      console.error('Failed to cancel order:', error)
      alert('Có lỗi xảy ra khi hủy đơn hàng. Vui lòng thử lại!')
    } finally {
      setCancelling(prev => ({ ...prev, [orderId]: false }))
    }
  }

  useEffect(() => {
    loadOrders(activeTab)
  }, [activeTab, loadOrders])

  // Auto refresh mỗi 30 giây và cập nhật countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      loadOrders(activeTab)
    }, 30000)
    return () => clearInterval(interval)
  }, [activeTab, loadOrders])

  // Timer để cập nhật thời gian còn lại mỗi giây cho tab PREPARING
  useEffect(() => {
    if (activeTab !== 'PREPARING') return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        const updated = {}
        let hasChanges = false
        
        orders.forEach(order => {
          const remaining = getTimeRemaining(order)
          updated[order.id] = remaining
          if (prev[order.id] !== remaining) {
            hasChanges = true
          }
        })
        
        return hasChanges ? updated : prev
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [activeTab, orders])

  return (
    <Protected>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Đơn hàng của tôi</h1>
          <button
            onClick={() => {
              loadOrders(activeTab)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            <span>Làm mới</span>
          </button>
        </div>

        {/* Tabs đơn giản */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg overflow-x-auto">
          {STATUSES.map(status => (
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

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải đơn hàng...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <div className="mb-4">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
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
            {orders.map(order => (
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
                  <div className="text-right">
                    <div className="font-bold text-xl text-gray-900">
                      {parseFloat(order.total_amount).toLocaleString()}₫
                    </div>
                  </div>
                </div>

                {/* Chi tiết món ăn */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-700 mb-3">Chi tiết đơn hàng:</h4>
                  <div className="space-y-2">
                    {order.items.map(item => (
                      <div key={item.id} className="flex justify-between items-start text-sm">
                        <div className="flex-1">
                          <span className="font-medium">{item.menu_item_name}</span>
                          <span className="text-gray-500"> × {item.quantity}</span>
                          {item.options_text && (
                            <div className="text-gray-500 text-xs mt-1">
                              Tùy chọn: {item.options_text}
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-gray-900">
                          {parseFloat(item.unit_price).toLocaleString()}₫
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Thông tin thanh toán, ghi chú và nút hủy */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="text-sm">
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-600">
                        Thanh toán: <span className="font-medium text-gray-900">{order.payment_method}</span>
                      </span>
                      {order.note && (
                        <span className="text-gray-600">
                          Ghi chú: <span className="font-medium text-gray-700">"{order.note}"</span>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* Nút hủy đơn cho trạng thái PREPARING */}
                    {activeTab === 'PREPARING' && (
                      <div className="flex items-center space-x-2">
                        {canCancelOrder(order) ? (
                          <>
                            <div className="text-xs text-orange-600 font-medium">
                              Còn {timeRemaining[order.id] || 0}s để hủy
                            </div>
                            <button
                              onClick={() => cancelOrder(order.id)}
                              disabled={cancelling[order.id]}
                              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
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
                          <div className="text-xs text-gray-500">
                            Đã hết thời gian hủy đơn
                          </div>
                        )}
                      </div>
                    )}

                    {/* Trạng thái progress */}
                    <div className="flex items-center space-x-2">
                      {activeTab === 'PREPARING' && (
                        <div className="flex items-center text-yellow-600">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs">Đang chờ xác nhận</span>
                        </div>
                      )}
                      {activeTab === 'READY' && (
                        <div className="flex items-center text-blue-600">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-xs">Sẵn sàng lấy hàng</span>
                        </div>
                      )}
                      {activeTab === 'DELIVERING' && (
                        <div className="flex items-center text-purple-600">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs">Đang giao hàng</span>
                        </div>
                      )}
                      {activeTab === 'COMPLETED' && (
                        <div className="flex items-center text-green-600">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs">Đã giao thành công</span>
                        </div>
                      )}
                      {activeTab === 'CANCELLED' && (
                        <div className="flex items-center text-red-600">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs">Đã bị hủy</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Protected>
  )
}
