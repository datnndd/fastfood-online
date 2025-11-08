import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/authContext'

export default function LoginPage() {
  const [formData, setFormData] = useState({ loginInput: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState('')
  const { login, loginWithProvider } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(formData.loginInput, formData.password)
      navigate(from, { replace: true })
    } catch (error) {
      setError(error.message || 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = async (provider) => {
    setError('')
    setSocialLoading(provider)
    try {
      await loginWithProvider(provider)
    } catch (error) {
      setError(error.message || `Không thể đăng nhập bằng ${provider}`)
      setSocialLoading('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Đăng nhập</h2>
          <p className="mt-2 text-gray-600">Chào mừng trở lại McDono</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email hoặc Username
            </label>
            <input
              type="text"
              required
              value={formData.loginInput}
              onChange={(e) => setFormData({ ...formData, loginInput: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
            <div className="mt-2 text-right">
              <Link to="/forgot-password" className="text-sm text-red-600 hover:text-red-500">
                Quên mật khẩu?
              </Link>
            </div>
          </div>

          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-red-600 hover:text-red-500"
            >
              Quên mật khẩu?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>

          <div className="flex items-center gap-3">
            <span className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-500">Hoặc</span>
            <span className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              disabled={!!socialLoading}
              className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-md py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-2 2.9l3.2 2.5c1.9-1.8 3-4.4 3-7.4 0-.7-.1-1.3-.2-1.9H12z"
                />
                <path
                  fill="#34A853"
                  d="M6.5 14.3l-.8.6-2.6 2c1.8 3.5 5.4 5.9 9.4 5.9 2.9 0 5.3-1 7-2.7l-3.2-2.5c-.9.6-2.1 1-3.8 1-2.9 0-5.3-1.9-6.2-4.6z"
                />
                <path
                  fill="#4285F4"
                  d="M3.1 7.2c-.7 1.3-1.1 2.7-1.1 4.2 0 1.5.4 3 .9 4.2l3.4-2.7c-.2-.6-.3-1.3-.3-2 0-.7.1-1.4.3-2z"
                />
                <path
                  fill="#FBBC05"
                  d="M12 5.5c1.6 0 3 .6 4 1.5l3-3c-1.8-1.7-4.1-2.8-7-2.8-4 0-7.6 2.3-9.4 5.9l3.4 2.7C6.7 7.4 9.1 5.5 12 5.5z"
                />
              </svg>
              {socialLoading === 'google' ? 'Đang chuyển hướng...' : 'Tiếp tục với Google'}
            </button>

            <button
              type="button"
              onClick={() => handleSocialLogin('facebook')}
              disabled={!!socialLoading}
              className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-md py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#1877F2"
                  d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24h11.495v-9.294H9.691V11.01h3.129V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.794.143v3.24l-1.918.001c-1.504 0-1.796.715-1.796 1.763v2.315h3.588l-.467 3.696h-3.121V24h6.116C23.407 24 24 23.407 24 22.676V1.325C24 .593 23.407 0 22.675 0"
                />
              </svg>
              {socialLoading === 'facebook' ? 'Đang chuyển hướng...' : 'Tiếp tục với Facebook'}
            </button>
          </div>

          <div className="text-center">
            <span className="text-gray-600">Chưa có tài khoản? </span>
            <Link to="/register" className="text-red-600 hover:text-red-500 font-medium">
              Đăng ký ngay
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
