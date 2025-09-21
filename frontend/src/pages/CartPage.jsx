import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CartAPI, OrderAPI } from '../lib/api'
import Protected from '../components/Protected'

export default function CartPage() {
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [orderData, setOrderData] = useState({
    payment_method: 'cash',
    note: ''
  })
  const navigate = useNavigate()

  const loadCart = async () => {
    try {
      const response = await CartAPI.getCart()
      setCart(response.data)
    } catch (error) {
      console.error('Failed to load cart:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCart()
  }, [])

  const updateQuantity = async (itemId, quantity) => {
    try {
      await CartAPI.patchItem(itemId, { quantity })
      loadCart()
    } catch (error) {
      console.error('Failed to update quantity:', error)
    }
  }

  const removeItem = async (itemId) => {
    try {
      await CartAPI.removeItem(itemId)
      loadCart()
    } catch (error) {
      console.error('Failed to remove item:', error)
    }
  }

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) return
    
    setCheckoutLoading(true)
    try {
      const totalAmount = cart.items.reduce((sum, item) => 
        sum + (parseFloat(item.menu_item.price) * item.quantity), 0
      )

      await OrderAPI.checkout({
        ...orderData,
        total_amount: totalAmount.toString()
      })

      alert('Đặt hàng thành công!')
      navigate('/orders')
    } catch (error) {
      console.error('Checkout failed:', error)
      alert('Có lỗi xảy ra khi đặt hàng')
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <Protected>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Giỏ hàng</h1>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải giỏ hàng...</p>
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Giỏ hàng trống</p>
            <button
              onClick={() => navigate('/menu')}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Xem thực đơn
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map(item => (
                <div key={item.id} className="bg-white border rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.menu_item.image_url || 'https://via.placeholder.com/80'}
                      alt={item.menu_item.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{item.menu_item.name}</h3>
                      {item.selected_options.length > 0 && (
                        <p className="text-sm text-gray-500">
                          Options: {item.selected_options.map(opt => opt.name).join(', ')}
                        </p>
                      )}
                      <div className="flex items-center mt-2 gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="px-2">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-100"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="ml-4 text-red-600 hover:text-red-700 text-sm"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {(parseFloat(item.menu_item.price) * item.quantity).toLocaleString()}₫
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Checkout */}
            <div className="bg-white border rounded-lg p-6 h-fit">
              <h3 className="font-bold text-lg mb-4">Đặt hàng</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Phương thức thanh toán
                  </label>
                  <select
                    value={orderData.payment_method}
                    onChange={(e) => setOrderData({ ...orderData, payment_method: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="cash">Tiền mặt</option>
                    <option value="card">Thẻ</option>
                    <option value="bank_transfer">Chuyển khoản</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ghi chú
                  </label>
                  <textarea
                    value={orderData.note}
                    onChange={(e) => setOrderData({ ...orderData, note: e.target.value })}
                    placeholder="Ghi chú đặc biệt cho đơn hàng..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={3}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span>Tạm tính:</span>
                  <span>
                    {cart.items.reduce((sum, item) => 
                      sum + (parseFloat(item.menu_item.price) * item.quantity), 0
                    ).toLocaleString()}₫
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Tổng cộng:</span>
                  <span>
                    {cart.items.reduce((sum, item) => 
                      sum + (parseFloat(item.menu_item.price) * item.quantity), 0
                    ).toLocaleString()}₫
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="w-full mt-6 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {checkoutLoading ? 'Đang đặt hàng...' : 'Đặt hàng'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Protected>
  )
}