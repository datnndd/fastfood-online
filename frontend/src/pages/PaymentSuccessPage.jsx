import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { OrderAPI } from '../lib/api'
import Protected from '../components/Protected'

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [orderId, setOrderId] = useState(null)
  const [order, setOrder] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(60)
  const [cancelling, setCancelling] = useState(false)
  const sessionId = searchParams.get('session_id')
  const orderIdFromState = location.state?.orderId

  useEffect(() => {
    // Đợi một chút để Stripe webhook xử lý xong
    const timer = setTimeout(async () => {
      setLoading(false)
      // Tìm order từ session_id hoặc orderId
      if (sessionId || orderIdFromState) {
        try {
          // Try to get order from orders list
          const response = await OrderAPI.my.list(1, 'PREPARING')
          const orders = response.data?.results || []
          const foundOrder = orders.find(o => 
            o.id === parseInt(orderIdFromState) || 
            (sessionId && o.stripe_checkout_session_id === sessionId)
          )
          if (foundOrder) {
            setOrder(foundOrder)
            setOrderId(foundOrder.id)
            // Calculate time remaining
            if (foundOrder.payment_completed_at) {
              const completedTime = new Date(foundOrder.payment_completed_at)
              const now = new Date()
              const diffSeconds = Math.max(0, 60 - Math.floor((now - completedTime) / 1000))
              setTimeRemaining(diffSeconds)
            }
          }
        } catch (error) {
          console.error('Failed to load order:', error)
        }
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [sessionId, orderIdFromState])

  // Countdown timer
  useEffect(() => {
    if (!order || !order.payment_completed_at || timeRemaining <= 0) return

    const timer = setInterval(() => {
      if (order.payment_completed_at) {
        const completedTime = new Date(order.payment_completed_at)
        const now = new Date()
        const diffSeconds = Math.max(0, 60 - Math.floor((now - completedTime) / 1000))
        setTimeRemaining(diffSeconds)
        
        if (diffSeconds <= 0) {
          clearInterval(timer)
        }
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [order, timeRemaining])

  const handleCancel = async () => {
    if (!orderId) return
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này? Tiền sẽ được hoàn lại tự động.')) {
      return
    }

    setCancelling(true)
    try {
      await OrderAPI.my.cancel(orderId)
      alert('Đơn hàng đã được hủy thành công! Tiền đã được hoàn lại.')
      navigate('/orders')
    } catch (error) {
      console.error('Failed to cancel order:', error)
      const message = error.response?.data?.error || error.response?.data?.detail || 'Có lỗi xảy ra khi hủy đơn hàng.'
      alert(message)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <Protected>
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white border rounded-lg p-8 text-center">
          {loading ? (
            <>
              <div className="mx-auto h-16 w-16 animate-spin rounded-full border-b-4 border-green-600 mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Đang xử lý thanh toán...
              </h1>
              <p className="text-gray-600">
                Vui lòng đợi trong giây lát
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <svg
                  className="h-10 w-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Thanh toán thành công!
              </h1>
              <p className="text-gray-600 mb-6">
                Đơn hàng của bạn đã được xác nhận và đang được xử lý.
              </p>
              {sessionId && (
                <p className="text-sm text-gray-500 mb-4">
                  Mã phiên thanh toán: {sessionId}
                </p>
              )}
              
              {/* Cancel button với countdown (chỉ hiển thị nếu thanh toán bằng thẻ và trong 60s) */}
              {order && order.payment_method === 'card' && order.payment_completed_at && timeRemaining > 0 && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Bạn có thể hủy đơn hàng trong vòng {timeRemaining} giây
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Tiền sẽ được hoàn lại tự động khi hủy
                      </p>
                    </div>
                    <button
                      onClick={handleCancel}
                      disabled={cancelling || timeRemaining <= 0}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => navigate('/orders')}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Xem đơn hàng của tôi
                </button>
                <button
                  onClick={() => navigate('/menu')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Tiếp tục mua sắm
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Protected>
  )
}

