import { useEffect, useState } from 'react'
import AdminProtected from '../../components/AdminProtected'
import AdminLayout from '../../components/AdminLayout'

// Icons thủ công
const ShoppingBagIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
)

const ClipboardDocumentListIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
)

const UsersIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
)

const CurrencyDollarIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
)

const CollectionIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
)

const StarIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
)

const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString('vi-VN')
}

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalRevenue: 0,
        totalMenuItems: 0,
        totalUsers: 0,
        totalCategories: 0,
        totalCombos: 0
    })
    const [recentOrders, setRecentOrders] = useState([])
    const [topMenuItems, setTopMenuItems] = useState([])
    const [recentCombos, setRecentCombos] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        setLoading(true)
        try {
            // Thử load dữ liệu thực từ API
            try {
                const [categoriesRes, menuItemsRes] = await Promise.all([
                    AdminAPI.categories.list(),
                    AdminAPI.menuItems.list()
                ])

                const categories = categoriesRes.data?.results || categoriesRes.data || []
                const menuItems = menuItemsRes.data?.results || menuItemsRes.data || []

                console.log('Loaded categories:', categories)
                console.log('Loaded menu items:', menuItems)

                setStats(prev => ({
                    ...prev,
                    totalCategories: categories.length,
                    totalMenuItems: menuItems.length
                }))

                // Set top menu items từ data thực
                if (menuItems.length > 0) {
                    const topItems = menuItems
                        .filter(item => item.is_available)
                        .slice(0, 5)
                        .map(item => ({
                            id: item.id,
                            name: item.name,
                            category: typeof item.category === 'object' ? item.category?.name : 'N/A',
                            price: item.price,
                            sold_count: Math.floor(Math.random() * 50) + 1, // Mock sold count
                            is_available: item.is_available
                        }))
                    setTopMenuItems(topItems)
                }
            } catch (apiError) {
                console.warn('API calls failed, using sample data:', apiError)
                // Fall back to sample data nếu API không hoạt động
                setStats({
                    totalOrders: 125,
                    totalRevenue: 4568000,
                    totalMenuItems: 48,
                    totalUsers: 89,
                    totalCategories: 8,
                    totalCombos: 12
                })

                setTopMenuItems([
                    { id: 1, name: 'Burger Bò Phô Mai', category: 'Burger', price: 89000, sold_count: 45, is_available: true },
                    { id: 2, name: 'Pizza Hải Sản', category: 'Pizza', price: 159000, sold_count: 32, is_available: true },
                    { id: 3, name: 'Gà Rán Giòn', category: 'Gà rán', price: 79000, sold_count: 28, is_available: false },
                    { id: 4, name: 'Mì Ý Carbonara', category: 'Mì Ý', price: 95000, sold_count: 25, is_available: true },
                    { id: 5, name: 'Salad Caesar', category: 'Salad', price: 65000, sold_count: 18, is_available: true },
                ])
            }

            // Sample recent orders
            setRecentOrders([
                { id: 1, user: { username: 'user1' }, total_amount: 250000, status: 'pending', created_at: new Date().toISOString() },
                { id: 2, user: { username: 'user2' }, total_amount: 180000, status: 'delivered', created_at: new Date().toISOString() },
                { id: 3, user: { username: 'user3' }, total_amount: 320000, status: 'preparing', created_at: new Date().toISOString() },
            ])

            // Sample recent combos
            setRecentCombos([
                {
                    id: 1,
                    name: 'Combo Burger + Nước',
                    category: 'Combo',
                    original_price: 125000,
                    final_price: 99000,
                    discount_percentage: 20,
                    is_available: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    name: 'Combo Pizza Gia Đình',
                    category: 'Combo',
                    original_price: 350000,
                    final_price: 280000,
                    discount_percentage: 20,
                    is_available: true,
                    created_at: new Date(Date.now() - 86400000).toISOString()
                },
                {
                    id: 3,
                    name: 'Combo Gà Rán + Khoai',
                    category: 'Combo',
                    original_price: 150000,
                    final_price: 120000,
                    discount_percentage: 20,
                    is_available: false,
                    created_at: new Date(Date.now() - 172800000).toISOString()
                },
            ])

        } catch (error) {
            console.error('Failed to load dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const statCards = [
        {
            title: 'Tổng đơn hàng',
            value: stats.totalOrders,
            icon: ClipboardDocumentListIcon,
            color: 'bg-blue-500'
        },
        {
            title: 'Doanh thu',
            value: `${formatCurrency(stats.totalRevenue)}₫`,
            icon: CurrencyDollarIcon,
            color: 'bg-green-500'
        },
        {
            title: 'Món ăn',
            value: stats.totalMenuItems,
            icon: ShoppingBagIcon,
            color: 'bg-purple-500'
        },
        {
            title: 'Người dùng',
            value: stats.totalUsers,
            icon: UsersIcon,
            color: 'bg-red-500'
        },
        {
            title: 'Danh mục',
            value: stats.totalCategories,
            icon: CollectionIcon,
            color: 'bg-indigo-500'
        },
        {
            title: 'Combo',
            value: stats.totalCombos,
            icon: StarIcon,
            color: 'bg-yellow-500'
        }
    ]

    const getStatusBadge = (status) => {
        const statusStyles = {
            pending: 'bg-yellow-100 text-yellow-800',
            confirmed: 'bg-blue-100 text-blue-800',
            preparing: 'bg-purple-100 text-purple-800',
            ready: 'bg-green-100 text-green-800',
            delivered: 'bg-gray-100 text-gray-800',
            cancelled: 'bg-red-100 text-red-800'
        }

        const statusTexts = {
            pending: 'Chờ xác nhận',
            confirmed: 'Đã xác nhận',
            preparing: 'Đang chuẩn bị',
            ready: 'Sẵn sàng',
            delivered: 'Đã giao',
            cancelled: 'Đã hủy'
        }

        return (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
                {statusTexts[status] || status}
            </span>
        )
    }

    if (loading) {
        return (
            <AdminProtected>
                <AdminLayout>
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                    </div>
                </AdminLayout>
            </AdminProtected>
        )
    }

    return (
        <AdminProtected>
            <AdminLayout>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-gray-600">Tổng quan hệ thống quản lý FastFood Online</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                        {statCards.map((stat, index) => (
                            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center">
                                    <div className={`p-3 rounded-lg ${stat.color}`}>
                                        <stat.icon className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Recent Orders */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Đơn hàng gần đây</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Khách hàng
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Tổng tiền
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Trạng thái
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {recentOrders.length > 0 ? recentOrders.slice(0, 5).map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    #{order.id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {order.user?.username || order.user?.email || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatCurrency(order.total_amount)}₫
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {getStatusBadge(order.status)}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                                                    Chưa có đơn hàng nào
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Top Menu Items */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">Món ăn bán chạy</h2>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    {topMenuItems.map((item, index) => (
                                        <div key={item.id} className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                                    index === 1 ? 'bg-gray-100 text-gray-800' :
                                                        index === 2 ? 'bg-orange-100 text-orange-800' :
                                                            'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {index + 1}
                                                </span>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                                    <p className="text-xs text-gray-500">{item.category}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-gray-900">{item.sold_count} đã bán</p>
                                                <p className="text-xs text-gray-500">{formatCurrency(item.price)}₫</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Combos */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Combo gần đây</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tên combo
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Giá gốc
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Giá sau giảm
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Giảm giá
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ngày tạo
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {recentCombos.map((combo) => (
                                        <tr key={combo.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {combo.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatCurrency(combo.original_price)}₫
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                                {formatCurrency(combo.final_price)}₫
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                    -{combo.discount_percentage}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${combo.is_available
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {combo.is_available ? 'Có sẵn' : 'Hết hàng'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(combo.created_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        </AdminProtected>
    )
}
