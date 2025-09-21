import { useState, useEffect } from 'react'
import { CatalogAPI } from '../lib/api'
import ItemCard from '../components/ItemCard'

export default function MenuPage() {
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [pick, setPick] = useState({})

  useEffect(() => {
    Promise.all([
      CatalogAPI.listCategories(),
      CatalogAPI.listItems()
    ])
      .then(([categoriesRes, itemsRes]) => {
        setCategories(categoriesRes.data.results || [])
        setItems(itemsRes.data.results || [])
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
        <p className="mt-2 text-gray-600">Khám phá những món ngon tại FastFood One</p>
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

      {/* Items grid */}
      {filteredItems.length > 0 ? (
        <div className="grid gap-6">
          {filteredItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              pick={pick}
              setPick={setPick}
              onAddToCart={() => {
                // Refresh cart count in navbar - có thể emit event hoặc use context
                window.dispatchEvent(new CustomEvent('cartUpdated'))
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">Không tìm thấy món ăn nào.</p>
        </div>
      )}
    </div>
  )
}
