import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              McDono
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Đồ ăn nhanh tươi ngon, giao hàng siêu tốc
            </p>
            <div className="space-x-4">
              <Link
                to="/menu"
                className="inline-block bg-white text-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Xem thực đơn
              </Link>
              {!user && (
                <Link
                  to="/register"
                  className="inline-block border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-red-600 transition-colors"
                >
                  Đăng ký ngay
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tại sao chọn McDono?
            </h2>
            <p className="text-gray-600 text-lg">
              Chúng tôi cam kết mang đến trải nghiệm tốt nhất
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Giao hàng nhanh</h3>
              <p className="text-gray-600">
                Đảm bảo giao hàng trong 30 phút hoặc miễn phí trong khu vực Hà Nội
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🍔</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Nguyên liệu tươi</h3>
              <p className="text-gray-600">
                Sử dụng 100% nguyên liệu tươi sạch, không chất bảo quản
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Giá cả hợp lý</h3>
              <p className="text-gray-600">
                Chất lượng cao với mức giá phải chăng cho mọi người
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-red-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">
            Sẵn sàng thưởng thức?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Khám phá thực đơn đa dạng với hơn 50 món ngon
          </p>
          <Link
            to="/menu"
            className="inline-block bg-white text-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Đặt hàng ngay
          </Link>
        </div>
      </div>
    </div>
  )
}