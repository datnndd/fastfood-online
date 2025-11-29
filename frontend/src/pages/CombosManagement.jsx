import { useState, useEffect, useCallback } from 'react'
import { CatalogAPI } from '../lib/api'
import ComboFormModal from '../components/ComboFormModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import DashboardBackButton from '../components/DashboardBackButton'

export default function CombosManagement() {
    const [combos, setCombos] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedCombo, setSelectedCombo] = useState(null)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterCategory, setFilterCategory] = useState('')
    const [viewMode, setViewMode] = useState('grid')
    const [successMessage, setSuccessMessage] = useState(null)
    const [isFetchingComboDetail, setIsFetchingComboDetail] = useState(false)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const PAGE_SIZE = 10

    const loadCombos = useCallback(async () => {
        try {
            const params = {
                page,
                limit: PAGE_SIZE,
                search: searchTerm,
                category: filterCategory
            }
            const response = await CatalogAPI.listCombos(params)
            let data = []
            let count = 0

            if (Array.isArray(response.data)) {
                data = response.data
                count = data.length
            } else {
                data = response.data.results || []
                count = response.data.count || 0
            }

            setCombos(data)
            setTotalItems(count)
            setTotalPages(Math.ceil(count / PAGE_SIZE))
            setError(null)
        } catch (err) {
            console.error('Load combos error:', err.response || err)
            setError(`Không thể tải danh sách combo: ${err.response?.data?.detail || err.message}`)
            setCombos([])
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
        loadCombos()
    }, [loadCombos])

    // Reset page when filters change
    useEffect(() => {
        setPage(1)
    }, [searchTerm, filterCategory])

    const handleAdd = () => {
        setSelectedCombo(null)
        setShowModal(true)
    }

    const handleEdit = async (combo) => {
        setError(null)
        setIsFetchingComboDetail(true)
        try {
            const { data } = await CatalogAPI.getCombo(combo.id)
            setSelectedCombo(data)
            setShowModal(true)
        } catch (err) {
            console.error('Load combo detail error:', err.response || err)
            setError('Không thể tải dữ liệu combo để chỉnh sửa. Vui lòng thử lại.')
        } finally {
            setIsFetchingComboDetail(false)
        }
    }

    const handleDelete = (combo) => {
        setSelectedCombo(combo)
        setShowDeleteModal(true)
    }

    const confirmDelete = async () => {
        try {
            setError(null)
            await CatalogAPI.deleteCombo(selectedCombo.id)
            await loadCombos()
            setShowDeleteModal(false)
            setSelectedCombo(null)
        } catch (err) {
            console.error('Delete error:', err.response || err)
            let errorMessage = 'Không thể xóa combo'
            if (err.response?.status === 500) {
                errorMessage = 'Combo đang được sử dụng, không thể xóa.'
            } else if (err.response?.data?.detail) {
                errorMessage = `Không thể xóa: ${err.response.data.detail}`
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
        const wasEditing = Boolean(selectedCombo)
        setError(null)
        await loadCombos()
        setShowModal(false)
        setSelectedCombo(null)
        const message = wasEditing ? 'Đã cập nhật combo thành công!' : 'Đã thêm combo mới thành công!'
        setSuccessMessage(message)
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const handleToggleAvailability = async (combo) => {
        try {
            setError(null)
            await CatalogAPI.patchCombo(combo.id, {
                is_available: !combo.is_available
            })
            await loadCombos()
        } catch (err) {
            console.error('Toggle availability error:', err)
            setError('Không thể cập nhật trạng thái combo')
        }
    }

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value)
    }

    // Client-side filtering removed in favor of server-side filtering
    const filteredCombos = combos



    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 flex justify-center items-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600"></div>
                    <p className="mt-6 text-xl font-bold text-gray-700">Đang tải combo...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white shadow-2xl">
                <div className="container mx-auto px-4 py-8 space-y-4">
                    <DashboardBackButton className="bg-white/10 text-white hover:bg-white hover:text-purple-600 border-transparent" />
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-black tracking-tight mb-2">
                                🎁 QUẢN LÝ COMBO
                            </h1>
                            <p className="text-purple-100 text-lg">
                                Tổng cộng: <span className="font-bold text-white">{totalItems}</span> combo
                            </p>
                        </div>
                        <button
                            onClick={handleAdd}
                            className="bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-200 flex items-center gap-2"
                        >
                            <span className="text-2xl">+</span>
                            Thêm combo mới
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Error & status alerts */}
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
                            <span className="text-2xl">🎉</span>
                            <p className="font-semibold">{successMessage}</p>
                        </div>
                    </div>
                )}
                {isFetchingComboDetail && (
                    <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 text-blue-900 px-6 py-4 rounded-lg shadow-lg">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">⏳</span>
                            <p className="font-semibold">Đang tải dữ liệu combo để chỉnh sửa...</p>
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
                                    placeholder="🔍 Tìm kiếm combo..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
                                />
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl">
                                    🔍
                                </span>
                            </div>
                        </div>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-6 py-4 border-2 border-gray-200 rounded-xl text-lg font-semibold focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
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
                                    ? 'bg-purple-600 text-white shadow-lg'
                                    : 'text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                🎨 Lưới
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-6 py-3 rounded-lg font-semibold transition-all ${viewMode === 'table'
                                    ? 'bg-purple-600 text-white shadow-lg'
                                    : 'text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                📋 Bảng
                            </button>
                        </div>
                    </div>

                </div>

                {/* Grid View */}
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCombos.map((combo) => (
                            <div
                                key={combo.id}
                                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 overflow-hidden"
                            >
                                {/* Image */}
                                <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100">
                                    {combo.image_url ? (
                                        <img
                                            src={combo.image_url}
                                            alt={combo.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-6xl">🎁</span>
                                        </div>
                                    )}
                                    {!combo.is_available && (
                                        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                                            <span className="bg-red-600 text-white px-4 py-2 rounded-full font-bold">
                                                HẾT HÀNG
                                            </span>
                                        </div>
                                    )}
                                    {combo.discount_percentage > 0 && (
                                        <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                                            -{combo.discount_percentage}%
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">
                                                {combo.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full inline-block">
                                                {combo.category || 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Giá gốc:</span>
                                            <span className="text-sm text-gray-400 line-through">
                                                {formatCurrency(combo.original_price)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-semibold text-gray-700">Giá combo:</span>
                                            <span className="text-2xl font-black text-purple-600">
                                                {formatCurrency(combo.final_price)}
                                            </span>
                                        </div>
                                        <div className="text-xs text-green-600 font-semibold text-right">
                                            Tiết kiệm: {formatCurrency(combo.original_price - combo.final_price)}
                                        </div>
                                        <div className="text-sm text-gray-600 text-right">
                                            Kho: {Number.isFinite(Number(combo.stock)) ? combo.stock : 0} suất
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(combo)}
                                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                                        >
                                            ✏️ Sửa
                                        </button>
                                        <button
                                            onClick={() => handleToggleAvailability(combo)}
                                            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${combo.is_available
                                                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                                : 'bg-green-500 hover:bg-green-600 text-white'
                                                }`}
                                        >
                                            {combo.is_available ? '🚫 Ẩn' : '✅ Hiện'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(combo)}
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
                                <thead className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Ảnh</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Tên combo</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Danh mục</th>
                                        <th className="px-6 py-4 text-right text-sm font-bold uppercase">Giảm giá</th>
                                        <th className="px-6 py-4 text-right text-sm font-bold uppercase">Giá gốc</th>
                                        <th className="px-6 py-4 text-right text-sm font-bold uppercase">Giá combo</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Kho</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase">Trạng thái</th>
                                        <th className="px-6 py-4 text-center text-sm font-bold uppercase">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredCombos.map((combo) => (
                                        <tr key={combo.id} className="hover:bg-purple-50 transition-colors">
                                            <td className="px-6 py-4">
                                                {combo.image_url ? (
                                                    <img
                                                        src={combo.image_url}
                                                        alt={combo.name}
                                                        className="h-16 w-16 rounded-xl object-cover shadow-md"
                                                    />
                                                ) : (
                                                    <div className="h-16 w-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center text-3xl">
                                                        🎁
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900 text-lg">{combo.name}</div>
                                                <div className="text-sm text-gray-500">#{combo.id} · {combo.slug}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
                                                    {combo.category || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold">
                                                    -{combo.discount_percentage}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-gray-400 line-through">
                                                    {formatCurrency(combo.original_price)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-xl font-black text-purple-600">
                                                    {formatCurrency(combo.final_price)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-semibold text-gray-700">
                                                    {Number.isFinite(Number(combo.stock)) ? combo.stock : 0} suất
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-4 py-2 rounded-full text-sm font-bold ${combo.is_available
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}
                                                >
                                                    {combo.is_available ? '✅ Còn hàng' : '🚫 Hết hàng'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(combo)}
                                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                                                    >
                                                        ✏️ Sửa
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleAvailability(combo)}
                                                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${combo.is_available
                                                            ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                                            : 'bg-green-500 hover:bg-green-600 text-white'
                                                            }`}
                                                    >
                                                        {combo.is_available ? '🚫' : '✅'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(combo)}
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

                        {filteredCombos.length === 0 && (
                            <div className="text-center py-16">
                                <div className="text-6xl mb-4">🎁</div>
                                <p className="text-xl text-gray-500 font-semibold">Không tìm thấy combo nào</p>
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
                            className="px-4 py-2 rounded-lg border border-purple-200 text-purple-600 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-50"
                        >
                            Trước
                        </button>
                        <span className="px-4 py-2 font-bold text-gray-700">
                            Trang {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 rounded-lg border border-purple-200 text-purple-600 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-50"
                        >
                            Sau
                        </button>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showModal && (
                <ComboFormModal
                    combo={selectedCombo}
                    categories={categories}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                />
            )}

            {showDeleteModal && (
                <DeleteConfirmModal
                    title="Xóa combo"
                    message={`Bạn có chắc chắn muốn xóa combo "${selectedCombo?.name}"?`}
                    onConfirm={confirmDelete}
                    onCancel={() => setShowDeleteModal(false)}
                />
            )}
        </div>
    )
}
