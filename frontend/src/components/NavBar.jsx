import { Link } from 'react-router-dom'
import { useAuth, useRole } from '../lib/auth'
import { CartAPI } from '../lib/api'
import { useState, useEffect, useMemo } from 'react'

export default function NavBar() {
  const { user, logout } = useAuth()
  const { hasStaffAccess } = useRole()
  const [cartCount, setCartCount] = useState(0)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const displayName = useMemo(() => {
    if (!user) return ''
    const name = (user.full_name || '').trim()
    return name || user.username || ''
  }, [user])

  const displayInitial = useMemo(() => {
    if (!user) return ''
    if (displayName) {
      return displayName.charAt(0).toUpperCase()
    }
    return (user.username || '?').charAt(0).toUpperCase()
  }, [user, displayName])

  // Lấy số lượng items trong cart
  useEffect(() => {
    if (!user) {
      setCartCount(0)
      return
    }

    const refreshCartCount = () => {
      CartAPI.getCart()
        .then(({ data }) => {
          const itemCount = (data.items ?? []).reduce((sum, item) => sum + (item.quantity ?? 0), 0)
          const comboCount = (data.combos ?? []).reduce((sum, combo) => sum + (combo.quantity ?? 0), 0)
          setCartCount(itemCount + comboCount)
        })
        .catch(() => setCartCount(0))
    }

    refreshCartCount()
    window.addEventListener('cartUpdated', refreshCartCount)
    return () => {
      window.removeEventListener('cartUpdated', refreshCartCount)
    }
  }, [user])

  return (
    <>
      {/* Top bar */}
      <div className="bg-red-600 text-white text-sm">
        <div className="max-w-6xl mx-auto px-4 py-1 flex items-center gap-3">
          <span>🔥 Fast & Fresh</span>
          <span className="opacity-75">Mở cửa 24/7</span>
          <div className="ml-auto flex items-center gap-4">
            <span className="opacity-75">Giao hàng miễn phí khu vực Hà Nội</span>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="font-bold text-xl text-gray-900">McDono</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-gray-700 hover:text-red-600 transition-colors">
                Trang chủ
              </Link>
              <Link to="/menu" className="text-gray-700 hover:text-red-600 transition-colors">
                Thực đơn
              </Link>
              {hasStaffAccess && (
                <Link to="/work" className="text-gray-700 hover:text-red-600 transition-colors">
                  Quản lý
                </Link>
              )}
            </div>

            {/* User actions */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  {/* Cart */}
                  <Link 
                    to="/cart" 
                    className="relative p-2 text-gray-700 hover:text-red-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6H19M7 13v6a1 1 0 001 1h10a1 1 0 001-1v-6M9 19a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
                    </svg>
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>

                  {/* User menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors"
                    >
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {displayInitial}
                        </span>
                      </div>
                      <span className="hidden md:block">{displayName}</span>
                    </button>

                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                        <div className="py-2">
                          <div className="px-4 py-2 border-b">
                            <p className="text-sm font-medium text-gray-900">{displayName || user.username}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                          <Link
                            to="/profile"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Hồ sơ của tôi
                          </Link>
                          <Link
                            to="/orders"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Đơn hàng của tôi
                          </Link>
                          <button
                            onClick={() => {
                              logout()
                              setShowUserMenu(false)
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Đăng xuất
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-gray-700 hover:text-red-600 transition-colors"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
