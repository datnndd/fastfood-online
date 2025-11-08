import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CatalogAPI, CartAPI } from '../lib/api'
import ItemCard from '../components/ItemCard'
import ItemDetailPopup from '../components/ItemDetailPopup'
import ComboCard from '../components/ComboCard'

const VIEW_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'combo', label: 'Combo' },
  { id: 'single', label: 'Món lẻ' }
]

const SORT_OPTIONS = [
  { id: 'default', label: 'Mặc định' },
  { id: 'price-asc', label: 'Giá tăng dần' },
  { id: 'price-desc', label: 'Giá giảm dần' }
]

const COMBOS_PER_PAGE = 6
const ITEMS_PER_PAGE = 9

const slugify = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const CATEGORY_NAME_MAP = {
  'ga-ran': 'Gà rán',
  'mi-y': 'Mì Ý',
  'ga-cay': 'Gà cay',
  burger: 'Burger',
  'mon-phu': 'Món phụ',
  'trang-mieng': 'Tráng miệng',
  'thuc-uong': 'Thức uống'
}

const parsePrice = (value) => {
  const numeric = Number.parseFloat(value)
  return Number.isFinite(numeric) ? numeric : 0
}

const getItemPrice = (item) => parsePrice(item.price ?? item.base_price ?? item.sale_price ?? 0)
const getComboPrice = (combo) =>
  parsePrice(combo.final_price ?? combo.price ?? combo.original_price ?? combo.base_price ?? 0)

const sortCollection = (list, option, getPrice) => {
  if (option === 'default') return [...list]
  const safeList = [...list]
  safeList.sort((a, b) => {
    if (option === 'price-asc') return getPrice(a) - getPrice(b)
    if (option === 'price-desc') return getPrice(b) - getPrice(a)
    return 0
  })
  return safeList
}

function PaginationControls({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, idx) => idx + 1)

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 pt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 disabled:border-gray-200 disabled:text-gray-400"
      >
        Trước
      </button>
      {pages.map((index) => (
        <button
          key={index}
          onClick={() => onPageChange(index)}
          className={`min-w-[40px] rounded-full px-3 py-1.5 text-sm font-semibold ${
            page === index ? 'bg-red-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
          }`}
        >
          {index}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 disabled:border-gray-200 disabled:text-gray-400"
      >
        Sau
      </button>
    </div>
  )
}

export default function MenuPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [combos, setCombos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategorySlug, setSelectedCategorySlug] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [showPopup, setShowPopup] = useState(false)
  const [viewMode, setViewMode] = useState('all')
  const [sortOption, setSortOption] = useState('default')
  const [comboPage, setComboPage] = useState(1)
  const [itemPage, setItemPage] = useState(1)
  const comboSectionRef = useRef(null)
  const singleSectionRef = useRef(null)
  const normalizedSearch = searchTerm.trim().toLowerCase()

  const unwrapList = (response) => {
    const data = response?.data
    if (!data) return []
    if (Array.isArray(data)) return data
    if (Array.isArray(data.results)) return data.results
    return []
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const categoryFromURL = params.get('category')
    setSelectedCategorySlug(categoryFromURL || null)

    setLoading(true)
    Promise.all([
      CatalogAPI.listCategories(),
      CatalogAPI.listItems(categoryFromURL ? { catalog: categoryFromURL } : {}),
      CatalogAPI.listCombos({ available: true })
    ])
      .then(([categoriesRes, itemsRes, combosRes]) => {
        const cats = unwrapList(categoriesRes)
        const itemsData = unwrapList(itemsRes)
        const combosData = unwrapList(combosRes)

        const filteredByCatalog = categoryFromURL
          ? itemsData.filter((item) => {
              const catField = item.category ?? item.catalog ?? item.category_name
              const catSlug =
                typeof catField === 'string'
                  ? slugify(catField)
                  : slugify(catField?.slug || catField?.name || '')

              return catSlug === slugify(categoryFromURL)
            })
          : itemsData

        setCategories(cats)
        setItems(filteredByCatalog)
        setCombos(combosData)
      })
      .catch((error) => {
        console.error('Failed to load menu:', error)
      })
      .finally(() => setLoading(false))
  }, [location.search])

  const filteredItems = useMemo(() => {
    const matches = items.filter((item) => {
      if (!normalizedSearch) return true
      return (
        item.name?.toLowerCase().includes(normalizedSearch) ||
        item.description?.toLowerCase().includes(normalizedSearch)
      )
    })
    return sortCollection(matches, sortOption, getItemPrice)
  }, [items, normalizedSearch, sortOption])

  const filteredCombos = useMemo(() => {
    const matches = combos.filter((combo) => {
      if (!normalizedSearch) return true
      return (
        combo.name?.toLowerCase().includes(normalizedSearch) ||
        combo.description?.toLowerCase().includes(normalizedSearch)
      )
    })
    return sortCollection(matches, sortOption, getComboPrice)
  }, [combos, normalizedSearch, sortOption])

  const selectedCategoryName = useMemo(() => {
    if (!selectedCategorySlug) return null
    const matchingCategory = categories.find((cat) => {
      const slug = slugify(cat.slug || cat.name || cat.title || '')
      return slug && slug === slugify(selectedCategorySlug)
    })
    return matchingCategory?.name || matchingCategory?.title || CATEGORY_NAME_MAP[selectedCategorySlug] || selectedCategorySlug
  }, [selectedCategorySlug, categories])

  const shouldShowCombos = (viewMode === 'all' || viewMode === 'combo') && filteredCombos.length > 0
  const shouldShowSingles = viewMode === 'all' || viewMode === 'single'

  const comboTotalPagesRaw = Math.ceil(filteredCombos.length / COMBOS_PER_PAGE)
  const comboTotalPages = comboTotalPagesRaw > 0 ? comboTotalPagesRaw : 1
  const itemTotalPagesRaw = Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
  const itemTotalPages = itemTotalPagesRaw > 0 ? itemTotalPagesRaw : 1

  const paginatedCombos = useMemo(() => {
    const start = (comboPage - 1) * COMBOS_PER_PAGE
    return filteredCombos.slice(start, start + COMBOS_PER_PAGE)
  }, [filteredCombos, comboPage])

  const paginatedItems = useMemo(() => {
    const start = (itemPage - 1) * ITEMS_PER_PAGE
    return filteredItems.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredItems, itemPage])

  useEffect(() => {
    setComboPage(1)
  }, [normalizedSearch, sortOption])

  useEffect(() => {
    setItemPage(1)
  }, [normalizedSearch, sortOption, selectedCategorySlug])

  useEffect(() => {
    setComboPage((prev) => (prev > comboTotalPages ? comboTotalPages : prev))
  }, [comboTotalPages])

  useEffect(() => {
    setItemPage((prev) => (prev > itemTotalPages ? itemTotalPages : prev))
  }, [itemTotalPages])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (viewMode === 'combo' && comboSectionRef.current) {
      comboSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else if (viewMode === 'single' && singleSectionRef.current) {
      singleSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else if (viewMode === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [viewMode])

  const handleCategorySelect = (slug) => {
    if (!slug) {
      navigate('/menu')
      return
    }
    navigate(`/menu?category=${encodeURIComponent(slug)}`)
  }

  const handleViewModeChange = (mode) => {
    if (mode === 'all' && selectedCategorySlug) {
      handleCategorySelect(null)
    }
    setViewMode(mode)
  }

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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600">Đang tải thực đơn...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <header className="space-y-3 text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-red-500">McDono Menu</p>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              {selectedCategorySlug ? `Danh mục: ${selectedCategoryName}` : 'Chọn món yêu thích'}
            </h1>
            <p className="text-sm text-gray-500">
              {filteredCombos.length} combo • {filteredItems.length} món lẻ
            </p>
          </div>
          <p className="text-gray-600">Phối hợp combo tiết kiệm hoặc chọn món lẻ theo khẩu vị riêng của bạn.</p>
        </header>

        <div className="rounded-3xl border border-rose-100 bg-gradient-to-r from-rose-50 via-orange-50 to-amber-50 p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex w-full gap-2 rounded-2xl bg-white/80 p-1 lg:w-auto">
              {VIEW_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleViewModeChange(tab.id)}
                  className={`flex-1 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    viewMode === tab.id ? 'bg-red-600 text-white shadow-lg' : 'text-red-500 hover:text-red-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-red-400">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.5 3a5.5 5.5 0 013.826 9.426l4.124 4.124a.75.75 0 11-1.06 1.06l-4.125-4.123A5.5 5.5 0 118.5 3zm0 1.5a4 4 0 100 8 4 4 0 000-8z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Tìm món: burger, gà cay..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-white/70 bg-white/90 py-3 pl-12 pr-4 text-sm shadow focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
              />
            </div>

            <div className="relative w-full lg:w-auto lg:min-w-[180px]">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-white/70 bg-white/90 py-3 pl-4 pr-10 text-sm font-semibold text-gray-700 shadow focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-red-400">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        {viewMode !== 'combo' && (
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-2">
              <button
                onClick={() => handleCategorySelect(null)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
                  !selectedCategorySlug ? 'bg-red-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                Danh mục: Tất cả
              </button>
              {categories.map((category) => {
                const slug = category.slug || slugify(category.name || category.title || '')
                const name = category.name || category.title || slug
                const isActive = selectedCategorySlug && slugify(selectedCategorySlug) === slugify(slug)
                return (
                  <button
                    key={category.id ?? slug}
                    onClick={() => handleCategorySelect(slug)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium border ${
                      isActive
                        ? 'border-red-100 bg-red-50 text-red-600'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-red-200'
                    }`}
                  >
                    {name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {shouldShowCombos ? (
          <section ref={comboSectionRef} className="space-y-4" id="combo-section">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Combo ưu đãi</p>
                <h2 className="text-2xl font-semibold text-gray-900">Tiết kiệm hơn khi chọn combo</h2>
                <p className="text-gray-500">Giá đã bao gồm món chính, món phụ và nước uống hài hòa khẩu vị.</p>
              </div>
              <span className="text-sm text-gray-500">{filteredCombos.length} combo đang mở bán</span>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginatedCombos.map((combo) => (
                <ComboCard key={combo.id} combo={combo} onAddToCart={handleAddComboToCart} />
              ))}
            </div>
            <PaginationControls
              page={comboPage}
              totalPages={comboTotalPages}
              onPageChange={(page) => setComboPage(Math.max(1, Math.min(page, comboTotalPages)))}
            />
          </section>
        ) : (
          viewMode === 'combo' && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
              <p className="text-lg font-semibold text-gray-700">Hiện chưa có combo phù hợp với bộ lọc này.</p>
              <p className="mt-2 text-gray-500">Hãy thử tìm kiếm với từ khóa khác hoặc chuyển sang xem món lẻ.</p>
            </div>
          )
        )}

        {shouldShowSingles && (
          filteredItems.length > 0 ? (
            <section ref={singleSectionRef} className="space-y-6" id="single-section">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Món lẻ</p>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {selectedCategorySlug ? selectedCategoryName : 'Tất cả món lẻ'}
                </h2>
                <p className="text-gray-500">
                  {selectedCategorySlug
                    ? `Có ${filteredItems.length} lựa chọn cho danh mục này.`
                    : 'Lựa chọn từng món để cá nhân hóa khẩu phần theo sở thích.'}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {paginatedItems.map((item) => (
                  <ItemCard key={item.id} item={item} onAddToCart={handleAddToCartClick} />
                ))}
              </div>
              <PaginationControls
                page={itemPage}
                totalPages={itemTotalPages}
                onPageChange={(page) => setItemPage(Math.max(1, Math.min(page, itemTotalPages)))}
              />
            </section>
          ) : (
            viewMode !== 'combo' && (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
                <p className="text-lg font-semibold text-gray-700">Không tìm thấy món ăn phù hợp.</p>
                <p className="mt-2 text-gray-500">Hãy thử đổi danh mục, xóa bộ lọc hoặc tìm kiếm với từ khóa khác.</p>
              </div>
            )
          )
        )}

        <ItemDetailPopup
          item={selectedItem}
          isOpen={showPopup}
          onClose={() => setShowPopup(false)}
          onAddToCart={handleAddToCart}
        />
      </div>
    </div>
  )
}
