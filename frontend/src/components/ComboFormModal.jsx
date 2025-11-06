import { useState, useEffect } from 'react'
import { CatalogAPI } from '../lib/api'

export default function ComboFormModal({ combo, categories, onClose, onSave }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        discount_percentage: 0,
        is_available: true,
        items: []
    })
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [menuItems, setMenuItems] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        loadMenuItems()
        if (combo) {
            setFormData({
                name: combo.name || '',
                description: combo.description || '',
                category: combo.category_id || '',
                discount_percentage: combo.discount_percentage || 0,
                is_available: combo.is_available ?? true,
                items: combo.items?.map(item => ({
                    menu_item_id: item.menu_item?.id,
                    quantity: item.quantity,
                    option_ids: []
                })) || []
            })
            setImagePreview(combo.image_url)
        }
    }, [combo])

    const loadMenuItems = async () => {
        try {
            const response = await CatalogAPI.listItems()
            const data = response.data.results || response.data
            setMenuItems(Array.isArray(data) ? data : [])
        } catch (err) {
            console.error('Load menu items error:', err)
        }
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { menu_item_id: '', quantity: 1, option_ids: [] }]
        }))
    }

    const handleRemoveItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }))
    }

    const handleItemChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (!formData.name.trim()) {
                throw new Error('Tên combo không được để trống')
            }
            if (!formData.category) {
                throw new Error('Vui lòng chọn danh mục')
            }
            if (formData.items.length === 0) {
                throw new Error('Combo phải có ít nhất 1 món')
            }

            const dataToSubmit = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                category_id: parseInt(formData.category),
                discount_percentage: parseFloat(formData.discount_percentage),
                is_available: formData.is_available,
                items: formData.items.map(item => ({
                    menu_item_id: parseInt(item.menu_item_id),
                    quantity: parseInt(item.quantity),
                    option_ids: []
                }))
            }

            console.log('Submitting combo data:', dataToSubmit)

            let response
            if (combo) {
                response = await CatalogAPI.updateCombo(combo.id, dataToSubmit)
            } else {
                response = await CatalogAPI.createCombo(dataToSubmit)
            }

            // Upload ảnh nếu có
            if (imageFile && response.data.id) {
                await CatalogAPI.uploadComboImage(response.data.id, imageFile)
            }

            onSave()
        } catch (err) {
            console.error('Submit error:', err.response?.data || err)

            if (err.response?.data) {
                const errors = err.response.data
                const errorMessages = []

                if (errors.name) {
                    errorMessages.push(`Tên: ${Array.isArray(errors.name) ? errors.name.join(', ') : errors.name}`)
                }
                if (errors.category_id) {
                    errorMessages.push(`Danh mục: ${Array.isArray(errors.category_id) ? errors.category_id.join(', ') : errors.category_id}`)
                }
                if (errors.discount_percentage) {
                    errorMessages.push(`Giảm giá: ${Array.isArray(errors.discount_percentage) ? errors.discount_percentage.join(', ') : errors.discount_percentage}`)
                }
                if (errors.items) {
                    errorMessages.push(`Món ăn: ${Array.isArray(errors.items) ? errors.items.join(', ') : errors.items}`)
                }
                if (errors.detail) {
                    errorMessages.push(errors.detail)
                }

                setError(errorMessages.length > 0 ? errorMessages.join('. ') : 'Có lỗi xảy ra')
            } else {
                setError(err.message || 'Có lỗi xảy ra')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl transform animate-slideUp">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-black text-white mb-1">
                                {combo ? '✏️ CHỈNH SỬA COMBO' : '➕ THÊM COMBO MỚI'}
                            </h2>
                            <p className="text-purple-100 text-sm">
                                {combo ? 'Cập nhật thông tin combo' : 'Tạo combo mới cho menu'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-3 transition-all duration-200 transform hover:rotate-90"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mx-8 mt-6 bg-red-50 border-l-4 border-red-600 px-6 py-4 rounded-xl flex items-start gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <p className="font-bold text-red-800 mb-1">Có lỗi xảy ra!</p>
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(95vh-180px)]">
                    <div className="px-8 py-6 space-y-6">
                        {/* Image Upload */}
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-dashed border-purple-200">
                            <label className="block text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="text-2xl">📸</span>
                                Hình ảnh combo
                            </label>
                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                <div className="flex-shrink-0">
                                    {imagePreview ? (
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-48 h-48 object-cover rounded-2xl shadow-lg ring-4 ring-white"
                                        />
                                    ) : (
                                        <div className="w-48 h-48 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center">
                                            <span className="text-6xl">🎁</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                        id="image-upload"
                                    />
                                    <label
                                        htmlFor="image-upload"
                                        className="cursor-pointer inline-flex items-center gap-2 bg-white border-2 border-purple-300 text-purple-600 px-6 py-3 rounded-xl font-bold hover:bg-purple-50 transition-all duration-200 hover:scale-105 transform"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {imagePreview ? 'Đổi ảnh' : 'Chọn ảnh'}
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Name & Description */}
                        <div>
                            <label className="block text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="text-2xl">🎁</span>
                                Tên combo *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="VD: Combo Gia Đình"
                                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="text-2xl">📝</span>
                                Mô tả combo
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Mô tả chi tiết về combo..."
                                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all resize-none"
                            />
                        </div>

                        {/* Category & Discount */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <span className="text-2xl">📂</span>
                                    Danh mục *
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-lg font-semibold focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
                                >
                                    <option value="">-- Chọn danh mục --</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <span className="text-2xl">💰</span>
                                    Giảm giá (%) *
                                </label>
                                <input
                                    type="number"
                                    name="discount_percentage"
                                    value={formData.discount_percentage}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    max="100"
                                    placeholder="10"
                                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-lg font-bold text-purple-600 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
                                />
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-orange-200">
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <span className="text-2xl">🍔</span>
                                    Món ăn trong combo *
                                </label>
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2"
                                >
                                    <span className="text-xl">+</span>
                                    Thêm món
                                </button>
                            </div>

                            {formData.items.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">
                                    Chưa có món nào. Nhấn "Thêm món" để bắt đầu.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {formData.items.map((item, index) => (
                                        <div key={index} className="bg-white rounded-xl p-4 flex gap-4 items-start">
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Món ăn
                                                    </label>
                                                    <select
                                                        value={item.menu_item_id}
                                                        onChange={(e) => handleItemChange(index, 'menu_item_id', e.target.value)}
                                                        required
                                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-semibold focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                                                    >
                                                        <option value="">-- Chọn món --</option>
                                                        {menuItems.map((menuItem) => (
                                                            <option key={menuItem.id} value={menuItem.id}>
                                                                {menuItem.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Số lượng
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                        required
                                                        min="1"
                                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-bold focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem(index)}
                                                className="mt-8 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-bold transition-all"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Availability */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                            <label className="flex items-center gap-4 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="is_available"
                                    checked={formData.is_available}
                                    onChange={handleChange}
                                    className="w-6 h-6 text-green-600 rounded focus:ring-green-500 focus:ring-offset-2"
                                />
                                <div>
                                    <span className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <span className="text-2xl">{formData.is_available ? '✅' : '🚫'}</span>
                                        {formData.is_available ? 'Combo còn hàng' : 'Combo hết hàng'}
                                    </span>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {formData.is_available
                                            ? 'Khách hàng có thể đặt combo này'
                                            : 'Combo sẽ không hiển thị trên menu'}
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-gray-50 px-8 py-6 flex flex-col sm:flex-row gap-4 justify-end border-t-2 border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-4 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-100 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <span>❌</span>
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-105 transform"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <span>💾</span>
                                    {combo ? 'Cập nhật combo' : 'Thêm combo mới'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                .animate-slideUp {
                    animation: slideUp 0.4s ease-out;
                }
            `}</style>
        </div>
    )
}
