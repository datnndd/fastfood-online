import { useState, useEffect, useCallback } from 'react'
import { CatalogAPI } from '../lib/api'
import ItemFormModal from '../components/ItemFormModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import DashboardBackButton from '../components/DashboardBackButton'

export default function ItemsManagement() {
    const [items, setItems] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterCategory, setFilterCategory] = useState('')
    const [viewMode, setViewMode] = useState('grid') // 'grid' or 'table'
    const [bulkStockValue, setBulkStockValue] = useState('')
    const [bulkUpdatingItems, setBulkUpdatingItems] = useState(false)
    const [successMessage, setSuccessMessage] = useState(null)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const PAGE_SIZE = 10

    const loadItems = useCallback(async () => {
        try {
            const params = {
                page,
                limit: PAGE_SIZE,
                search: searchTerm,
                category: filterCategory
            }
            const response = await CatalogAPI.listItems(params)
            let data = []
            let count = 0

            if (Array.isArray(response.data)) {
                data = response.data
                count = data.length
            } else {
                data = response.data.results || []
                count = response.data.count || 0
            }

            setItems(data)
            setTotalItems(count)
            setTotalPages(Math.ceil(count / PAGE_SIZE))
            setError(null)
        } catch (err) {
            console.error('Load items error:', err.response || err)
            setError(`Không thể tải danh sách món ăn: ${err.response?.data?.detail || err.message}`)
            setItems([])
            setTotalItems(0)
            setTotalPages(1)
        } finally {
            setLoading(false)
        }
    }, [page, searchTerm, filterCategory])

    const loadCategories = useCallback(async () => {
        try {
            const data = await CatalogAPI.listAllCategories()
            setCategories(Array.isArray(data) ? data : [])
        } catch (err) {
            console.error('Load categories error:', err.response || err)
            setCategories([])
        }
    }, [])

    useEffect(() => {
        loadCategories()
    }, [loadCategories])

    useEffect(() => {
        loadItems()
    }, [loadItems])

    // Reset page when filters change
    useEffect(() => {
        setPage(1)
    }, [searchTerm, filterCategory])

    const handleAdd = () => {
        setSelectedItem(null)
        setShowModal(true)
    }

    const handleEdit = (item) => {
        setSelectedItem(item)
        setShowModal(true)
    }

    const handleDelete = (item) => {
        setSelectedItem(item)
        setShowDeleteModal(true)
    }

    const confirmDelete = async () => {
        try {
            setError(null)
            await CatalogAPI.deleteItem(selectedItem.id)
            await loadItems()
            setShowDeleteModal(false)
            setSelectedItem(null)
        } catch (err) {
            console.error('Delete error:', err.response || err)
            let errorMessage = 'Không thể xóa món ăn'
            if (err.response) {
                if (err.response.status === 500) {
                    errorMessage = 'Món ăn đang được sử dụng, không thể xóa.'
                } else if (err.response.data?.detail) {
                    errorMessage = err.response.data.detail
                }
            }
            setError(errorMessage)
            setShowDeleteModal(false)
        }
    }

    useEffect(() => {
        if (!successMessage) return
        const timer = setTimeout(() => setSuccessMessage(null), 4000)
        return () => clearTimeout(timer)
    }, [successMessage])

    const handleSave = async () => {
        const wasEditing = Boolean(selectedItem)
        setError(null)
        await loadItems()
        setShowModal(false)
        setSelectedItem(null)
        const message = wasEditing ? 'Đã cập nhật món ăn thành công!' : 'Đã thêm món ăn mới thành công!'
        setSuccessMessage(message)
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const handleBulkStockUpdate = async () => {
        if (bulkStockValue === '') {
            alert('Vui lòng nhập số lượng tồn kho mong muốn.')
            return
        }
        const targetStock = parseInt(bulkStockValue, 10)
        if (Number.isNaN(targetStock) || targetStock < 0) {
            alert('Số lượng tồn kho phải là số không âm.')
            return
        }
        if (filteredItems.length === 0) {
            alert('Không có món ăn nào trong danh sách hiện tại để cập nhật.')
            return
        }

        setBulkUpdatingItems(true)
        try {
            await Promise.all(
                filteredItems.map((item) =>
                    CatalogAPI.patchItem(item.id, {
                        stock: targetStock
                    })
                )
            )
            await loadItems()
            alert(`Đã cập nhật ${filteredItems.length} món ăn về ${targetStock} phần.`)
        } catch (err) {
            console.error('Bulk stock update failed:', err)
            const message = err.response?.data?.detail || err.message || 'Không thể cập nhật tồn kho hàng loạt.'
            alert(message)
        } finally {
            setBulkUpdatingItems(false)
        }
    }

    const handleToggleAvailability = async (item) => {
        try {
            setError(null)
            await CatalogAPI.patchItem(item.id, {
                is_available: !item.is_available
            })
            await loadItems()
        } catch (err) {
            console.error('Toggle availability error:', err)
            setError('Không thể cập nhật trạng thái món ăn')
        }
    }

    const getCategoryName = (item) => {
        return item.category_name || 'N/A'
    }

    // Client-side filtering removed in favor of server-side filtering
    const filteredItems = items

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-yellow-50 to-orange-50 flex justify-center items-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600"></div>
                    <p className="mt-6 text-xl font-bold text-gray-700">Đang tải menu...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-yellow-50 to-orange-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-2xl">
                <div className="container mx-auto px-4 py-8 space-y-4">
                    <DashboardBackButton className="bg-white/10 text-white hover:bg-white hover:text-red-600 border-transparent" />
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-black tracking-tight mb-2">
                                🍔 QUẢN LÝ MENU
                            </h1>
                            <p className="text-red-100 text-lg">
                                Tổng cộng: <span className="font-bold text-white">{totalItems}</span> món ăn
                            </p>
                        </div>
                        <button
                            onClick={handleAdd}
                            className="bg-white text-red-600 px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-200 flex items-center gap-2"
                        >
                            <span className="text-2xl">+</span>
                            Thêm món mới
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Error Alert */}
                {error && (
                    <div className="mb-6 bg-red-100 border-l-4 border-red-600 text-red-800 px-6 py-4 rounded-lg shadow-lg">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">⚠️</span>
                            <p className="font-semibold">{error}</p>
                        </div>
                    </div>
                )}
                {successMessage && (
                    <div className="mb-6 bg-green-100 border-l-4 border-green-600 text-green-800 px-6 py-4 rounded-lg shadow-lg">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">✅</span>
                            <p className="font-semibold">{successMessage}</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="🔍 Tìm kiếm món ăn..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-lg focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all"
                                />
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl">
                                    🔍
                                </span>
                            </div>
                        </div>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-6 py-4 border-2 border-gray-200 rounded-xl text-lg font-semibold focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all"
                        >
                            <option value="">📂 Tất cả danh mục</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        <div className="flex gap-2 bg-gray-100 p-2 rounded-xl">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-6 py-3 rounded-lg font-semibold transition-all ${viewMode === 'grid'
                                    ? 'bg-red-600 text-white shadow-lg'
                                    : 'text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                🎨 Lưới
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-6 py-3 rounded-lg font-semibold transition-all ${viewMode === 'table'
                                    ? 'bg-red-600 text-white shadow-lg'
                                    : 'text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                📋 Bảng
                            </button>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-t border-gray-100 pt-4">
                        <div className="text-sm text-gray-600">
                            Nhập số lượng tồn kho mong muốn và nhấn nút để áp dụng cho tất cả món ăn đang hiển thị (sau khi lọc).
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={bulkStockValue}
                                onChange={(e) => setBulkStockValue(e.target.value)}
                                placeholder="VD: 100"
                                className="w-full sm:w-40 px-4 py-2 border-2 border-gray-200 rounded-xl text-base font-semibold focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all"
                            />
                            <button
                                type="button"
                                onClick={handleBulkStockUpdate}
                                disabled={bulkUpdatingItems}
                                className="px-5 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {bulkUpdatingItems ? 'Đang cập nhật...' : 'Áp dụng tồn kho'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Grid View */}
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredItems.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 overflow-hidden"
                            >
                                {/* Image */}
                                <div className="relative h-48 bg-gradient-to-br from-red-100 to-yellow-100">
                                    {item.image_url ? (
                                        <img
                                            src={item.image_url}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-6xl">🍔</span>
                                        </div>
                                    )}
                                    {!item.is_available && (
                                        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                                            <span className="bg-red-600 text-white px-4 py-2 rounded-full font-bold">
                                                HẾT HÀNG
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
                                                {item.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full inline-block">
                                                {getCategoryName(item)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-2xl font-black text-red-600 mb-4">
                                        {item.price.toLocaleString('vi-VN')} ₫
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Kho: {Number.isFinite(Number(item.stock)) ? item.stock : 0} phần
                                    </p>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                                        >
                                            ✏️ Sửa
                                        </button>
                                        <button
                                            onClick={() => handleToggleAvailability(item)}
                                            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${item.is_available
                                                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                                : 'bg-green-500 hover:bg-green-600 text-white'
                                                }`}
                                        >
                                            {item.is_available ? '🚫 Ẩn' : '✅ Hiện'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item)}
                                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Table View */
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Ảnh</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Tên món</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Danh mục</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Giá</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Kho</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Trạng thái</th>
                                        <th className="px-6 py-4 text-center text-sm font-bold uppercase">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-red-50 transition-colors">
                                            <td className="px-6 py-4">
                                                {item.image_url ? (
                                                    <img
                                                        src={item.image_url}
                                                        alt={item.name}
                                                        className="h-16 w-16 rounded-xl object-cover shadow-md"
                                                    />
                                                ) : (
                                                    <div className="h-16 w-16 bg-gradient-to-br from-red-100 to-yellow-100 rounded-xl flex items-center justify-center text-3xl">
                                                        🍔
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 text-lg">{item.name}</div>
                                                <div className="text-sm text-gray-500">#{item.id} · {item.slug}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
                                                    {getCategoryName(item)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xl font-black text-red-600">
                                                    {item.price.toLocaleString('vi-VN')} ₫
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-semibold text-gray-700">
                                                    {Number.isFinite(Number(item.stock)) ? item.stock : 0} phần
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-4 py-2 rounded-full text-sm font-bold ${item.is_available
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}
                                                >
                                                    {item.is_available ? '✅ Còn hàng' : '🚫 Hết hàng'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                                                    >
                                                        ✏️ Sửa
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleAvailability(item)}
                                                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${item.is_available
                                                            ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                                            : 'bg-green-500 hover:bg-green-600 text-white'
                                                            }`}
                                                    >
                                                        {item.is_available ? '🚫' : '✅'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item)}
                                                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {filteredItems.length === 0 && (
                            <div className="text-center py-16">
                                <div className="text-6xl mb-4">🍕</div>
                                <p className="text-xl text-gray-500 font-semibold">Không tìm thấy món ăn nào</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="mt-8 flex justify-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 rounded-lg border border-red-200 text-red-600 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-50"
                        >
                            Trước
                        </button>
                        <span className="px-4 py-2 font-bold text-gray-700">
                            Trang {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 rounded-lg border border-red-200 text-red-600 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-50"
                        >
                            Sau
                        </button>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showModal && (
                <ItemFormModal
                    item={selectedItem}
                    categories={categories}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                />
            )}

            {showDeleteModal && (
                <DeleteConfirmModal
                    title="Xóa món ăn"
                    message={`Bạn có chắc chắn muốn xóa món "${selectedItem?.name}"?`}
                    onConfirm={confirmDelete}
                    onCancel={() => setShowDeleteModal(false)}
                />
            )}
        </div>
    )
}
