import { useState, useEffect, useMemo } from 'react'
import { CatalogAPI } from '../lib/api'
import MenuItemPicker from './MenuItemPicker'

const buildEmptyFormState = () => ({
    name: '',
    description: '',
    category: '',
    discount_percentage: 0,
    is_available: true,
    items: []
})

export default function ComboFormModal({ combo, categories, onClose, onSave }) {
    const [formData, setFormData] = useState(buildEmptyFormState)
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [menuItems, setMenuItems] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [showItemPicker, setShowItemPicker] = useState(false)
    const [validationErrors, setValidationErrors] = useState([])

    useEffect(() => {
        loadMenuItems()
    }, [])

    useEffect(() => {
        if (!combo) {
            setFormData(buildEmptyFormState())
            setImagePreview(null)
            setImageFile(null)
            return
        }

        setFormData({
            name: combo.name || '',
            description: combo.description || '',
            category: combo.category_id || combo.category?.id || '',
            discount_percentage: combo.discount_percentage ?? 0,
            is_available: combo.is_available ?? true,
            items:
                combo.items?.map((item) => ({
                    menu_item_id: item.menu_item?.id || item.menu_item_id || '',
                    quantity: item.quantity ?? 1,
                    option_ids:
                        item.selected_options?.map((opt) => opt.id) ||
                        item.option_ids ||
                        []
                })) || []
        })
        setImagePreview(combo.image_url || null)
        setImageFile(null)
    }, [combo])

    // Validate all item rules whenever items change
    useEffect(() => {
        const errors = validateItems(formData.items, menuItems)
        setValidationErrors(errors)
    }, [formData.items, menuItems])

    const loadMenuItems = async () => {
        try {
            const response = await CatalogAPI.listAllItems()
            const data = Array.isArray(response) ? response : (response.data?.results || response.data || [])
            setMenuItems(data)
        } catch (err) {
            console.error('Load menu items error:', err)
        }
    }

    // Validate all item rules: quantity vs stock AND option selection
    const validateItems = (items, menuItemsList) => {
        const errors = []
        items.forEach((item, index) => {
            const menuItem = menuItemsList.find(mi => mi.id === parseInt(item.menu_item_id))
            if (!menuItem) return

            const quantity = parseInt(item.quantity) || 0

            // 1. Validate quantity vs stock
            if (quantity > menuItem.stock) {
                errors.push({
                    type: 'stock',
                    itemIndex: index,
                    message: `Số lượng (${quantity}) vượt quá tồn kho (${menuItem.stock})`
                })
            }

            // 2. Validate option groups
            menuItem.option_groups?.forEach(group => {
                const selectedCount = group.options.filter(opt =>
                    item.option_ids?.includes(opt.id)
                ).length

                const minSelect = group.min_select || 0
                const maxSelect = group.max_select || group.options.length

                // Check minimum selection (only for required groups or if min_select > 0)
                if (group.required && selectedCount < Math.max(minSelect, 1)) {
                    errors.push({
                        type: 'option_min',
                        itemIndex: index,
                        groupId: group.id,
                        groupName: group.name,
                        message: `"${group.name}" cần chọn ít nhất ${Math.max(minSelect, 1)} tùy chọn`
                    })
                } else if (minSelect > 0 && selectedCount < minSelect) {
                    errors.push({
                        type: 'option_min',
                        itemIndex: index,
                        groupId: group.id,
                        groupName: group.name,
                        message: `"${group.name}" cần chọn ít nhất ${minSelect} tùy chọn`
                    })
                }

                // Check maximum selection
                if (selectedCount > maxSelect) {
                    errors.push({
                        type: 'option_max',
                        itemIndex: index,
                        groupId: group.id,
                        groupName: group.name,
                        message: `"${group.name}" chỉ được chọn tối đa ${maxSelect} tùy chọn (đang chọn ${selectedCount})`
                    })
                }
            })
        })
        return errors
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        let newValue = type === 'checkbox' ? checked : value

        setFormData(prev => ({
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

    const handleAddItemFromPicker = (menuItem) => {
        // Add the selected item to form
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, {
                menu_item_id: menuItem.id,
                quantity: 1,
                option_ids: []
            }]
        }))
        setShowItemPicker(false)
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
            items: prev.items.map((item, i) => {
                if (i !== index) return item

                // Reset option_ids khi đổi menu_item
                if (field === 'menu_item_id') {
                    return { ...item, [field]: value, option_ids: [] }
                }

                return { ...item, [field]: value }
            })
        }))
    }

    const handleOptionToggle = (itemIndex, optionId, group) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) => {
                if (i !== itemIndex) return item

                const optionIds = item.option_ids || []
                const isCurrentlySelected = optionIds.includes(optionId)

                // Get options that belong to this group
                const groupOptionIds = group.options.map(opt => opt.id)
                const selectedInGroup = optionIds.filter(id => groupOptionIds.includes(id))

                let newOptionIds

                if (isCurrentlySelected) {
                    // Remove the option
                    newOptionIds = optionIds.filter(id => id !== optionId)
                } else {
                    // Check if adding would exceed max_select
                    const maxSelect = group.max_select || group.options.length
                    if (selectedInGroup.length >= maxSelect) {
                        // Remove the first selected option from this group and add the new one
                        const firstSelectedInGroup = selectedInGroup[0]
                        newOptionIds = optionIds.filter(id => id !== firstSelectedInGroup)
                        newOptionIds.push(optionId)
                    } else {
                        newOptionIds = [...optionIds, optionId]
                    }
                }

                return { ...item, option_ids: newOptionIds }
            })
        }))
    }

    const getSelectedMenuItem = (itemIndex) => {
        const item = formData.items[itemIndex]
        if (!item.menu_item_id) return null
        return menuItems.find(mi => mi.id === parseInt(item.menu_item_id))
    }

    const getItemErrors = (itemIndex) => {
        return validationErrors.filter(err => err.itemIndex === itemIndex)
    }

    const getGroupErrors = (itemIndex, groupId) => {
        return validationErrors.filter(err => err.itemIndex === itemIndex && err.groupId === groupId)
    }

    const selectedItemIds = useMemo(() => {
        return formData.items.map(item => parseInt(item.menu_item_id)).filter(id => !isNaN(id))
    }, [formData.items])

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value)
    }

    const getStockBadge = (stock, quantity = 1) => {
        const qty = parseInt(quantity) || 0
        if (qty > stock) return { color: 'bg-red-100 text-red-800 border-red-300', text: `Vượt kho! (${stock})`, hasError: true }
        if (stock <= 0) return { color: 'bg-red-100 text-red-800', text: `Hết hàng`, hasError: true }
        if (stock <= 10) return { color: 'bg-yellow-100 text-yellow-800', text: `Còn ${stock}`, hasError: false }
        return { color: 'bg-green-100 text-green-800', text: `Còn ${stock}`, hasError: false }
    }

    const hasValidationErrors = validationErrors.length > 0

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

            // Check all validation errors
            if (hasValidationErrors) {
                const errorMessages = validationErrors.map(err => err.message)
                throw new Error(`Vui lòng sửa các lỗi sau:\n• ${errorMessages.join('\n• ')}`)
            }

            const categoryId = parseInt(formData.category, 10)
            if (Number.isNaN(categoryId)) {
                throw new Error('Danh mục không hợp lệ')
            }

            const discount = parseFloat(formData.discount_percentage)
            if (Number.isNaN(discount)) {
                throw new Error('Giảm giá phải là một số hợp lệ')
            }

            const normalizedItems = formData.items.map((item, index) => {
                const menuItemId = parseInt(item.menu_item_id, 10)
                if (Number.isNaN(menuItemId)) {
                    throw new Error(`Món #${index + 1} chưa được chọn`)
                }

                const quantity = parseInt(item.quantity, 10)
                if (Number.isNaN(quantity) || quantity <= 0) {
                    throw new Error(`Số lượng của món #${index + 1} phải lớn hơn 0`)
                }

                return {
                    menu_item_id: menuItemId,
                    quantity,
                    option_ids: (item.option_ids || [])
                        .map((id) => parseInt(id, 10))
                        .filter((id) => !Number.isNaN(id))
                }
            })

            const dataToSubmit = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                category_id: categoryId,
                discount_percentage: discount,
                is_available: formData.is_available,
                items: normalizedItems
            }

            let response
            if (combo) {
                response = await CatalogAPI.updateCombo(combo.id, dataToSubmit)
            } else {
                response = await CatalogAPI.createCombo(dataToSubmit)
            }

            const comboId = response?.data?.id ?? combo?.id ?? null
            if (imageFile && comboId) {
                await CatalogAPI.uploadComboImage(comboId, imageFile)
            }

            onSave()
        } catch (err) {
            console.error('Submit error:', err.response?.data || err)

            if (err.response?.data) {
                const errors = err.response.data
                const errorMessages = []

                if (errors.name) errorMessages.push(`Tên: ${Array.isArray(errors.name) ? errors.name.join(', ') : errors.name}`)
                if (errors.category_id) errorMessages.push(`Danh mục: ${Array.isArray(errors.category_id) ? errors.category_id.join(', ') : errors.category_id}`)
                if (errors.discount_percentage) errorMessages.push(`Giảm giá: ${Array.isArray(errors.discount_percentage) ? errors.discount_percentage.join(', ') : errors.discount_percentage}`)
                if (errors.items) errorMessages.push(`Món ăn: ${Array.isArray(errors.items) ? errors.items.join(', ') : errors.items}`)
                if (errors.detail) errorMessages.push(errors.detail)

                setError(errorMessages.length > 0 ? errorMessages.join('. ') : 'Có lỗi xảy ra')
            } else {
                setError(err.message || 'Có lỗi xảy ra')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl transform animate-slideUp">
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
                            <p className="text-red-700 text-sm whitespace-pre-line">{error}</p>
                        </div>
                    </div>
                )}

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(95vh-180px)]">
                    <div className="px-8 py-6 space-y-6">
                        {/* Image Upload Section */}
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


                        {/* Items List with Option Groups - REDESIGNED */}
                        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-orange-200">
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <span className="text-2xl">🍔</span>
                                    Món ăn trong combo *
                                    {hasValidationErrors && (
                                        <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                                            {validationErrors.length} lỗi
                                        </span>
                                    )}
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowItemPicker(true)}
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 transform"
                                >
                                    <span className="text-xl">+</span>
                                    Thêm món
                                </button>
                            </div>

                            {formData.items.length === 0 ? (
                                <div className="text-center py-12 bg-white/50 rounded-xl border-2 border-dashed border-orange-300">
                                    <div className="text-6xl mb-4">🍽️</div>
                                    <p className="text-gray-500 font-semibold">Chưa có món nào trong combo</p>
                                    <p className="text-gray-400 text-sm mt-2">Nhấn "Thêm món" để bắt đầu chọn món ăn</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {formData.items.map((item, index) => {
                                        const selectedMenuItem = getSelectedMenuItem(index)
                                        const itemErrors = getItemErrors(index)
                                        const stockBadge = selectedMenuItem ? getStockBadge(selectedMenuItem.stock, item.quantity) : null

                                        return (
                                            <div
                                                key={index}
                                                className={`bg-white rounded-xl p-5 border-2 transition-all ${itemErrors.length > 0 ? 'border-red-300 shadow-red-100' : 'border-orange-200'
                                                    } shadow-lg`}
                                            >
                                                <div className="flex gap-4">
                                                    {/* Item Icon (no image to reduce load) */}
                                                    <div className="flex-shrink-0">
                                                        <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl flex items-center justify-center">
                                                            <span className="text-2xl">🍽️</span>
                                                        </div>
                                                    </div>

                                                    {/* Item Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex-1">
                                                                <h4 className="font-bold text-gray-900 text-lg">
                                                                    {selectedMenuItem?.name || 'Chưa chọn món'}
                                                                </h4>
                                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                    <span className="text-orange-600 font-bold">
                                                                        {selectedMenuItem ? formatCurrency(selectedMenuItem.price) : '--'}
                                                                    </span>
                                                                    {stockBadge && (
                                                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${stockBadge.color}`}>
                                                                            📦 {stockBadge.text}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Quantity & Delete */}
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex items-center gap-2">
                                                                    <label className="text-sm font-semibold text-gray-600">SL:</label>
                                                                    <input
                                                                        type="number"
                                                                        value={item.quantity}
                                                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                                        required
                                                                        min="1"
                                                                        max={selectedMenuItem?.stock || 999}
                                                                        className={`w-20 px-3 py-2 border-2 rounded-lg font-bold text-center focus:border-orange-500 ${stockBadge?.hasError ? 'border-red-400 bg-red-50' : 'border-gray-200'
                                                                            }`}
                                                                    />
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveItem(index)}
                                                                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-all"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Item Errors (stock) */}
                                                        {itemErrors.filter(err => err.type === 'stock').map((err, errIdx) => (
                                                            <div key={`stock-${errIdx}`} className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                                                <p className="text-red-600 text-sm flex items-center gap-1">
                                                                    <span>⚠️</span> {err.message}
                                                                </p>
                                                            </div>
                                                        ))}

                                                        {/* Option Groups */}
                                                        {selectedMenuItem && selectedMenuItem.option_groups && selectedMenuItem.option_groups.length > 0 && (
                                                            <div className="mt-4 border-t border-orange-100 pt-4">
                                                                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                                                    <span>🎨</span>
                                                                    Tùy chọn cho món này:
                                                                </label>
                                                                <div className="space-y-3">
                                                                    {selectedMenuItem.option_groups.map((group) => {
                                                                        const groupErrors = getGroupErrors(index, group.id)
                                                                        const hasError = groupErrors.length > 0
                                                                        const selectedInGroup = group.options.filter(opt => item.option_ids?.includes(opt.id)).length
                                                                        const maxSelect = group.max_select || group.options.length
                                                                        const minSelect = group.min_select || 0

                                                                        return (
                                                                            <div
                                                                                key={group.id}
                                                                                className={`rounded-lg p-3 ${hasError ? 'bg-red-50 border border-red-200' : 'bg-purple-50'
                                                                                    }`}
                                                                            >
                                                                                <div className="font-semibold text-gray-900 mb-2 flex items-center gap-2 flex-wrap">
                                                                                    {group.name}
                                                                                    {group.required && (
                                                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${hasError
                                                                                                ? 'bg-red-500 text-white animate-pulse'
                                                                                                : 'bg-red-500 text-white'
                                                                                            }`}>
                                                                                            Bắt buộc
                                                                                        </span>
                                                                                    )}
                                                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${selectedInGroup > maxSelect ? 'bg-red-100 text-red-800' :
                                                                                            selectedInGroup >= (group.required ? Math.max(minSelect, 1) : minSelect) ? 'bg-green-100 text-green-800' :
                                                                                                'bg-gray-100 text-gray-600'
                                                                                        }`}>
                                                                                        {selectedInGroup}/{maxSelect}
                                                                                    </span>
                                                                                </div>

                                                                                {/* Group errors */}
                                                                                {groupErrors.map((err, errIdx) => (
                                                                                    <p key={errIdx} className="text-red-600 text-xs mb-2 flex items-center gap-1">
                                                                                        <span>⚠️</span> {err.message}
                                                                                    </p>
                                                                                ))}

                                                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                                                    {group.options.map((option) => {
                                                                                        const isSelected = item.option_ids?.includes(option.id)
                                                                                        return (
                                                                                            <label
                                                                                                key={option.id}
                                                                                                className={`flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition-all text-sm ${isSelected
                                                                                                        ? 'border-purple-500 bg-purple-100'
                                                                                                        : 'border-gray-200 hover:border-purple-300 bg-white'
                                                                                                    }`}
                                                                                            >
                                                                                                <input
                                                                                                    type="checkbox"
                                                                                                    checked={isSelected}
                                                                                                    onChange={() => handleOptionToggle(index, option.id, group)}
                                                                                                    className="w-4 h-4 text-purple-600 rounded"
                                                                                                />
                                                                                                <div className="flex-1 min-w-0">
                                                                                                    <span className="font-medium text-gray-900 truncate block">
                                                                                                        {option.name}
                                                                                                    </span>
                                                                                                    {option.price_delta > 0 && (
                                                                                                        <span className="text-xs text-green-600 font-semibold">
                                                                                                            +{formatCurrency(option.price_delta)}
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>
                                                                                            </label>
                                                                                        )
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
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
                            disabled={loading || hasValidationErrors}
                            className={`px-8 py-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 ${hasValidationErrors
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-xl hover:scale-105 transform'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Đang lưu...
                                </>
                            ) : hasValidationErrors ? (
                                <>
                                    <span>⚠️</span>
                                    Có {validationErrors.length} lỗi cần sửa
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
            </div >

            {/* Menu Item Picker Modal */}
            {showItemPicker && (
                <MenuItemPicker
                    items={menuItems}
                    categories={categories}
                    onSelect={handleAddItemFromPicker}
                    onClose={() => setShowItemPicker(false)}
                    excludeIds={selectedItemIds}
                />
            )}

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
        </div >
    )
}
