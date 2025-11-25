import { useState, useEffect } from 'react'
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/authContext'

export default function LoginPage() {
  const [formData, setFormData] = useState({ loginInput: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [socialLoading, setSocialLoading] = useState('')
  const { login, loginWithProvider, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (typeof location.state?.from === 'string' && location.state.from) || '/'

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await login(formData.loginInput, formData.password)
      navigate(from, { replace: true })
    } catch (error) {
      setError(error.message || 'Đăng nhập thất bại')
    } finally {
      setSubmitting(false)
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center vn-bg-rice-paper">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600 font-bold">Đang kiểm tra phiên đăng nhập...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return <Navigate to={from} replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center vn-bg-rice-paper relative overflow-hidden">
      <div className="absolute inset-0 vn-lotus-pattern opacity-10 pointer-events-none" />
      <div className="absolute top-10 left-10 text-6xl opacity-20 vn-animate-lantern-sway">🏮</div>
      <div className="absolute bottom-10 right-10 text-6xl opacity-20 vn-animate-lantern-sway" style={{ animationDelay: '1s' }}>🏮</div>

      <div className="max-w-md w-full space-y-8 p-8 vn-card border-2 vn-border-gold relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4 border border-red-100">
            <span className="text-3xl">🏮</span>
          </div>
          <h2 className="text-3xl font-black vn-text-red-primary vn-heading-display">Đăng nhập</h2>
          <p className="mt-2 text-gray-600 font-medium">Chào mừng trở lại McDono</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700">
              Email hoặc Username
            </label>
            <input
              type="text"
              required
              value={formData.loginInput}
              onChange={(e) => setFormData({ ...formData, loginInput: e.target.value })}
              className="mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-medium"
              placeholder="Nhập email hoặc username"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700">
              Mật khẩu
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-medium"
              placeholder="••••••••"
            />
            <div className="mt-2 text-right">
              <Link to="/forgot-password" className="text-sm font-bold text-red-600 hover:text-red-700 hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white vn-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>

          <div className="flex items-center gap-3">
            <span className="flex-1 h-px bg-gray-200" />
            <span className="text-sm font-medium text-gray-500">Hoặc</span>
            <span className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              disabled={!!socialLoading}
              className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-xl py-3 px-4 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-60"
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
          </div>

          <div className="text-center">
            <span className="text-gray-600 font-medium">Chưa có tài khoản? </span>
            <Link to="/register" className="text-red-600 hover:text-red-700 font-bold hover:underline">
              Đăng ký ngay
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
