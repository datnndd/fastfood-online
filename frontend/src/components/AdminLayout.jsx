import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

// SVG Icons
const HomeIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
)

const ShoppingBagIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
)

const ClipboardDocumentListIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
)

const UsersIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
)

const Bars3Icon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
)

const XMarkIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
)

const ArrowRightOnRectangleIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
)

const navigation = [
    { name: 'Tổng quan', href: '/admin', icon: HomeIcon },
    { name: 'Sản phẩm', href: '/admin/products', icon: ShoppingBagIcon },
    { name: 'Đơn hàng', href: '/admin/orders', icon: ClipboardDocumentListIcon },
    { name: 'Người dùng', href: '/admin/users', icon: UsersIcon },
]

export default function AdminLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const location = useLocation()
    const navigate = useNavigate()

    const handleLogout = () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        navigate('/')
    }

    const handleGoToUserSite = () => {
        navigate('/')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile sidebar */}
            <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
                <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
                    <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Admin Dashboard</h2>
                        <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
                            <XMarkIcon />
                        </button>
                    </div>
                    <nav className="flex-1 space-y-1 px-2 py-4">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href
                            const IconComponent = item.icon
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                        ? 'bg-red-100 text-red-900'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <IconComponent />
                                    <span className="ml-3">{item.name}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Mobile Footer */}
                    <div className="p-4 border-t border-gray-200">
                        <button
                            onClick={handleGoToUserSite}
                            className="w-full text-left px-2 py-2 text-sm text-gray-600 hover:text-gray-900"
                        >
                            ← Về trang chủ
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
                <div className="flex flex-col bg-white border-r border-gray-200 shadow-sm">
                    <div className="flex h-16 items-center px-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Admin Dashboard</h2>
                    </div>
                    <nav className="flex-1 space-y-1 px-2 py-4">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href
                            const IconComponent = item.icon
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                        ? 'bg-red-100 text-red-900'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <IconComponent />
                                    <span className="ml-3">{item.name}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Desktop Footer */}
                    <div className="p-4 border-t border-gray-200">
                        <button
                            onClick={handleGoToUserSite}
                            className="w-full text-left px-2 py-2 text-sm text-gray-600 hover:text-gray-900"
                        >
                            ← Về trang chủ
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <div className="flex h-16 items-center justify-between bg-white border-b border-gray-200 px-4 lg:px-6 shadow-sm">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden text-gray-600 hover:text-gray-900"
                    >
                        <Bars3Icon />
                    </button>

                    <div className="flex items-center space-x-4 ml-auto">
                        <span className="text-sm text-gray-600 hidden sm:block">
                            Chào mừng, Admin
                        </span>
                        <button
                            onClick={handleLogout}
                            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowRightOnRectangleIcon />
                            <span className="ml-2 hidden sm:block">Đăng xuất</span>
                        </button>
                    </div>
                </div>

                {/* Page content */}
                <main className="p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
