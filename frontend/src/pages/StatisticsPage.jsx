import { useState } from 'react'
import { OrderAPI } from '../lib/api'

const STAT_TYPES = [
    { value: 'revenue', label: '💰 Doanh thu tổng', icon: '💰' },
    { value: 'orders', label: '📦 Số lượng đơn hàng', icon: '📦' },
    { value: 'top_items', label: '🍔 Món ăn bán chạy', icon: '🍔' },
    { value: 'top_combos', label: '🎁 Combo bán chạy', icon: '🎁' }
]

const ORDER_STATUSES = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'pending', label: 'Chờ xác nhận' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'preparing', label: 'Đang chuẩn bị' },
    { value: 'ready', label: 'Sẵn sàng giao' },
    { value: 'delivering', label: 'Đang giao' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'cancelled', label: 'Đã hủy' }
]

export default function StatisticsPage() {
    const [filters, setFilters] = useState({
        from_date: '',
        to_date: '',
        status: '',
        stat_type: 'revenue'
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [data, setData] = useState(null)
    const [exporting, setExporting] = useState(false)

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }))
    }

    const validateFilters = () => {
        if (!filters.from_date || !filters.to_date) {
            setError('⚠️ Vui lòng chọn khoảng thời gian thống kê')
            return false
        }

        if (new Date(filters.from_date) > new Date(filters.to_date)) {
            setError('⚠️ Ngày bắt đầu phải nhỏ hơn ngày kết thúc')
            return false
        }

        return true
    }

    const fetchStatistics = async () => {
        if (!validateFilters()) return

        setLoading(true)
        setError(null)

        try {
            const params = {
                from_date: filters.from_date,
                to_date: filters.to_date,
                ...(filters.status && { status: filters.status })
            }

            let response
            switch (filters.stat_type) {
                case 'revenue':
                    response = await OrderAPI.stats.getRevenue(params)
                    break
                case 'orders':
                    response = await OrderAPI.stats.getOrderStats(params)
                    break
                case 'top_items':
                    response = await OrderAPI.stats.getTopItems(params)
                    break
                case 'top_combos':
                    response = await OrderAPI.stats.getTopCombos(params)
                    break
                default:
                    response = await OrderAPI.stats.getRevenue(params)
            }

            setData(response.data)

            if (!response.data || (Array.isArray(response.data) && response.data.length === 0)) {
                setError('📭 Không có dữ liệu thống kê trong khoảng thời gian này')
            }
        } catch (err) {
            console.error('Statistics error:', err)

            if (err.response?.status === 500) {
                setError('🔌 Lỗi kết nối cơ sở dữ liệu, vui lòng thử lại sau')
            } else if (err.response?.data?.detail) {
                setError(`❌ ${err.response.data.detail}`)
            } else {
                setError('❌ Không thể tải dữ liệu thống kê')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleExport = async (format) => {
        if (!validateFilters()) return

        setExporting(true)

        try {
            const params = {
                from_date: filters.from_date,
                to_date: filters.to_date,
                stat_type: filters.stat_type,
                ...(filters.status && { status: filters.status })
            }

            const response = await OrderAPI.stats.exportReport(params, format)

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `bao-cao-thong-ke-${filters.from_date}-${filters.to_date}.${format}`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch (err) {
            console.error('Export error:', err)
            setError('❌ Không thể xuất báo cáo')
        } finally {
            setExporting(false)
        }
    }

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value)
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-2xl">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center gap-4">
                        <span className="text-6xl">📊</span>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight mb-2">
                                BÁO CÁO THỐNG KÊ
                            </h1>
                            <p className="text-purple-100 text-lg">
                                Phân tích doanh thu & hiệu suất kinh doanh
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Filters Card */}
                <div className="bg-white rounded-3xl shadow-xl p-6 mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-3xl">🔍</span>
                        <h2 className="text-2xl font-black text-gray-900">Bộ lọc thống kê</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {/* From Date */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <span className="text-xl">📅</span>
                                Từ ngày *
                            </label>
                            <input
                                type="date"
                                value={filters.from_date}
                                onChange={(e) => handleFilterChange('from_date', e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                            />
                        </div>

                        {/* To Date */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <span className="text-xl">📅</span>
                                Đến ngày *
                            </label>
                            <input
                                type="date"
                                value={filters.to_date}
                                onChange={(e) => handleFilterChange('to_date', e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                            />
                        </div>

                        {/* Order Status */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <span className="text-xl">🏷️</span>
                                Trạng thái đơn
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-semibold focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                            >
                                {ORDER_STATUSES.map((status) => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Stat Type */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <span className="text-xl">📈</span>
                                Loại thống kê
                            </label>
                            <select
                                value={filters.stat_type}
                                onChange={(e) => handleFilterChange('stat_type', e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-semibold focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                            >
                                {STAT_TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={fetchStatistics}
                            disabled={loading}
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Đang tải...
                                </>
                            ) : (
                                <>
                                    <span className="text-xl">🔍</span>
                                    Xem báo cáo
                                </>
                            )}
                        </button>

                        {data && (
                            <>
                                <button
                                    onClick={() => handleExport('pdf')}
                                    disabled={exporting}
                                    className="px-6 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 flex items-center gap-2"
                                >
                                    <span className="text-xl">📄</span>
                                    Xuất PDF
                                </button>

                                <button
                                    onClick={() => handleExport('xlsx')}
                                    disabled={exporting}
                                    className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 flex items-center gap-2"
                                >
                                    <span className="text-xl">📊</span>
                                    Xuất Excel
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-600 px-6 py-4 rounded-xl shadow-lg">
                        <p className="text-red-800 font-semibold text-lg">{error}</p>
                    </div>
                )}

                {/* Results */}
                {data && !error && (
                    <div className="space-y-6">
                        {/* Revenue Statistics */}
                        {filters.stat_type === 'revenue' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 text-white shadow-xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-5xl">📦</span>
                                        <span className="text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">
                                            Tổng đơn
                                        </span>
                                    </div>
                                    <div className="text-4xl font-black mb-2">
                                        {data.total_orders || 0}
                                    </div>
                                    <div className="text-blue-100">Đơn hàng</div>
                                </div>

                                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 text-white shadow-xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-5xl">💰</span>
                                        <span className="text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">
                                            Doanh thu
                                        </span>
                                    </div>
                                    <div className="text-3xl font-black mb-2">
                                        {formatCurrency(data.total_revenue || 0)}
                                    </div>
                                    <div className="text-green-100">Tổng cộng</div>
                                </div>

                                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl p-6 text-white shadow-xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-5xl">📊</span>
                                        <span className="text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">
                                            Trung bình
                                        </span>
                                    </div>
                                    <div className="text-3xl font-black mb-2">
                                        {formatCurrency(data.avg_per_day || 0)}
                                    </div>
                                    <div className="text-purple-100">VNĐ/ngày</div>
                                </div>
                            </div>
                        )}

                        {/* Orders List */}
                        {filters.stat_type === 'orders' && data.orders && (
                            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-5">
                                    <h3 className="text-2xl font-black text-white flex items-center gap-3">
                                        <span className="text-3xl">📋</span>
                                        Danh sách đơn hàng
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Mã ĐH</th>
                                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Ngày tạo</th>
                                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Trạng thái</th>
                                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">Tổng tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {data.orders.map((order) => (
                                                <tr key={order.id} className="hover:bg-blue-50 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-blue-600">#{order.id}</td>
                                                    <td className="px-6 py-4">{formatDate(order.created_at)}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-black text-green-600">
                                                        {formatCurrency(order.total_amount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Top Items */}
                        {filters.stat_type === 'top_items' && data.items && (
                            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                                <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-5">
                                    <h3 className="text-2xl font-black text-white flex items-center gap-3">
                                        <span className="text-3xl">🍔</span>
                                        Top món ăn bán chạy
                                    </h3>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {data.items.slice(0, 10).map((item, index) => (
                                        <div
                                            key={item.id}
                                            className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-5 border-2 border-orange-200"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <div className="text-3xl font-black text-orange-600 mb-1">
                                                        #{index + 1}
                                                    </div>
                                                    <h4 className="font-bold text-gray-900 text-lg">{item.name}</h4>
                                                </div>
                                                <span className="text-4xl">{item.emoji || '🍔'}</span>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Số lượng:</span>
                                                    <span className="font-bold text-gray-900">{item.quantity} phần</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Đơn giá TB:</span>
                                                    <span className="font-bold text-blue-600">
                                                        {formatCurrency(item.avg_price)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between pt-2 border-t border-orange-200">
                                                    <span className="text-gray-600 font-semibold">Doanh thu:</span>
                                                    <span className="font-black text-green-600">
                                                        {formatCurrency(item.revenue)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Top Combos */}
                        {filters.stat_type === 'top_combos' && data.combos && (
                            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                                <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-5">
                                    <h3 className="text-2xl font-black text-white flex items-center gap-3">
                                        <span className="text-3xl">🎁</span>
                                        Top combo bán chạy
                                    </h3>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {data.combos.slice(0, 10).map((combo, index) => (
                                        <div
                                            key={combo.id}
                                            className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border-2 border-purple-200"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <div className="text-3xl font-black text-purple-600 mb-1">
                                                        #{index + 1}
                                                    </div>
                                                    <h4 className="font-bold text-gray-900 text-lg">{combo.name}</h4>
                                                </div>
                                                <span className="text-4xl">🎁</span>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Số lượng:</span>
                                                    <span className="font-bold text-gray-900">{combo.quantity} combo</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Giá combo:</span>
                                                    <span className="font-bold text-blue-600">
                                                        {formatCurrency(combo.price)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between pt-2 border-t border-purple-200">
                                                    <span className="text-gray-600 font-semibold">Doanh thu:</span>
                                                    <span className="font-black text-green-600">
                                                        {formatCurrency(combo.revenue)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {!data && !loading && !error && (
                    <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
                        <span className="text-8xl block mb-6">📊</span>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            Chọn bộ lọc và xem báo cáo
                        </h3>
                        <p className="text-gray-600 text-lg">
                            Vui lòng chọn khoảng thời gian và loại thống kê để xem báo cáo
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
