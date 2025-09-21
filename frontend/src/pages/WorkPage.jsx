import { useState, useEffect } from 'react'
import { OrderAPI } from '../lib/api'
import Protected from '../components/Protected'

export default function WorkPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState({})

  const loadOrders = async () => {
    try {
      const response = await OrderAPI.work.list()
      setOrders(response.data.results || [])
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
    // Auto refresh every 30 seconds
    const interval = setInterval(loadOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  const updateStatus = async (orderId, status) => {
    setUpdating({ ...updating, [orderId]: true })
    try {
      await OrderAPI.work.updateStatus(orderId, status)
      loadOrders()
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('Có lỗi xảy ra khi cập nhật trạng thái')
    } finally {
      setUpdating({ ...updating, [orderId]: false })
    }
  }

  return (
    <Protected roles={['staff', 'manager']}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
          <button
            onClick={loadOrders}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Làm mới
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải đơn hàng...</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white border rounded-lg p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Đơn hàng #{order.id}</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {new Date(order.created_at).toLocaleString('vi-VN')}
                    </p>

                    <div className="space-y-2 mb-4">
                      {order.items.map(item => (
                        <div key={item.id} className="text-sm">
                          <strong>{item.menu_item_name}</strong> × {item.quantity}
                          {item.options_text && (
                            <div className="text-gray-500">- {item.options_text}</div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="text-sm">
                      <div><strong>Tổng tiền:</strong> {parseFloat(order.total_amount).toLocaleString()}₫</div>
                      <div><strong>Thanh toán:</strong> {order.payment_method}</div>
                      {order.note && <div><strong>Ghi chú:</strong> {order.note}</div>}
                    </div>
                  </div>

                  <div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">
                        Cập nhật trạng thái:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['PREPARING', 'READY', 'DELIVERING', 'COMPLETED'].map(status => (
                          <button
                            key={status}
                            onClick={() => updateStatus(order.id, status)}
                            disabled={updating[order.id] || order.status === status}
                            className={`px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
                              order.status === status
                                ? statusColors[status]
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                            }`}
                          >
                            {updating[order.id] && order.status !== status ? (
                              <span className="animate-spin">⟳</span>
                            ) : null}
                            {statusLabels[status]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
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