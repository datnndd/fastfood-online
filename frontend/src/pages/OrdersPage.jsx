import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { OrderAPI } from '../lib/api'
import Protected from '../components/Protected'

const STATUSES = ['PREPARING', 'READY', 'DELIVERING', 'COMPLETED', 'CANCELLED']

const statusLabels = {
  PREPARING: 'Đang chuẩn bị',
  READY: 'Sẵn sàng',
  DELIVERING: 'Đang giao',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
}

const statusColors = {
  PREPARING: 'text-yellow-700 bg-yellow-100 border-yellow-200',
  READY: 'text-blue-700 bg-blue-100 border-blue-200',
  DELIVERING: 'text-purple-700 bg-purple-100 border-purple-200',
  COMPLETED: 'text-green-700 bg-green-100 border-green-200',
  CANCELLED: 'text-red-700 bg-red-100 border-red-200',
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('PREPARING')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const loadOrders = async (status = activeTab) => {
    setLoading(true)
    try {
      const response = await OrderAPI.my.list(1, status)
      const ordersData = response.data.results || []
      setOrders(ordersData)
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders(activeTab)
  }, [activeTab])

  // Auto refresh mỗi 30 giây
  useEffect(() => {
    const interval = setInterval(() => {
      loadOrders(activeTab)
    }, 30000)
    return () => clearInterval(interval)
  }, [activeTab])

  return (
    <Protected>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Đơn hàng của tôi</h1>
          <button
            onClick={() => loadOrders(activeTab)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Làm mới
          </button>
        </div>

        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg overflow-x-auto">
          {STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`flex-shrink-0 py-3 px-4 rounded-md font-medium text-sm transition-all ${
                activeTab === status
                  ? `bg-white shadow-sm border-b-2 ${statusColors[status]}`
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
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-white border rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/orders/${order.id}`)}>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Đơn hàng #{order.id}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Đặt lúc: {new Date(order.created_at).toLocaleString('vi-VN')}</p>
                    </div>
                    <div className="text-right pl-4">
                      <div className="text-xs text-gray-500 mb-1">Thành tiền:</div>
                      <div className="text-xl font-bold text-red-600">{parseFloat(order.total_amount).toLocaleString()}₫</div>
                    </div>
                  </div>
                  
                  {/* Hiển thị sản phẩm với hình ảnh */}
                  {order.items && order.items.length > 0 && (
                    <div className="border-t pt-3">
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 flex-shrink-0 min-w-0">
                            <div className="w-16 h-16 rounded border bg-gray-50 overflow-hidden flex items-center justify-center flex-shrink-0">
                              {item.image_url ? (
                                <img 
                                  src={item.image_url} 
                                  alt={item.menu_item_name || 'Sản phẩm'} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.nextElementSibling.style.display = 'flex'
                                  }}
                                />
                              ) : null}
                              <svg 
                                className={`w-6 h-6 text-gray-300 ${item.image_url ? 'hidden' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">{item.menu_item_name}</div>
                              <div className="text-xs text-gray-500">x{item.quantity}</div>
                            </div>
                          </div>
                        ))}
                        {order.combos && order.combos.length > 0 && order.combos.map((combo) => (
                          <div key={combo.id} className="flex items-center gap-2 flex-shrink-0 min-w-0">
                            <div className="w-16 h-16 rounded border bg-gray-50 overflow-hidden flex items-center justify-center flex-shrink-0">
                              {combo.image_url ? (
                                <img 
                                  src={combo.image_url} 
                                  alt={combo.combo_name || 'Combo'} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.nextElementSibling.style.display = 'flex'
                                  }}
                                />
                              ) : null}
                              <svg 
                                className={`w-6 h-6 text-gray-300 ${combo.image_url ? 'hidden' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">{combo.combo_name}</div>
                              <div className="text-xs text-gray-500">x{combo.quantity}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Protected>
  )
}


