import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CatalogAPI, CartAPI } from '../lib/api'
import { useAuth } from '../lib/authContext'
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

const FALLBACK_CATEGORY_NAME = 'Danh mục khác'

const getCategoryMetaFromField = (field) => {
  if (!field) return { slug: null, name: null }
  if (typeof field === 'string') {
    const trimmed = field.trim()
    if (!trimmed) return { slug: null, name: null }
    return { slug: slugify(trimmed), name: trimmed }
  }

  if (typeof field === 'object') {
    const slugSource = field.slug || field.code || field.identifier || field.name || field.title
    const slug = slugSource ? slugify(slugSource) : null
    const name = field.name || field.title || field.label || null
    return { slug, name }
  }

  return { slug: null, name: null }
}

const getCategoryMetaFromEntity = (entity) => {
  if (!entity) return { slug: null, name: null }

  const fieldCandidates = [
    entity.categorySlug,
    entity.category_slug,
    entity.category_info,
    entity.catalog,
    entity.category,
    entity.category_name,
    entity.categoryName,
    entity.categoryLabel,
    entity.categoryTitle
  ]

  for (const candidate of fieldCandidates) {
    const meta = getCategoryMetaFromField(candidate)
    if (meta.slug) {
      return {
        slug: meta.slug,
        name: meta.name || CATEGORY_NAME_MAP[meta.slug] || FALLBACK_CATEGORY_NAME
      }
    }
  }

  return { slug: null, name: null }
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
  const { user } = useAuth()

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
  const [itemAddState, setItemAddState] = useState({})
  const [comboAddState, setComboAddState] = useState({})
  const itemStatusTimers = useRef(new Map())
  const comboStatusTimers = useRef(new Map())
  const normalizedSearch = searchTerm.trim().toLowerCase()
  const normalizedSelectedCategory = selectedCategorySlug ? slugify(selectedCategorySlug) : null
  const isMenuEntryAvailable = (entry) => {
    if (!entry) return false
    if (entry.is_available === false) return false
    const numericStock = Number(entry.stock)
    if (Number.isFinite(numericStock)) {
      return numericStock > 0
    }
    return true
  }
  const isItemAvailable = (item) => isMenuEntryAvailable(item)
  const isComboAvailable = (combo) => isMenuEntryAvailable(combo)

  const updateStatus = (setter, timersRef, id, status, { autoReset = false, resetAfter = 2000 } = {}) => {
    if (!id) return
    setter((prev) => {
      const next = { ...prev }
      if (!status || status === 'idle') {
        delete next[id]
      } else {
        next[id] = status
      }
      return next
    })

    const timers = timersRef.current
    const existingTimer = timers.get(id)
    if (existingTimer) {
      clearTimeout(existingTimer)
      timers.delete(id)
    }

    if (autoReset && status && status !== 'pending') {
      const timeoutId = setTimeout(() => {
        setter((prev) => {
          const next = { ...prev }
          if (next[id] && next[id] !== 'pending') {
            delete next[id]
          }
          return next
        })
        timers.delete(id)
      }, resetAfter)
      timers.set(id, timeoutId)
    }
  }

  const setItemStatus = (id, status, options) => updateStatus(setItemAddState, itemStatusTimers, id, status, options)
  const setComboStatus = (id, status, options) => updateStatus(setComboAddState, comboStatusTimers, id, status, options)

  const requireAuth = () => {
    if (user) return true
    alert('Bạn cần đăng nhập để thêm món vào giỏ hàng.')
    const returnPath = `${location.pathname}${location.search || ''}`
    navigate('/login', {
      state: { from: returnPath || '/menu' }
    })
    return false
  }

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

        setCategories(cats)
        setItems(itemsData)
        setCombos(combosData)
      })
      .catch((error) => {
        console.error('Failed to load menu:', error)
      })
      .finally(() => setLoading(false))
  }, [location.search])

  const filteredItems = useMemo(() => {
    const matches = items.filter((item) => {
      if (normalizedSearch) {
        const inName = item.name?.toLowerCase().includes(normalizedSearch)
        const inDesc = item.description?.toLowerCase().includes(normalizedSearch)
        if (!inName && !inDesc) return false
      }

      if (normalizedSelectedCategory) {
        const { slug } = getCategoryMetaFromEntity(item)
        if (!slug || slug !== normalizedSelectedCategory) return false
      }

      return true
    })
    return sortCollection(matches, sortOption, getItemPrice)
  }, [items, normalizedSearch, sortOption, normalizedSelectedCategory])

  const filteredCombos = useMemo(() => {
    const matches = combos.filter((combo) => {
      if (normalizedSearch) {
        const inName = combo.name?.toLowerCase().includes(normalizedSearch)
        const inDesc = combo.description?.toLowerCase().includes(normalizedSearch)
        if (!inName && !inDesc) return false
      }

      if (normalizedSelectedCategory) {
        const { slug } = getCategoryMetaFromEntity(combo)
        if (!slug || slug !== normalizedSelectedCategory) return false
      }

      return true
    })
    return sortCollection(matches, sortOption, getComboPrice)
  }, [combos, normalizedSearch, sortOption, normalizedSelectedCategory])

  const categoryOptions = useMemo(() => {
    const map = new Map()

    const addCategory = (slug, name) => {
      if (!slug) return
      const key = slug.toLowerCase()
      if (map.has(key)) return
      map.set(key, {
        slug,
        name: name || CATEGORY_NAME_MAP[slug] || FALLBACK_CATEGORY_NAME
      })
    }

    categories.forEach((category) => {
      const slug = slugify(category.slug || category.name || category.title || '')
      if (!slug) return
      const name = category.name || category.title || CATEGORY_NAME_MAP[slug] || FALLBACK_CATEGORY_NAME
      addCategory(slug, name)
    })

    items.forEach((item) => {
      const { slug, name } = getCategoryMetaFromEntity(item)
      addCategory(slug, name)
    })

    combos.forEach((combo) => {
      const { slug, name } = getCategoryMetaFromEntity(combo)
      addCategory(slug, name)
    })

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' }))
  }, [categories, items, combos])

  const selectedCategoryName = useMemo(() => {
    if (!normalizedSelectedCategory) return null
    const matchingCategory = categoryOptions.find((cat) => slugify(cat.slug) === normalizedSelectedCategory)
    return matchingCategory?.name || CATEGORY_NAME_MAP[normalizedSelectedCategory] || selectedCategorySlug
  }, [normalizedSelectedCategory, categoryOptions, selectedCategorySlug])

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
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    return () => {
      itemStatusTimers.current.forEach((timerId) => clearTimeout(timerId))
      comboStatusTimers.current.forEach((timerId) => clearTimeout(timerId))
    }
  }, [])

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

  const handleShowItemDetail = (item) => {
    if (!item) return
    setSelectedItem(item)
    setShowPopup(true)
  }

  const handleCloseItemDetail = () => {
    setShowPopup(false)
    setSelectedItem(null)
  }

  const handleAddToCart = async (cartItem) => {
    if (!requireAuth()) return
    const targetItemId = cartItem?.menu_item_id
    if (targetItemId) {
      setItemStatus(targetItemId, 'pending')
    }
    try {
      await CartAPI.addItem(cartItem)
      window.dispatchEvent(new CustomEvent('cartUpdated'))
      if (targetItemId) {
        setItemStatus(targetItemId, 'success', { autoReset: true })
      }
    } catch (error) {
      console.error('Failed to add to cart:', error)
      if (targetItemId) {
        setItemStatus(targetItemId, 'error', { autoReset: true, resetAfter: 4000 })
      }
      const message = error.response?.data?.detail || error.response?.data?.error || 'Có lỗi xảy ra khi thêm vào giỏ hàng'
      alert(message)
    }
  }

  const handleAddComboToCart = async (combo) => {
    if (!requireAuth()) return
    if (!isComboAvailable(combo)) {
      alert('Combo này đã hết hàng.')
      return
    }
    setComboStatus(combo.id, 'pending')
    try {
      await CartAPI.addCombo({ combo_id: combo.id, quantity: 1 })
      window.dispatchEvent(new CustomEvent('cartUpdated'))
      setComboStatus(combo.id, 'success', { autoReset: true })
    } catch (error) {
      console.error('Failed to add combo:', error)
      setComboStatus(combo.id, 'error', { autoReset: true, resetAfter: 4000 })
      const message = error.response?.data?.detail || error.response?.data?.error || 'Có lỗi xảy ra khi thêm combo vào giỏ hàng'
      alert(message)
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
            <div className="flex w-full flex-wrap gap-2 rounded-2xl bg-white/80 p-1 lg:w-auto">
              {VIEW_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleViewModeChange(tab.id)}
                  className={`flex-1 rounded-2xl px-4 py-2 text-sm font-semibold whitespace-nowrap transition ${
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

        {categoryOptions.length > 0 && (
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-2">
              <button
                onClick={() => handleCategorySelect(null)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
                  !normalizedSelectedCategory ? 'bg-red-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                Danh mục: Tất cả
              </button>
              {categoryOptions.map((category) => {
                const { slug, name } = category
                const isActive = normalizedSelectedCategory === slug
                return (
                  <button
                    key={slug}
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
          <section className="space-y-4" id="combo-section">
            <div className="rounded-2xl border border-amber-100 bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 p-6 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                    Combo ưu đãi
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold text-amber-900">Combo đậm vị • tiết kiệm hết ý</h2>
                  <p className="mt-2 text-sm text-amber-900/90">
                    Ghép đôi món chính, món phụ và nước uống đã được cân chỉnh khẩu vị giúp bạn thưởng thức trọn vẹn mà vẫn tiết kiệm.
                  </p>
                </div>
                <div className="flex flex-1 flex-col gap-4 text-sm text-amber-900/80">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-white/90 px-4 py-3 shadow-sm">
                      <div className="text-4xl font-bold text-amber-900">{filteredCombos.length}</div>
                      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-amber-500">Combo mở bán</p>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-amber-800">
                      <span className="text-2xl" role="img" aria-label="hot deal">
                        🔥
                      </span>
                      <p className="text-sm font-semibold">Đặt combo hot trong tuần</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-white/80 p-4 text-center text-amber-800 sm:flex sm:items-center sm:justify-between sm:text-left">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-amber-500">Gợi ý</p>
                      <p className="text-base font-semibold">Phù hợp nhóm 2-4 người</p>
                    </div>
                    <p className="mt-2 text-sm text-amber-700 sm:mt-0 sm:max-w-xs">
                      Chọn combo kèm món phụ & thức uống đồng bộ khẩu vị, tiết kiệm hơn so với gọi lẻ từng món.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginatedCombos.map((combo) => {
                const { slug, name } = getCategoryMetaFromEntity(combo)
                return (
                  <ComboCard
                    key={combo.id}
                    combo={combo}
                    status={comboAddState[combo.id]}
                    onAddToCart={handleAddComboToCart}
                    categoryName={name}
                    onCategoryClick={slug ? () => handleCategorySelect(slug) : undefined}
                  />
                )
              })}
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
            <section className="space-y-6" id="single-section">
              <div className="rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 via-cyan-50 to-indigo-50 p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
                      <span className="h-2 w-2 rounded-full bg-sky-500"></span>
                      Món lẻ
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold text-indigo-950">
                      {selectedCategorySlug ? `${selectedCategoryName} • chọn món theo gu` : 'Tự tay mix & match món lẻ'}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                      {selectedCategorySlug
                        ? `Có ${filteredItems.length} lựa chọn đang chờ bạn trong danh mục này.`
                        : 'Chọn từng món yêu thích để cá nhân hóa khẩu phần, thêm topping hoặc mix cùng combo có sẵn.'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center text-sm text-slate-700">
                    <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
                      <p className="text-xs uppercase tracking-widest text-sky-500">Tổng món</p>
                      <p className="text-3xl font-bold text-indigo-900">{filteredItems.length}</p>
                    </div>
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/90 p-4">
                      <p className="text-xs uppercase tracking-widest text-indigo-500">Tùy chọn</p>
                      <p className="text-sm font-semibold">Topping, combo mini</p>
                      <p className="text-xs text-indigo-500/80">Chọn nhanh trong pop-up</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {paginatedItems.map((item) => {
                  const { slug, name } = getCategoryMetaFromEntity(item)
                  return (
                    <ItemCard
                      key={item.id}
                      item={item}
                      status={itemAddState[item.id]}
                      onViewDetail={handleShowItemDetail}
                      categoryName={name}
                      onCategoryClick={slug ? () => handleCategorySelect(slug) : undefined}
                    />
                  )
                })}
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
          onClose={handleCloseItemDetail}
          onAddToCart={handleAddToCart}
        />
      </div>
    </div>
  )
}
