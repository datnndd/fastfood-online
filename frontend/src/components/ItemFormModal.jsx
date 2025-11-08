import { useState, useEffect } from 'react'
import { CatalogAPI } from '../lib/api'

export default function ItemFormModal({ item, categories, onClose, onSave }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        price: '',
        stock: '',
        is_available: true,
        option_groups: []
    })
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (item) {
            setFormData({
                name: item.name || '',
                description: item.description || '',
                category: item.category_id || item.category || '',
                price: item.price || '',
                stock: item.stock ?? '',
                is_available: item.is_available ?? true,
                option_groups: item.option_groups?.map(group => ({
                    id: group.id,
                    name: group.name,
                    required: group.required,
                    min_select: group.min_select,
                    max_select: group.max_select,
                    options: group.options?.map(opt => ({
                        id: opt.id,
                        name: opt.name,
                        price_delta: opt.price_delta
                    })) || []
                })) || []
            })
            setImagePreview(item.image_url)
        }
    }, [item])

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        let newValue = type === 'checkbox' ? checked : value

        // Validate price: max 8 chữ số trước dấu thập phân
        if (name === 'price') {
            const numValue = parseFloat(value)
            if (numValue >= 100000000) {
                setError('Giá không được vượt quá 99,999,999 VNĐ')
                return
            }
        }
        if (name === 'stock') {
            if (value === '') {
                newValue = ''
            } else {
                const parsed = parseInt(value, 10)
                if (Number.isNaN(parsed) || parsed < 0) {
                    return
                }
                newValue = parsed
            }
        }

        setFormData((prev) => ({
            ...prev,
            [name]: newValue
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

    const handleAddOptionGroup = () => {
        setFormData(prev => ({
            ...prev,
            option_groups: [...prev.option_groups, {
                name: '',
                required: false,
                min_select: 0,
                max_select: 1,
                options: []
            }]
        }))
    }

    const handleRemoveOptionGroup = (groupIndex) => {
        setFormData(prev => ({
            ...prev,
            option_groups: prev.option_groups.filter((_, i) => i !== groupIndex)
        }))
    }

    const handleOptionGroupChange = (groupIndex, field, value) => {
        setFormData(prev => ({
            ...prev,
            option_groups: prev.option_groups.map((group, i) =>
                i === groupIndex ? { ...group, [field]: value } : group
            )
        }))
    }

    const handleAddOption = (groupIndex) => {
        setFormData(prev => ({
            ...prev,
            option_groups: prev.option_groups.map((group, i) =>
                i === groupIndex
                    ? {
                        ...group,
                        options: [...group.options, { name: '', price_delta: 0 }]
                    }
                    : group
            )
        }))
    }

    const handleRemoveOption = (groupIndex, optionIndex) => {
        setFormData(prev => ({
            ...prev,
            option_groups: prev.option_groups.map((group, i) =>
                i === groupIndex
                    ? {
                        ...group,
                        options: group.options.filter((_, j) => j !== optionIndex)
                    }
                    : group
            )
        }))
    }

    const handleOptionChange = (groupIndex, optionIndex, field, value) => {
        setFormData(prev => ({
            ...prev,
            option_groups: prev.option_groups.map((group, i) =>
                i === groupIndex
                    ? {
                        ...group,
                        options: group.options.map((opt, j) =>
                            j === optionIndex ? { ...opt, [field]: value } : opt
                        )
                    }
                    : group
            )
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // Validate dữ liệu trước khi gửi
            if (!formData.name.trim()) {
                throw new Error('Tên món ăn không được để trống')
            }
            if (!formData.category) {
                throw new Error('Vui lòng chọn danh mục')
            }
            if (!formData.price || formData.price <= 0) {
                throw new Error('Giá phải lớn hơn 0')
            }
            if (parseFloat(formData.price) >= 100000000) {
                throw new Error('Giá không được vượt quá 99,999,999 VNĐ')
            }

            const dataToSubmit = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                category: parseInt(formData.category),
                price: parseFloat(formData.price),
                stock: formData.stock === '' ? 0 : parseInt(formData.stock, 10),
                is_available: formData.is_available,
                option_groups: formData.option_groups.map(group => ({
                    name: group.name.trim(),
                    required: group.required,
                    min_select: parseInt(group.min_select),
                    max_select: parseInt(group.max_select),
                    options: group.options.map(opt => ({
                        name: opt.name.trim(),
                        price_delta: parseFloat(opt.price_delta)
                    }))
                }))
            }

            console.log('Submitting data:', dataToSubmit)

            let response
            if (item) {
                response = await CatalogAPI.updateItem(item.id, dataToSubmit)
            } else {
                response = await CatalogAPI.createItem(dataToSubmit)
            }

            if (imageFile && response.data.id) {
                await CatalogAPI.uploadItemImage(response.data.id, imageFile)
            }

            onSave()
        } catch (err) {
            console.error('Submit error:', err.response?.data || err)

            // Xử lý lỗi validation từ backend
            if (err.response?.data) {
                const errors = err.response.data
                const errorMessages = []

                if (errors.category_id) {
                    errorMessages.push(`Danh mục: ${Array.isArray(errors.category_id) ? errors.category_id.join(', ') : errors.category_id}`)
                }
                if (errors.price) {
                    errorMessages.push(`Giá: ${Array.isArray(errors.price) ? errors.price.join(', ') : errors.price}`)
                }
                if (errors.name) {
                    errorMessages.push(`Tên: ${Array.isArray(errors.name) ? errors.name.join(', ') : errors.name}`)
                }
                if (errors.detail) {
                    errorMessages.push(errors.detail)
                }
                if (errors.message) {
                    errorMessages.push(errors.message)
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
            <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl transform animate-slideUp">
                {/* Header với gradient */}
                <div className="bg-gradient-to-r from-red-600 to-orange-600 px-8 py-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
                    <div className="relative flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-black text-white mb-1">
                                {item ? '✏️ CHỈNH SỬA MÓN ĂN' : '➕ THÊM MÓN MỚI'}
                            </h2>
                            <p className="text-red-100 text-sm">
                                {item ? 'Cập nhật thông tin món ăn' : 'Tạo món ăn mới cho menu'}
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
                    <div className="mx-8 mt-6 bg-red-50 border-l-4 border-red-600 px-6 py-4 rounded-xl flex items-start gap-3 animate-shake">
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
                        {/* Image Upload Section */}
                        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 border-2 border-dashed border-red-200">
                            <label className="block text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="text-2xl">📸</span>
                                Hình ảnh món ăn
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
                                            <span className="text-6xl">🍔</span>
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
                                        className="cursor-pointer inline-flex items-center gap-2 bg-white border-2 border-red-300 text-red-600 px-6 py-3 rounded-xl font-bold hover:bg-red-50 transition-all duration-200 hover:scale-105 transform"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {imagePreview ? 'Đổi ảnh' : 'Chọn ảnh'}
                                    </label>
                                    <p className="text-sm text-gray-600 mt-3">
                                        💡 Khuyến nghị: Ảnh vuông, kích thước tối thiểu 500x500px
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Name Field */}
                        <div>
                            <label className="block text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="text-2xl">🍕</span>
                                Tên món ăn *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="VD: Burger phô mai đặc biệt"
                                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-lg focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="text-2xl">📝</span>
                                Mô tả món ăn
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                                placeholder="Mô tả chi tiết về món ăn..."
                                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-lg focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all resize-none"
                            />
                        </div>

                        {/* Category & Price Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-lg font-semibold focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all"
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
                                    Giá tiền *
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        required
                                        min="0"
                                        max="99999999"
                                        step="1000"
                                        placeholder="50000"
                                        className="w-full px-5 py-4 pr-16 border-2 border-gray-200 rounded-xl text-lg font-bold text-red-600 focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all"
                                    />
                                    <span className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold">
                                        VNĐ
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">
                                    💡 Tối đa: 99,999,999 VNĐ
                                </p>
                            </div>

                            <div>
                                <label className="block text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <span className="text-2xl">📦</span>
                                    Tồn kho *
                                </label>
                                <input
                                    type="number"
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    step="1"
                                    placeholder="100"
                                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-lg font-semibold focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all"
                                />
                                <p className="text-sm text-gray-500 mt-2">🧮 Nhập số lượng hiện có trong kho.</p>
                            </div>
                        </div>

                        {/* Availability Toggle */}
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
                                        {formData.is_available ? 'Món ăn còn hàng' : 'Món ăn hết hàng'}
                                    </span>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {formData.is_available
                                            ? 'Khách hàng có thể đặt món này'
                                            : 'Món này sẽ không hiển thị trên menu'}
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Option Groups Section */}
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <span className="text-2xl">🎨</span>
                                    Nhóm tùy chọn (Options)
                                </label>
                                <button
                                    type="button"
                                    onClick={handleAddOptionGroup}
                                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2"
                                >
                                    <span className="text-xl">+</span>
                                    Thêm nhóm
                                </button>
                            </div>

                            {formData.option_groups.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">
                                    Chưa có nhóm tùy chọn. Nhấn "Thêm nhóm" để bắt đầu.
                                </p>
                            ) : (
                                <div className="space-y-6">
                                    {formData.option_groups.map((group, groupIndex) => (
                                        <div key={groupIndex} className="bg-white rounded-xl p-5 border-2 border-purple-200">
                                            {/* Group Header */}
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-lg font-bold text-purple-900">
                                                    Nhóm #{groupIndex + 1}
                                                </h4>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveOptionGroup(groupIndex)}
                                                    className="text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg font-semibold transition-all"
                                                >
                                                    🗑️ Xóa nhóm
                                                </button>
                                            </div>

                                            {/* Group Fields */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Tên nhóm *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={group.name}
                                                        onChange={(e) => handleOptionGroupChange(groupIndex, 'name', e.target.value)}
                                                        required
                                                        placeholder="VD: Chọn size, Topping thêm..."
                                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                                    />
                                                </div>

                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={group.required}
                                                        onChange={(e) => handleOptionGroupChange(groupIndex, 'required', e.target.checked)}
                                                        className="w-5 h-5 text-purple-600 rounded"
                                                    />
                                                    <label className="ml-3 text-sm font-semibold text-gray-700">
                                                        Bắt buộc chọn
                                                    </label>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Số lượng tối thiểu
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={group.min_select}
                                                        onChange={(e) => handleOptionGroupChange(groupIndex, 'min_select', e.target.value)}
                                                        min="0"
                                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                        Số lượng tối đa
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={group.max_select}
                                                        onChange={(e) => handleOptionGroupChange(groupIndex, 'max_select', e.target.value)}
                                                        min="1"
                                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                                    />
                                                </div>
                                            </div>

                                            {/* Options */}
                                            <div className="border-t-2 border-purple-100 pt-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <label className="text-sm font-bold text-gray-700">
                                                        Các tùy chọn
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddOption(groupIndex)}
                                                        className="text-purple-600 hover:bg-purple-50 px-3 py-1 rounded-lg font-semibold transition-all text-sm"
                                                    >
                                                        + Thêm tùy chọn
                                                    </button>
                                                </div>

                                                {group.options.length === 0 ? (
                                                    <p className="text-center text-gray-400 py-4 text-sm">
                                                        Chưa có tùy chọn
                                                    </p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {group.options.map((option, optionIndex) => (
                                                            <div key={optionIndex} className="flex gap-2 items-start">
                                                                <div className="flex-1">
                                                                    <input
                                                                        type="text"
                                                                        value={option.name}
                                                                        onChange={(e) => handleOptionChange(groupIndex, optionIndex, 'name', e.target.value)}
                                                                        required
                                                                        placeholder="Tên tùy chọn"
                                                                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 text-sm"
                                                                    />
                                                                </div>
                                                                <div className="w-32">
                                                                    <input
                                                                        type="number"
                                                                        value={option.price_delta}
                                                                        onChange={(e) => handleOptionChange(groupIndex, optionIndex, 'price_delta', e.target.value)}
                                                                        placeholder="Giá thêm"
                                                                        step="1000"
                                                                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 text-sm"
                                                                    />
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveOption(groupIndex, optionIndex)}
                                                                    className="text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-all"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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
                            className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-bold hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-105 transform"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <span>💾</span>
                                    {item ? 'Cập nhật món' : 'Thêm món mới'}
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
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                .animate-slideUp {
                    animation: slideUp 0.4s ease-out;
                }
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    )
}
