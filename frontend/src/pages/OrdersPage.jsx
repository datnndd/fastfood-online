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
              <div key={order.id} className="bg-white border rounded-lg shadow-sm cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                <div className="p-4">
                  <div className="flex items-start justify-between">
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Protected>
  )
}


