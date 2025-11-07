// pages/MenuPage.jsx
import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { CatalogAPI, CartAPI } from '../lib/api'
import ItemCard from '../components/ItemCard'
import ItemDetailPopup from '../components/ItemDetailPopup'
import ComboCard from '../components/ComboCard'

export default function MenuPage() {
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [combos, setCombos] = useState([])
  const [loading, setLoading] = useState(true)

  // selectedCategorySlug = slug từ URL (vd: "ga-cay")
  // selectedCategoryName = tên hiển thị (vd: "Gà cay")
  const [selectedCategorySlug, setSelectedCategorySlug] = useState(null)
  const [selectedCategoryName, setSelectedCategoryName] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [showPopup, setShowPopup] = useState(false)

  const location = useLocation()

  const unwrapList = (response) => {
    const data = response?.data
    if (!data) return []
    if (Array.isArray(data)) return data
    if (Array.isArray(data.results)) return data.results
    return []
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const categoryFromURL = params.get('category') // có thể slug hoặc tên
    setSelectedCategorySlug(categoryFromURL || null)

    setLoading(true)
    Promise.all([
      CatalogAPI.listCategories(),
      // truyền slug sang backend nếu backend hỗ trợ (nếu không backend ignore)
      CatalogAPI.listItems(categoryFromURL ? { catalog: categoryFromURL } : {}),
      CatalogAPI.listCombos({ available: true })
    ])
      .then(([categoriesRes, itemsRes, combosRes]) => {
        const cats = unwrapList(categoriesRes)
        const itemsData = unwrapList(itemsRes)
        const combosData = unwrapList(combosRes)

        // Tìm tên hiển thị của categoryFromURL
        let displayName = null
        if (categoryFromURL) {
          // categories có thể chứa { id, name, slug } hoặc { id, name }
          const found =
            cats.find(
              (c) =>
                (c.slug && c.slug.toLowerCase() === categoryFromURL.toLowerCase()) ||
                (c.name && c.name.toLowerCase() === categoryFromURL.toLowerCase())
            ) || null
          displayName = found ? found.name : categoryFromURL
        }

        // Nếu backend không lọc theo slug, ta lọc lại ở frontend:
        const filteredByCatalog = categoryFromURL
          ? itemsData.filter((item) => {
            // item.category có thể là string (name) hoặc object { name, slug } tùy backend
            const catField = item.category ?? item.catalog ?? item.category_name
            const catSlug =
              typeof catField === 'string'
                ? // nếu backend lưu tên -> so sánh với name hoặc slug-like
                (catField || '').toLowerCase()
                : // nếu object
                ((catField.slug || catField.name) || '').toLowerCase()

            return (
              catSlug === categoryFromURL.toLowerCase() ||
              (item.category && String(item.category).toLowerCase() === categoryFromURL.toLowerCase())
            )
          })
          : itemsData

        setCategories(cats)
        setItems(filteredByCatalog)
        setCombos(combosData)
        setSelectedCategoryName(displayName)
      })
      .catch((error) => {
        console.error('Failed to load menu:', error)
      })
      .finally(() => setLoading(false))
  }, [location.search])

  const filteredItems = items.filter(
    (item) =>
      !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredCombos = combos.filter(
    (combo) =>
      !searchTerm ||
      combo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      combo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddToCartClick = (item) => {
    if (item.option_groups && item.option_groups.length > 0) {
      setSelectedItem(item)
      setShowPopup(true)
    } else {
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
      window.dispatchEvent(new CustomEvent('cartUpdated'))
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
        <h1 className="text-3xl font-bold text-gray-900">
          {(() => {
            if (!selectedCategorySlug) return 'Thực đơn'

            switch (selectedCategorySlug) {
              case 'ga-ran':
                return 'Danh mục: Gà rán'
              case 'mi-y':
                return 'Danh mục: Mì Ý'
              case 'ga-cay':
                return 'Danh mục: Gà cay'
              case 'burger':
                return 'Danh mục: Burger'
              case 'mon-phu':
                return 'Danh mục: Món phụ'
              case 'trang-mieng':
                return 'Danh mục: Tráng miệng'
              case 'thuc-uong':
                return 'Danh mục: Thức uống'
              default:
                return `Danh mục: ${selectedCategorySlug}`
            }
          })()}
        </h1>

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
            onClick={() => (window.location.href = '/menu')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${!selectedCategorySlug ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Tất cả
          </button>

          {categories.map((category) => {
            // lấy slug và name từ object category (nếu backend trả slug)
            const slug = category.slug || (category.name || '').toString()
            const name = category.name || category.title || slug
            const isActive = selectedCategorySlug && selectedCategorySlug.toLowerCase() === slug.toLowerCase()

            return (
              <button
                key={category.id ?? name}
                onClick={() => (window.location.href = `/menu?category=${encodeURIComponent(slug)}`)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${isActive ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Nếu chưa chọn danh mục thì hiển thị Combo, nếu đã chọn danh mục thì ẩn */}
      {!selectedCategorySlug && filteredCombos.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">Combo ưu đãi</h2>
            <span className="text-sm text-gray-500">Tiết kiệm với các gói combo dành riêng cho bạn</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCombos.map((combo) => (
              <ComboCard key={combo.id} combo={combo} onAddToCart={handleAddComboToCart} />
            ))}
          </div>
        </div>
      )}

      {/* Items */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} onAddToCart={handleAddToCartClick} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <img src="https://cdn-icons-png.flaticon.com/512/1046/1046784.png" alt="empty" className="w-32 h-32 mx-auto opacity-70" />
          <p className="text-gray-500 mt-4 text-lg">Không tìm thấy món ăn nào trong danh mục này.</p>
        </div>
      )}

      <ItemDetailPopup item={selectedItem} isOpen={showPopup} onClose={() => setShowPopup(false)} onAddToCart={handleAddToCart} />
    </div>
  )
}
