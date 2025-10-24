import { useEffect, useState } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import AdminProtected from '../../components/AdminProtected'
import AdminLayout from '../../components/AdminLayout'
import { AdminAPI } from '../../lib/adminApi'

const PLACEHOLDER_IMG = 'https://via.placeholder.com/150'

const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString('vi-VN')
}

const EMPTY_PRODUCT_FORM = {
    name: '',
    description: '',
    price: '',
    category: '',
    image: null,
    is_available: true
}

export default function ProductsPage() {
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')

    // Modal states
    const [showModal, setShowModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM)
    const [formErrors, setFormErrors] = useState({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadProducts()
        loadCategories()
    }, [])

    const loadProducts = async () => {
        setLoading(true)
        try {
            const response = await AdminAPI.menuItems.list()
            setProducts(response.data?.results || response.data || [])
        } catch (error) {
            console.error('Failed to load products:', error)
            alert('Không thể tải danh sách sản phẩm')
        } finally {
            setLoading(false)
        }
    }

    const loadCategories = async () => {
        try {
            const response = await AdminAPI.categories.list()
            setCategories(response.data?.results || response.data || [])
        } catch (error) {
            console.error('Failed to load categories:', error)
        }
    }

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = !selectedCategory || product.category?.toString() === selectedCategory
        return matchesSearch && matchesCategory
    })

    const handleToggleAvailability = async (productId) => {
        try {
            const product = products.find(p => p.id === productId)
            await AdminAPI.menuItems.update(productId, {
                is_available: !product.is_available
            })
            await loadProducts()
        } catch (error) {
            console.error('Failed to toggle availability:', error)
            alert('Không thể cập nhật trạng thái sản phẩm')
        }
    }

    const handleDeleteProduct = async (productId) => {
        if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return

        try {
            await AdminAPI.menuItems.delete(productId)
            await loadProducts()
            alert('Đã xóa sản phẩm thành công')
        } catch (error) {
            console.error('Failed to delete product:', error)
            alert('Không thể xóa sản phẩm')
        }
    }

    const openCreateModal = () => {
        setEditingProduct(null)
        setProductForm(EMPTY_PRODUCT_FORM)
        setFormErrors({})
        setShowModal(true)
    }

    const openEditModal = (product) => {
        setEditingProduct(product)
        setProductForm({
            name: product.name || '',
            description: product.description || '',
            price: product.price || '',
            category: product.category?.id || product.category || '',
            image: null,
            is_available: product.is_available
        })
        setFormErrors({})
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingProduct(null)
        setProductForm(EMPTY_PRODUCT_FORM)
        setFormErrors({})
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setFormErrors({})
        setSaving(true)

        try {
            const formData = {
                name: productForm.name.trim(),
                description: productForm.description.trim(),
                price: parseFloat(productForm.price),
                category: parseInt(productForm.category),
                is_available: productForm.is_available
            }

            if (productForm.image) {
                formData.image = productForm.image
            }

            if (editingProduct) {
                await AdminAPI.menuItems.update(editingProduct.id, formData)
                alert('Cập nhật sản phẩm thành công')
            } else {
                await AdminAPI.menuItems.create(formData)
                alert('Tạo sản phẩm mới thành công')
            }

            closeModal()
            await loadProducts()
        } catch (error) {
            console.error('Failed to save product:', error)
            const errorData = error.response?.data
            if (errorData && typeof errorData === 'object') {
                setFormErrors(errorData)
            } else {
                alert('Có lỗi xảy ra khi lưu sản phẩm')
            }
        } finally {
            setSaving(false)
        }
    }

    const renderFieldErrors = (field) => {
        const fieldError = formErrors?.[field]
        if (!fieldError) return null
        const list = Array.isArray(fieldError) ? fieldError : [fieldError]
        return (
            <ul className="mt-1 space-y-1 text-xs text-red-600">
                {list.map((message, index) => (
                    <li key={index}>{message}</li>
                ))}
            </ul>
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
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h1>
                            <p className="text-gray-600">Danh sách tất cả sản phẩm trong hệ thống</p>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center transition-colors"
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Thêm sản phẩm
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tìm kiếm
                                </label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Tên sản phẩm..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Danh mục
                                </label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                >
                                    <option value="">Tất cả danh mục</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProducts.map((product) => (
                            <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <img
                                    src={product.image_url || PLACEHOLDER_IMG}
                                    alt={product.name}
                                    className="w-full h-48 object-cover"
                                />
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900 truncate">{product.name}</h3>
                                        <span className={`px-2 py-1 text-xs rounded-full ${product.is_available
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {product.is_available ? 'Có sẵn' : 'Hết hàng'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                        {typeof product.category === 'object' ? product.category?.name : 'Chưa phân loại'}
                                    </p>
                                    <p className="text-lg font-bold text-red-600 mb-3">
                                        {formatCurrency(product.price)}₫
                                    </p>
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                        {product.description}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={() => handleToggleAvailability(product.id)}
                                            className={`px-3 py-1 text-sm rounded transition-colors ${product.is_available
                                                ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                                                }`}
                                        >
                                            {product.is_available ? 'Ẩn' : 'Hiện'}
                                        </button>

                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => openEditModal(product)}
                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                            >
                                                <PencilIcon className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProduct(product.id)}
                                                className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredProducts.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Không tìm thấy sản phẩm nào.</p>
                        </div>
                    )}
                </div>

                {/* Product Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
                                </h3>
                                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {formErrors.non_field_errors && (
                                    <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                                        {formErrors.non_field_errors}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tên sản phẩm *
                                    </label>
                                    <input
                                        type="text"
                                        value={productForm.name}
                                        onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        required
                                    />
                                    {renderFieldErrors('name')}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mô tả
                                    </label>
                                    <textarea
                                        value={productForm.description}
                                        onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        rows={3}
                                    />
                                    {renderFieldErrors('description')}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Giá *
                                    </label>
                                    <input
                                        type="number"
                                        value={productForm.price}
                                        onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        min="0"
                                        step="1000"
                                        required
                                    />
                                    {renderFieldErrors('price')}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Danh mục *
                                    </label>
                                    <select
                                        value={productForm.category}
                                        onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        required
                                    >
                                        <option value="">Chọn danh mục</option>
                                        {categories.map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                    {renderFieldErrors('category')}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Hình ảnh
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.files[0] }))}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    />
                                    {renderFieldErrors('image')}
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={productForm.is_available}
                                        onChange={(e) => setProductForm(prev => ({ ...prev, is_available: e.target.checked }))}
                                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                    />
                                    <label className="ml-2 block text-sm text-gray-900">
                                        Sản phẩm có sẵn
                                    </label>
                                </div>

                                <div className="flex justify-end space-x-2 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
                                        disabled={saving}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                                        disabled={saving}
                                    >
                                        {saving ? 'Đang lưu...' : (editingProduct ? 'Cập nhật' : 'Tạo mới')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </AdminLayout>
        </AdminProtected>
    )
}
