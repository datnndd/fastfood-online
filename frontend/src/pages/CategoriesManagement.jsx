import { useState, useEffect, useCallback } from 'react'
import { CatalogAPI } from '../lib/api'
import CategoryFormModal from '../components/CategoryFormModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import DashboardBackButton from '../components/DashboardBackButton'

export default function CategoriesManagement() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const PAGE_SIZE = 12

    const loadCategories = useCallback(async () => {
        setLoading(true)
        try {
            const params = {
                page,
                limit: PAGE_SIZE,
                search: searchTerm
            }
            const response = await CatalogAPI.listCategories(params)
            const data = response.data.results || []
            const count = response.data.count || 0

            setCategories(data)
            setTotalItems(count)
            setTotalPages(Math.ceil(count / PAGE_SIZE))
            setError(null)
        } catch (err) {
            console.error('Load categories error:', err.response || err)
            setError(`Không thể tải danh sách danh mục: ${err.response?.data?.detail || err.message}`)
            setCategories([])
            setTotalItems(0)
            setTotalPages(1)
        } finally {
            setLoading(false)
        }
    }, [page, searchTerm])

    useEffect(() => {
        loadCategories()
    }, [loadCategories])

    // Reset page when search changes
    useEffect(() => {
        setPage(1)
    }, [searchTerm])

    const handleAdd = () => {
        setSelectedCategory(null)
        setShowModal(true)
    }

    const handleEdit = (category) => {
        setSelectedCategory(category)
        setShowModal(true)
    }

    const handleDelete = (category) => {
        setSelectedCategory(category)
        setShowDeleteModal(true)
    }

    const confirmDelete = async () => {
        try {
            setError(null)
            await CatalogAPI.deleteCategory(selectedCategory.id)
            await loadCategories()
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('categoriesUpdated'))
            }
            setShowDeleteModal(false)
            setSelectedCategory(null)
        } catch (err) {
            console.error('Delete error:', err.response || err)
            let errorMessage = 'Không thể xóa danh mục'
            if (err.response?.status === 500) {
                errorMessage = 'Danh mục có món ăn/combo, không thể xóa.'
            } else if (err.response?.data?.detail) {
                errorMessage = `Không thể xóa: ${err.response.data.detail}`
            }
            setError(errorMessage)
            setShowDeleteModal(false)
        }
    }

    const handleSave = async () => {
        setError(null)
        await loadCategories()
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('categoriesUpdated'))
        }
        setShowModal(false)
        setSelectedCategory(null)
    }

    // Client-side filtering removed in favor of server-side filtering
    const filteredCategories = categories

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 flex justify-center items-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
                    <p className="mt-6 text-xl font-bold text-gray-700">Đang tải danh mục...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white shadow-2xl">
                <div className="container mx-auto px-4 py-8 space-y-4">
                    <DashboardBackButton className="bg-white/10 text-white hover:bg-white hover:text-indigo-600 border-transparent" />
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-black tracking-tight mb-2">
                                📂 QUẢN LÝ DANH MỤC
                            </h1>
                            <p className="text-indigo-100 text-lg">
                                Tổng cộng: <span className="font-bold text-white">{totalItems}</span> danh mục
                            </p>
                        </div>
                        <button
                            onClick={handleAdd}
                            className="bg-white text-indigo-600 px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-200 flex items-center gap-2"
                        >
                            <span className="text-2xl">+</span>
                            Thêm danh mục
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

                {/* Search Bar */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Tìm kiếm danh mục..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                        />
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl">
                            🔍
                        </span>
                    </div>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredCategories.map((category) => (
                        <div
                            key={category.id}
                            className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 overflow-hidden"
                        >
                            {/* Image */}
                            <div className="relative h-48 bg-gradient-to-br from-indigo-100 to-blue-100">
                                {category.image_url ? (
                                    <img
                                        src={category.image_url}
                                        alt={category.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-6xl">📂</span>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                <div className="mb-4">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        {category.name}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        🔗 {category.slug}
                                    </p>
                                    <div className="mt-3 flex items-center gap-2">
                                        <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold">
                                            🍔 {category.items_count || 0} món
                                        </span>
                                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold">
                                            🎁 {category.combos_count || 0} combo
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(category)}
                                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                                    >
                                        ✏️ Sửa
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category)}
                                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredCategories.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-xl p-16 text-center">
                        <span className="text-8xl block mb-6">📂</span>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            {searchTerm ? 'Không tìm thấy danh mục nào' : 'Chưa có danh mục nào'}
                        </h3>
                        <p className="text-gray-600 text-lg">
                            {!searchTerm && 'Nhấn "Thêm danh mục" để bắt đầu'}
                        </p>
                    </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="mt-8 flex justify-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 rounded-lg border border-indigo-200 text-indigo-600 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-50"
                        >
                            Trước
                        </button>
                        <span className="px-4 py-2 font-bold text-gray-700">
                            Trang {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 rounded-lg border border-indigo-200 text-indigo-600 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-50"
                        >
                            Sau
                        </button>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showModal && (
                <CategoryFormModal
                    category={selectedCategory}
                    onClose={() => setShowModal(false)}
                    onSave={handleSave}
                />
            )}

            {showDeleteModal && (
                <DeleteConfirmModal
                    title="Xóa danh mục"
                    message={`Bạn có chắc chắn muốn xóa danh mục "${selectedCategory?.name}"? Tất cả món ăn và combo trong danh mục này sẽ không bị xóa nhưng sẽ không có danh mục.`}
                    onConfirm={confirmDelete}
                    onCancel={() => setShowDeleteModal(false)}
                />
            )}
        </div>
    )
}
