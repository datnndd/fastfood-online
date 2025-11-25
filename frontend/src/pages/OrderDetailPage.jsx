import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Protected from '../components/Protected'
import { OrderAPI } from '../lib/api'
import OrderProgressBar from '../components/OrderProgressBar'
import OrderTimeline from '../components/OrderTimeline'

const statusLabels = {
  'PREPARING': 'Đang chuẩn bị',
  'READY': 'Sẵn sàng',
  'DELIVERING': 'Đang giao',
  'COMPLETED': 'Hoàn tất',
  'CANCELLED': 'Đã hủy'
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await OrderAPI.my.get(id)
        setOrder(data)
      } catch {
        navigate('/profile?tab=orders')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, navigate])

  return (
    <Protected>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-600 hover:text-gray-800 mb-4">← Trở lại</button>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải chi tiết đơn hàng...</p>
          </div>
        ) : !order ? (
          <div className="text-center py-12">Không tìm thấy đơn hàng</div>
        ) : (
          <div className="space-y-6">
            {/* Header kiểu Shopee */}
            <div className="bg-white border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-semibold">McDono</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm border ${order.status === 'CANCELLED' ? 'text-red-700 bg-red-100 border-red-200' : 'text-green-700 bg-green-100 border-green-200'}`}>
                {statusLabels[order.status]}
              </div>
            </div>

            {/* Ẩn tiến trình dạng thanh step để giao diện giống Shopee */}

            {/* Card địa chỉ + timeline kiểu Shopee */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Địa chỉ nhận hàng</h3>
              <div className="grid gap-6 md:grid-cols-[1.2fr_2fr]">
                <div className="text-sm text-gray-700">
                  <div className="font-medium">{order.delivery_address?.contact_name}</div>
                  <div>{order.delivery_address?.contact_phone}</div>
                  <div className="mt-1">{order.delivery_address?.street_address}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {order.delivery_address?.ward?.name}, {order.delivery_address?.province?.name}
                  </div>
                </div>
                <div className="md:pl-6">
                  <OrderTimeline order={order} />
                </div>
              </div>
            </div>

            {/* Sản phẩm + tính tiền kiểu Shopee */}
            <div className="bg-white border rounded-lg">
              <div className="p-4">
                <h3 className="font-semibold mb-3">Sản phẩm</h3>
                <div className="divide-y">
                  {order.items.map((it) => (
                    <div key={it.id} className="py-3 flex items-start justify-between text-sm">
                      <div className="flex items-start gap-3 pr-4">
                        <div className="w-16 h-16 rounded border bg-gray-50 overflow-hidden flex items-center justify-center">
                          {it.image_url ? (
                            <img src={it.image_url} alt={it.menu_item_name} className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7M3 7l3.5 3.5M21 7l-6 6M8 13l3 3" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{it.menu_item_name}</div>
                          {it.options_text && (
                            <div className="text-xs text-gray-500 mt-1">{it.options_text}</div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">x{it.quantity}</div>
                        </div>
                      </div>
                      <div className="text-right whitespace-nowrap font-semibold">{parseFloat(it.unit_price).toLocaleString()}₫</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bảng tính tiền */}
              <div className="border-t px-4 py-3 text-sm">
                {(() => {
                  const subtotal = order.items.reduce((s, it) => s + Number(it.unit_price) * Number(it.quantity), 0)
                  const shipping = 0
                  return (
                    <div className="max-w-md ml-auto space-y-2">
                      <div className="flex items-center justify-between text-gray-600">
                        <span>Tổng tiền hàng</span>
                        <span>{subtotal.toLocaleString()}₫</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-600">
                        <span>Phí vận chuyển</span>
                        <span>{shipping.toLocaleString()}₫</span>
                      </div>
                      {/* Đã ẩn dòng Giảm giá theo yêu cầu */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-gray-700">Thành tiền</span>
                        <span className="text-xl font-bold text-red-600">{parseFloat(order.total_amount).toLocaleString()}₫</span>
                      </div>
                    </div>
                  )
                })()}
              </div>
              {order.payment_method === 'cash' && (
                <div className="bg-yellow-50 text-yellow-800 border-t border-yellow-200 px-4 py-3 text-sm">
                  Vui lòng thanh toán <span className="font-semibold">{parseFloat(order.total_amount).toLocaleString()}₫</span> khi nhận hàng.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Protected>
  )
}


