import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { ShoppingCartIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import logo from '../assets/images/logo.png'
import { IMAGE_PLACEHOLDER } from '../lib/placeholders'
import { CatalogAPI, CartAPI } from '../lib/api'
import { ContentAPI } from '../lib/contentApi'
import { useAuth, useRole } from '../lib/authContext'
import NotificationBell from './NotificationBell'

export default function NavBar() {
  const { user, logout } = useAuth()
  const { hasStaffAccess, isManager } = useRole()
  const [cartCount, setCartCount] = useState(0)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
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
      // Use lightweight count endpoint instead of fetching full cart
      CartAPI.getCount()
        .then(({ data }) => {
          setCartCount(data.count || 0)
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
    setShowMobileMenu(false)
  }, [location.pathname])

  const navLinks = [
    { path: '/', label: 'Trang chủ' },
    { path: '/about', label: 'Về Mc Dono' },
    { path: '/menu', label: 'Thực đơn', dropdown: categories },
    { path: '/promotions', label: 'Tin Tức' },
    { path: '/contact', label: 'Liên hệ' },
  ]

  const [logoUrl, setLogoUrl] = useState(logo)

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const items = await ContentAPI.getContentItems('global')
        const logoItems = items.filter(i => i.type === 'logo')
        // Find selected logo first, otherwise use the first active one
        const logoItem = logoItems.find(i => i.metadata?.selected === true) || logoItems[0]
        if (logoItem && logoItem.image_url) {
          setLogoUrl(logoItem.image_url)
        }
      } catch (error) {
        console.error('Error fetching logo:', error)
      }
    }
    fetchLogo()

    // Listen for logo updates
    const handleLogoUpdate = () => fetchLogo()
    window.addEventListener('logoUpdated', handleLogoUpdate)
    return () => window.removeEventListener('logoUpdated', handleLogoUpdate)
  }, [])

  return (
    <>
      <div className="bg-gradient-to-br from-[#C8102E] to-[#DAA520] vn-gradient-red-gold text-white shadow-lg sticky top-0 z-50 vn-bamboo-border border-b-0 border-t-0 border-l-0 border-r-0 border-b-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-[80px] px-4 lg:px-8">
          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-white hover:bg-white/10 rounded-full"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <XMarkIcon className="w-7 h-7" /> : <Bars3Icon className="w-7 h-7" />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <div className="bg-white p-1.5 rounded-full overflow-hidden shadow-md group-hover:scale-105 transition-transform duration-300 h-[50px] w-[50px] flex items-center justify-center">
              <img
                src={logoUrl}
                alt="Mc Dono Logo"
                className="h-full w-full object-cover"
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex space-x-2 font-bold text-[15px] relative">
            {navLinks.map((link) => {
              const isActive =
                location.pathname === link.path ||
                (link.path !== '/' && location.pathname.startsWith(link.path))

              return (
                <div key={link.path} className="relative group">
                  <Link
                    to={link.path}
                    className={`px-5 py-2.5 rounded-full transition-all duration-300 flex items-center gap-1 uppercase tracking-wide ${isActive
                      ? 'bg-white text-red-700 shadow-md'
                      : 'text-white hover:bg-white/20'
                      }`}
                  >
                    {link.label}
                    {link.dropdown && (
                      <span className="text-xs opacity-70">▾</span>
                    )}
                  </Link>

                  {/* Mega Menu Dropdown */}
                  {link.dropdown && link.dropdown.length > 0 && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-4 w-[800px] bg-white text-gray-800 rounded-3xl shadow-xl p-6 z-50 opacity-0 invisible group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 translate-y-4 transition-all duration-300 ease-out border-2 vn-border-gold">
                      {/* Decorative Triangle */}
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t-2 border-l-2 vn-border-gold transform rotate-45"></div>

                      <div className="grid grid-cols-4 gap-6">
                        {link.dropdown.map((item) => {
                          const slug = item.slug || item.id
                          const fallbackImg = IMAGE_PLACEHOLDER
                          const imageSrc = item.image_url || item.image || fallbackImg
                          return (
                            <button
                              type="button"
                              key={slug}
                              onClick={() => navigate(`/menu?category=${slug}`)}
                              className="flex flex-col items-center group/item cursor-pointer text-center"
                            >
                              <div className="w-24 h-24 rounded-full overflow-hidden border-2 vn-border-lotus shadow-sm group-hover/item:shadow-md group-hover/item:scale-105 transition-all duration-300 relative">
                                <img
                                  src={imageSrc}
                                  alt={item.name}
                                  loading="lazy"
                                  className="w-full h-full object-cover"
                                  onError={(event) => {
                                    event.currentTarget.onerror = null
                                    event.currentTarget.src = fallbackImg
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/10 transition-colors"></div>
                              </div>
                              <span className="mt-3 font-bold text-sm text-gray-700 group-hover/item:text-red-700 transition-colors">
                                {item.name}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                      <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                        <Link to="/menu" className="text-sm font-bold text-red-600 hover:text-red-800 hover:underline uppercase tracking-wide">
                          Xem tất cả thực đơn →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-4 lg:space-x-6">
            {user && <NotificationBell />}

            {user && (
              <Link
                to="/cart"
                className="relative p-2 text-white hover:text-yellow-300 transition-colors group"
              >
                <ShoppingCartIcon className="w-7 h-7 group-hover:scale-110 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-red-800 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm animate-bounce">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu((prev) => !prev)}
                  className="flex items-center space-x-2 text-white hover:text-yellow-200 transition-colors focus:outline-none"
                >
                  <div className="w-9 h-9 bg-white text-red-700 rounded-full flex items-center justify-center font-bold border-2 border-yellow-400 shadow-sm">
                    {displayInitial}
                  </div>
                  <span className="hidden md:block font-bold max-w-[100px] truncate">{displayName || user.username}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-64 vn-card border-2 vn-border-gold shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 bg-white">
                    <div className="vn-gradient-red-gold px-6 py-4 border-b border-red-100">
                      <p className="text-sm font-bold text-white truncate">{displayName || user.username}</p>
                      <p className="text-xs text-white/80 truncate">{user.email}</p>
                    </div>
                    <div className="py-2">
                      <Link
                        to="/profile"
                        className="block px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        👤 Hồ sơ của tôi
                      </Link>
                      <Link
                        to="/orders"
                        className="block px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        📦 Đơn hàng của tôi
                      </Link>
                      {isManager ? (
                        <Link
                          to="/manager/dashboard"
                          className="block px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          📊 Dashboard quản lý
                        </Link>
                      ) : (
                        hasStaffAccess && (
                          <Link
                            to="/work"
                            className="block px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            💼 Quản lý đơn hàng
                          </Link>
                        )
                      )}
                      <div className="h-px bg-gray-100 my-2"></div>
                      <button
                        onClick={() => {
                          logout()
                          setShowUserMenu(false)
                        }}
                        className="block w-full text-left px-6 py-2.5 text-sm text-red-600 hover:bg-red-50 font-bold transition-colors"
                      >
                        🚪 Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="hidden sm:block px-5 py-2 text-white font-bold hover:text-yellow-200 transition-colors uppercase tracking-wide"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 bg-white text-red-700 font-bold rounded-full shadow-md hover:bg-yellow-50 hover:shadow-lg hover:-translate-y-0.5 transition-all uppercase tracking-wide"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div className="lg:hidden absolute top-full left-0 w-full vn-bg-rice-paper shadow-xl border-t-2 vn-border-gold animate-in slide-in-from-top-5">
            <div className="flex flex-col p-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-3 rounded-xl font-bold uppercase tracking-wide ${location.pathname === link.path
                    ? 'bg-red-50 vn-text-red-primary'
                    : 'text-gray-700 hover:bg-white'
                    }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  {link.label}
                </Link>
              ))}
              {!user && (
                <div className="pt-4 mt-2 border-t border-red-100 flex flex-col gap-3">
                  <Link
                    to="/login"
                    className="w-full text-center py-3 text-gray-700 font-bold border-2 border-gray-200 rounded-xl uppercase tracking-wide"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="w-full text-center py-3 vn-btn-primary font-bold rounded-xl shadow-md uppercase tracking-wide"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Đăng ký ngay
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
