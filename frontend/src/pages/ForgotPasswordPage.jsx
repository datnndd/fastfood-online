import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setMessage('Đã gửi email khôi phục mật khẩu. Vui lòng kiểm tra hộp thư.')
    } catch (err) {
      setError(err.message || 'Không thể gửi email khôi phục')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Quên mật khẩu</h2>
          <p className="mt-2 text-gray-600">Nhập email để nhận liên kết đặt lại mật khẩu</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">{message}</div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Đang gửi...' : 'Gửi liên kết khôi phục'}
          </button>

          <div className="text-center">
            <Link to="/login" className="text-red-600 hover:text-red-500 font-medium">Quay lại đăng nhập</Link>
          </div>
        </form>
      </div>
    </div>
  )
}


