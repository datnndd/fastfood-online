import { useState, useMemo } from 'react'

/**
 * MenuItemPicker - Card-based menu item selection modal
 * 
 * Props:
 * - items: Array of menu items to display
 * - categories: Array of categories for filtering
 * - onSelect: Callback when an item is selected
 * - onClose: Callback to close the modal
 * - excludeIds: Array of item IDs to exclude (already selected)
 */
export default function MenuItemPicker({ items, categories = [], onSelect, onClose, excludeIds = [] }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            // Exclude already selected items
            if (excludeIds.includes(item.id)) return false

            // Search filter
            if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false
            }

            // Category filter
            if (selectedCategory && item.category_id !== parseInt(selectedCategory)) {
                return false
            }

            return true
        })
    }, [items, searchTerm, selectedCategory, excludeIds])

    const getStockStatus = (stock) => {
        if (stock <= 0) return { color: 'bg-red-500', text: 'Hết hàng', canSelect: false }
        if (stock <= 10) return { color: 'bg-yellow-500', text: `Còn ${stock}`, canSelect: true }
        return { color: 'bg-green-500', text: `Còn ${stock}`, canSelect: true }
    }

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value)
    }

    const handleSelect = (item) => {
        const stockStatus = getStockStatus(item.stock)
        if (!stockStatus.canSelect) return
        onSelect(item)
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-white flex items-center gap-2">
                                🍔 CHỌN MÓN ĂN
                            </h2>
                            <p className="text-orange-100 text-sm mt-1">
                                {filteredItems.length} món có sẵn
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="px-6 py-4 bg-gray-50 border-b space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search Input */}
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Tìm kiếm món ăn..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                🔍
                            </span>
                        </div>

                        {/* Category Filter */}
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-3 border-2 border-gray-200 rounded-xl font-semibold focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all min-w-[200px]"
                        >
                            <option value="">📂 Tất cả danh mục</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Items Grid */}
                <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
                    {filteredItems.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🍽️</div>
                            <p className="text-xl text-gray-500 font-semibold">Không tìm thấy món ăn</p>
                            <p className="text-gray-400 mt-2">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredItems.map((item) => {
                                const stockStatus = getStockStatus(item.stock)
                                const hasRequiredOptions = item.option_groups?.some(g => g.required)

                                return (
                                    <div
                                        key={item.id}
                                        className={`bg-white rounded-xl border-2 overflow-hidden transition-all duration-200 ${stockStatus.canSelect
                                            ? 'border-gray-200 hover:border-orange-400 hover:shadow-lg cursor-pointer transform hover:-translate-y-1'
                                            : 'border-gray-200 opacity-60 cursor-not-allowed'
                                            }`}
                                        onClick={() => handleSelect(item)}
                                    >
                                        {/* Icon placeholder (no image to reduce load) */}
                                        <div className="relative h-24 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                                            <span className="text-4xl">🍽️</span>

                                            {/* Stock Badge */}
                                            <div className={`absolute top-2 right-2 ${stockStatus.color} text-white text-xs font-bold px-2 py-1 rounded-full shadow`}>
                                                {stockStatus.text}
                                            </div>

                                            {/* Required Options Badge */}
                                            {hasRequiredOptions && stockStatus.canSelect && (
                                                <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
                                                    ⚙️ Có tùy chọn
                                                </div>
                                            )}

                                            {/* Out of Stock Overlay */}
                                            {!stockStatus.canSelect && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    <span className="bg-red-600 text-white px-3 py-1 rounded-full font-bold text-sm">
                                                        HẾT HÀNG
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="p-3">
                                            <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1">
                                                {item.name}
                                            </h3>
                                            <p className="text-orange-600 font-black text-lg">
                                                {formatCurrency(item.price)}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {item.category_name || 'Không xác định'}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
            `}</style>
        </div>
    )
}
