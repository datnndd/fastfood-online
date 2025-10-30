// src/pages/UpdatePasswordPage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/auth'

export default function UpdatePasswordPage() {
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [canUpdate, setCanUpdate] = useState(false) // Chỉ cho phép update khi có session
  const { updatePassword } = useAuth()
  const navigate = useNavigate()

  // Lắng nghe sự kiện PASSWORD_RECOVERY
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Khi Supabase xác nhận token từ URL là hợp lệ,
        // nó sẽ kích hoạt sự kiện này và cung cấp một session tạm thời.
        setCanUpdate(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canUpdate) {
      setError('Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu không khớp.')
      return
    }
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.')
      return
    }

    setError('')
    setMessage('')
    setLoading(true)

    try {
      await updatePassword(formData.password)
      setMessage('Cập nhật mật khẩu thành công! Bạn sẽ được chuyển hướng đến trang đăng nhập.')
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 3000)
    } catch (error) {
      setError(error.message || 'Không thể cập nhật mật khẩu.')
    } finally {
      setLoading(false)
    }
  }

  if (!canUpdate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg text-gray-700">Đang xác thực link đặt lại mật khẩu...</p>
          <p className="text-sm text-gray-500">(Nếu chờ quá lâu, vui lòng thử lại từ email)</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Đặt Lại Mật Khẩu</h2>
          <p className="mt-2 text-gray-600">Nhập mật khẩu mới của bạn.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {message}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mật khẩu mới
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Xác nhận mật khẩu
            </label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !!message}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {loading ? 'Đang cập nhật...' : 'Lưu mật khẩu mới'}
          </button>
        </form>
      </div>
    </div>
  )
}