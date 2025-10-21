// pages/MenuPage.jsx
import { useState, useEffect } from 'react'
import { CatalogAPI, CartAPI } from '../lib/api'
import ItemCard from '../components/ItemCard'
import ItemDetailPopup from '../components/ItemDetailPopup'
import ComboCard from '../components/ComboCard'

export default function MenuPage() {
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [combos, setCombos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // State cho popup
  const [selectedItem, setSelectedItem] = useState(null)
  const [showPopup, setShowPopup] = useState(false)

  const unwrapList = (response) => {
    const data = response?.data
    if (!data) return []
    if (Array.isArray(data)) return data
    if (Array.isArray(data.results)) return data.results
    return []
  }

  useEffect(() => {
    Promise.all([
      CatalogAPI.listCategories(),
      CatalogAPI.listItems(),
      CatalogAPI.listCombos({ available: true })
    ])
      .then(([categoriesRes, itemsRes, combosRes]) => {
        const categoriesData = unwrapList(categoriesRes)
        const itemsData = unwrapList(itemsRes)
        const combosData = unwrapList(combosRes)
        setCategories(categoriesData)
        setItems(itemsData)
        setCombos(combosData)
      })
      .catch(error => {
        console.error('Failed to load menu:', error)
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredItems = items.filter(item => {
    const matchesCategory = !selectedCategory || item.category === selectedCategory
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const filteredCombos = combos.filter(combo => {
    const matchesCategory = !selectedCategory || combo.category === selectedCategory
    const matchesSearch = !searchTerm ||
      combo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      combo.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleAddToCartClick = (item) => {
    if (item.option_groups && item.option_groups.length > 0) {
      // Có options, hiển thị popup
      setSelectedItem(item)
      setShowPopup(true)
    } else {
      // Không có options, thêm trực tiếp
      handleAddToCart({
        menu_item_id: item.id,
        quantity: 1,
        option_ids: []
      })
    }
  }

  const handleAddToCart = async (cartItem) => {
    try {
      await CartAPI.addItem(cartItem)
      
      // Dispatch event để cập nhật cart count trên navbar
      window.dispatchEvent(new CustomEvent('cartUpdated'))
      
      // Hiển thị thông báo thành công
      alert('Đã thêm vào giỏ hàng!')
      
    } catch (error) {
      console.error('Failed to add to cart:', error)
      alert('Có lỗi xảy ra khi thêm vào giỏ hàng')
    }
  }

  const handleAddComboToCart = async (combo) => {
    try {
      await CartAPI.addCombo({ combo_id: combo.id, quantity: 1 })
      
      window.dispatchEvent(new CustomEvent('cartUpdated'))
      alert('Đã thêm combo vào giỏ hàng!')
    } catch (error) {
      console.error('Failed to add combo:', error)
      alert('Có lỗi xảy ra khi thêm combo vào giỏ hàng')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thực đơn...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Thực đơn</h1>
        <p className="mt-2 text-gray-600">Khám phá những món ngon tại McDono</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Tìm kiếm món ăn..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* Category tabs */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !selectedCategory
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tất cả
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.name)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category.name
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {filteredCombos.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">Combo ưu đãi</h2>
            <span className="text-sm text-gray-500">
              Tiết kiệm với các gói combo dành riêng cho bạn
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCombos.map(combo => (
              <ComboCard
                key={combo.id}
                combo={combo}
                onAddToCart={handleAddComboToCart}
              />
            ))}
          </div>
        </div>
      )}

      {/* Items Grid - 3 cột */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onAddToCart={handleAddToCartClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">Không tìm thấy món ăn nào.</p>
        </div>
      )}

      {/* Popup chi tiết */}
      <ItemDetailPopup
        item={selectedItem}
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        onAddToCart={handleAddToCart}
      />
    </div>
  )
}
