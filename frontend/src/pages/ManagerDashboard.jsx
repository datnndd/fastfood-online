import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { OrderAPI } from '../lib/api'

const DASHBOARD_CARDS = [
    {
        title: 'Danh Mục',
        icon: '📂',
        description: 'Quản lý danh mục sản phẩm',
        path: '/manager/categories',
        gradient: 'from-indigo-500 to-blue-500',
        stats: 'categories'
    },
    {
        title: 'Món Ăn',
        icon: '🍔',
        description: 'Quản lý thực đơn món ăn',
        path: '/manager/menu',
        gradient: 'from-red-500 to-orange-500',
        stats: 'items'
    },
    {
        title: 'Combo',
        icon: '🎁',
        description: 'Quản lý combo ưu đãi',
        path: '/manager/combos',
        gradient: 'from-purple-500 to-pink-500',
        stats: 'combos'
    },
    {
        title: 'Tài Khoản',
        icon: '👥',
        description: 'Quản lý nhân viên và khách hàng',
        path: '/manager/accounts',
        gradient: 'from-pink-500 to-rose-500',
        stats: 'users'
    },
    {
        title: 'Thống Kê',
        icon: '📊',
        description: 'Báo cáo và phân tích doanh thu',
        path: '/manager/statistics',
        gradient: 'from-cyan-500 to-teal-500',
        stats: 'revenue'
    },
    {
        title: 'Đơn Hàng',
        icon: '📦',
        description: 'Quản lý đơn hàng của nhà hàng',
        path: '/work',
        gradient: 'from-yellow-500 to-orange-500',
        stats: 'orders'
    }
]

export default function ManagerDashboard() {
    const [stats, setStats] = useState({
        todayOrders: 0,
        todayRevenue: 0,
        pendingOrders: 0,
        completedOrders: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        try {
            const today = new Date().toISOString().split('T')[0]
            const response = await OrderAPI.work.getStats(today)
            setStats({
                todayOrders: response.data.total_orders || 0,
                todayRevenue: response.data.total_revenue || 0,
                pendingOrders: response.data.pending_orders || 0,
                completedOrders: response.data.completed_orders || 0
            })
        } catch (err) {
            console.error('Load stats error:', err)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value)
    }

    const getCurrentGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Chào buổi sáng'
        if (hour < 18) return 'Chào buổi chiều'
        return 'Chào buổi tối'
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white shadow-2xl">
                <div className="container mx-auto px-4 py-12">
                    <div className="text-center">
                        <h1 className="text-5xl font-black tracking-tight mb-3 animate-bounce-in">
                            🏪 DASHBOARD QUẢN LÝ
                        </h1>
                        <p className="text-2xl text-orange-100 mb-4">
                            {getCurrentGreeting()}, <span className="font-bold">Manager</span>! 👋
                        </p>
                        <p className="text-orange-100">
                            Chào mừng đến với trung tâm điều khiển cửa hàng
                        </p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-2xl p-6 shadow-xl border-l-4 border-blue-500">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-4xl">📦</div>
                            <div className="text-right">
                                <div className="text-3xl font-black text-blue-600">
                                    {loading ? '...' : stats.todayOrders}
                                </div>
                                <div className="text-sm text-gray-600 font-semibold">Đơn hôm nay</div>
                            </div>
                        </div>
                        <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 animate-pulse" style={{ width: '70%' }}></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-xl border-l-4 border-green-500">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-4xl">💰</div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-green-600">
                                    {loading ? '...' : formatCurrency(stats.todayRevenue)}
                                </div>
                                <div className="text-sm text-gray-600 font-semibold">Doanh thu hôm nay</div>
                            </div>
                        </div>
                        <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 animate-pulse" style={{ width: '85%' }}></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-xl border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-4xl">⏳</div>
                            <div className="text-right">
                                <div className="text-3xl font-black text-yellow-600">
                                    {loading ? '...' : stats.pendingOrders}
                                </div>
                                <div className="text-sm text-gray-600 font-semibold">Đơn chờ xử lý</div>
                            </div>
                        </div>
                        <div className="h-2 bg-yellow-100 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500 animate-pulse" style={{ width: '45%' }}></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-xl border-l-4 border-purple-500">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-4xl">✅</div>
                            <div className="text-right">
                                <div className="text-3xl font-black text-purple-600">
                                    {loading ? '...' : stats.completedOrders}
                                </div>
                                <div className="text-sm text-gray-600 font-semibold">Đơn hoàn thành</div>
                            </div>
                        </div>
                        <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 animate-pulse" style={{ width: '90%' }}></div>
                        </div>
                    </div>
                </div>

                {/* Management Cards */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-4xl">🎯</span>
                        <h2 className="text-3xl font-black text-gray-900">Chức năng quản lý</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {DASHBOARD_CARDS.map((card, index) => (
                            <Link
                                key={index}
                                to={card.path}
                                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 overflow-hidden"
                            >
                                <div className={`bg-gradient-to-r ${card.gradient} p-6 relative overflow-hidden`}>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
                                    <div className="relative">
                                        <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                                            {card.icon}
                                        </div>
                                        <h3 className="text-2xl font-black text-white mb-2">
                                            {card.title}
                                        </h3>
                                        <p className="text-white text-opacity-90 text-sm">
                                            {card.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600 font-semibold">
                                            Truy cập ngay
                                        </span>
                                        <div className="w-10 h-10 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-red-500 transition-all duration-300">
                                            <span className="text-gray-600 group-hover:text-white text-xl">→</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-4xl">⚡</span>
                        <h2 className="text-3xl font-black text-gray-900">Thao tác nhanh</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link
                            to="/manager/menu"
                            className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6 rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 transform"
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-4xl">🍔</span>
                                <div>
                                    <div className="text-xl font-bold">Thêm món mới</div>
                                    <div className="text-sm text-white text-opacity-80">Cập nhật menu nhanh</div>
                                </div>
                            </div>
                        </Link>

                        <Link
                            to="/manager/combos"
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 transform"
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-4xl">🎁</span>
                                <div>
                                    <div className="text-xl font-bold">Tạo combo mới</div>
                                    <div className="text-sm text-white text-opacity-80">Ưu đãi đặc biệt</div>
                                </div>
                            </div>
                        </Link>

                        <Link
                            to="/work"
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 transform"
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-4xl">📦</span>
                                <div>
                                    <div className="text-xl font-bold">Xem đơn hàng</div>
                                    <div className="text-sm text-white text-opacity-80">Quản lý đơn hàng</div>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* System Info */}
                <div className="mt-8 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">ℹ️</span>
                            <div>
                                <div className="font-bold text-gray-900">Hệ thống đang hoạt động tốt</div>
                                <div className="text-sm text-gray-600">
                                    Cập nhật lần cuối: {new Date().toLocaleString('vi-VN')}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                                🟢 Online
                            </span>
                            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                                v1.0.0
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
        </div>
    )
}
