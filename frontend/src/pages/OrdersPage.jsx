import { useState, useEffect } from 'react'
import { OrderAPI } from '../lib/api'
import Protected from '../components/Protected'

const statusLabels = {
  'PREPARING': 'Đang chuẩn bị',
  'READY': 'Sẵn sàng',
  'DELIVERING': 'Đang giao',
  'COMPLETED': 'Hoàn thành',
  'CANCELLED': 'Đã hủy'
}

const statusColors = {
  'PREPARING': 'text-yellow-600 bg-yellow-100',
  'READY': 'text-blue-600 bg-blue-100',
  'DELIVERING': 'text-purple-600 bg-purple-100',
  'COMPLETED': 'text-green-600 bg-green-100',
  'CANCELLED': 'text-red-600 bg-red-100'
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    OrderAPI.getMyOrders()
      .then(response => {
        setOrders(response.data.results || [])
      })
      .catch(error => {
        console.error('Failed to load orders:', error)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <Protected>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Đơn hàng của tôi</h1>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải đơn hàng...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Bạn chưa có đơn hàng nào</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white border rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Đơn hàng #{order.id}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.menu_item_name} × {item.quantity}
                        {item.options_text && (
                          <span className="text-gray-500"> ({item.options_text})</span>
                        )}
                      </span>
                      <span>{parseFloat(item.unit_price).toLocaleString()}₫</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm">
                    <span className="text-gray-600">Thanh toán: </span>
                    <span className="font-medium">{order.payment_method}</span>
                    {order.note && (
                      <div className="text-gray-500 mt-1">Ghi chú: {order.note}</div>
                    )}
                  </div>
                  <div className="font-bold">
                    {parseFloat(order.total_amount).toLocaleString()}₫
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