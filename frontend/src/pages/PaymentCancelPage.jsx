import { useNavigate, useSearchParams } from 'react-router-dom'
import Protected from '../components/Protected'

export default function PaymentCancelPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const orderId = searchParams.get('order_id')

  return (
    <Protected>
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white border rounded-lg p-8 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
            <svg
              className="h-10 w-10 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Thanh toán đã bị hủy
          </h1>
          <p className="text-gray-600 mb-6">
            Bạn đã hủy quá trình thanh toán. Đơn hàng của bạn vẫn được lưu trong giỏ hàng.
          </p>
          {orderId && (
            <p className="text-sm text-gray-500 mb-6">
              Mã đơn hàng: #{orderId}
            </p>
          )}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/cart')}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Quay lại giỏ hàng
            </button>
            <button
              onClick={() => navigate('/menu')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        </div>
      </div>
    </Protected>
  )
}

