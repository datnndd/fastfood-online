import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { ShoppingCartIcon } from '@heroicons/react/24/outline'
import logo from '../assets/images/logo.jpg'
import { IMAGE_PLACEHOLDER } from '../lib/placeholders'
import { CatalogAPI, CartAPI } from '../lib/api'
import { useAuth, useRole } from '../lib/authContext'
import NotificationBell from './NotificationBell'

export default function NavBar() {
  const { user, logout } = useAuth()
  const { hasStaffAccess, isManager } = useRole()
  const [cartCount, setCartCount] = useState(0)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [categories, setCategories] = useState([])
  const location = useLocation()
  const navigate = useNavigate()
  const menuRef = useRef(null)

  const displayName = useMemo(() => {
    if (!user) return ''
    const fullName = (user.full_name || '').trim()
    return fullName || user.username || ''
  }, [user])

  const displayInitial = useMemo(() => {
    if (!user) return ''
    const source = displayName || user.username || '?'
    return source.charAt(0).toUpperCase()
  }, [displayName, user])

  const loadCategories = useCallback(async () => {
    try {
      const res = await CatalogAPI.listCategories()
      setCategories(res.data.results || res.data)
    } catch (error) {
      console.error('Lỗi khi lấy danh mục:', error)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    const handleCategoriesUpdated = () => loadCategories()
    window.addEventListener('categoriesUpdated', handleCategoriesUpdated)
    return () => window.removeEventListener('categoriesUpdated', handleCategoriesUpdated)
  }, [loadCategories])

  useEffect(() => {
    if (!user) {
      setCartCount(0)
      return
    }

    const refreshCartCount = () => {
      CartAPI.getCart()
        .then(({ data }) => {
          const itemsTotal = (data.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0)
          const combosTotal = (data.combos || []).reduce((sum, combo) => sum + (combo.quantity || 0), 0)
          setCartCount(itemsTotal + combosTotal)
        })
        .catch(() => setCartCount(0))
    }

    refreshCartCount()
    window.addEventListener('cartUpdated', refreshCartCount)
    return () => {
      window.removeEventListener('cartUpdated', refreshCartCount)
    }
  }, [user])

  useEffect(() => {
    if (!showUserMenu) return

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscapeKey)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [showUserMenu])

  useEffect(() => {
    setShowUserMenu(false)
  }, [location.pathname])

  const navLinks = [
    { path: '/', label: 'Trang chủ' },
    { path: '/about', label: 'Về Mc Dono' },
    { path: '/menu', label: 'Thực đơn', dropdown: categories },
    { path: '/promotions', label: 'Khuyến mãi' },
    { path: '/contact', label: 'Liên hệ' },
  ]

  return (
    <>
      <div className="bg-[#e21b1b] text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-[90px] px-6">
          <Link to="/" className="flex items-center">
            <img
              src={logo}
              alt="Mc Dono Logo"
              className="h-[65px] w-auto rounded-md bg-white p-1"
            />
          </Link>

          <div className="flex space-x-6 font-semibold uppercase text-[14px] relative">
            {navLinks.map((link) => {
              const isActive =
                location.pathname === link.path ||
                (link.path !== '/' && location.pathname.startsWith(link.path))

              return (
                <div key={link.path} className="relative group">
                  <Link
                    to={link.path}
                    className={`px-4 py-2 border-2 transition-all duration-200 rounded-full ${
                      isActive
                        ? 'border-white bg-[#f9d7d7] text-[#b91c1c]'
                        : 'border-transparent hover:border-white hover:bg-[#f9d7d7] hover:text-[#b91c1c]'
                    }`}
                  >
                    {link.label}
                  </Link>

                  {link.dropdown && link.dropdown.length > 0 && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[750px] bg-white text-black rounded-xl shadow-lg p-5 z-50 opacity-0 invisible group-hover:visible group-hover:opacity-100 group-hover:translate-y-2 transition-all duration-300 ease-out">
                      <div className="grid grid-cols-4 gap-5">
                        {link.dropdown.map((item) => {
                          const slug = item.slug || item.id
                          const fallbackImg = IMAGE_PLACEHOLDER
                          const imageSrc = item.image_url || item.image || fallbackImg
                          return (
                            <button
                              type="button"
                              key={slug}
                              onClick={() => navigate(`/menu?category=${slug}`)}
                              className="flex flex-col items-center hover:scale-105 transition-transform duration-200 cursor-pointer"
                            >
                              <img
                                src={imageSrc}
                                alt={item.name}
                                loading="lazy"
                                className="w-20 h-20 object-cover rounded-full border border-gray-200 shadow-sm mb-2"
                                onError={(event) => {
                                  event.currentTarget.onerror = null
                                  event.currentTarget.src = fallbackImg
                                }}
                              />
                              <span className="font-semibold text-sm text-gray-800 text-center">
                                {item.name}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex items-center space-x-6">
            {user && <NotificationBell />}

            {user && (
              <Link
                to="/cart"
                className="relative p-2 text-white hover:text-yellow-300 transition-colors"
              >
                <ShoppingCartIcon className="w-7 h-7" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu((prev) => !prev)}
                  className="flex items-center space-x-2 text-white hover:text-yellow-300 transition-colors"
                >
                  <div className="w-8 h-8 bg-white text-[#e21b1b] rounded-full flex items-center justify-center font-bold">
                    {displayInitial}
                  </div>
                  <span className="hidden md:block">{displayName || user.username}</span>
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
                        className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Hồ sơ của tôi
                      </Link>
                      <Link
                        to="/orders"
                        className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Đơn hàng của tôi
                      </Link>
                      {isManager ? (
                        <Link
                          to="/manager/dashboard"
                          className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Dashboard quản lý
                        </Link>
                      ) : (
                        hasStaffAccess && (
                          <Link
                            to="/work"
                            className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
                            onClick={() => setShowUserMenu(false)}
                          >
                            Quản lý đơn hàng
                          </Link>
                        )
                      )}
                      <button
                        onClick={() => {
                          logout()
                          setShowUserMenu(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-white hover:text-yellow-300 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-white text-[#e21b1b] rounded-lg hover:bg-[#f9d7d7] transition-colors"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
