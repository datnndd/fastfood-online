import { useCallback, useEffect, useMemo, useState } from 'react'
import { CatalogAPI } from '../lib/api'

const unwrapList = (response) => {
  const data = response?.data
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.results)) return data.results
  return []
}

const getErrorMessage = (error, fallback = 'Đã có lỗi xảy ra') => {
  const data = error?.response?.data
  if (!data) return error?.message || fallback

  if (typeof data === 'string') return data
  if (Array.isArray(data)) return data.join(', ')

  if (data.detail) {
    if (Array.isArray(data.detail)) return data.detail.join(', ')
    if (typeof data.detail === 'string') return data.detail
  }

  const firstKey = Object.keys(data)[0]
  if (firstKey) {
    const value = data[firstKey]
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'string') return value
  }

  return fallback
}

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '—'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return value
  return numeric.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })
}

const initialCategoryForm = { name: '', imageFile: null }
const initialItemForm = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  isAvailable: true,
  imageFile: null
}

export default function ManagerMenuPage() {
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [categoryForm, setCategoryForm] = useState(initialCategoryForm)
  const [categoryStatus, setCategoryStatus] = useState({ status: 'idle', message: '' })

  const [itemForm, setItemForm] = useState(initialItemForm)
  const [itemStatus, setItemStatus] = useState({ status: 'idle', message: '' })

  const [editingItem, setEditingItem] = useState(null)
  const [editForm, setEditForm] = useState(initialItemForm)
  const [editStatus, setEditStatus] = useState({ status: 'idle', message: '' })

  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategoryId, setFilterCategoryId] = useState('')

  const [activityLog, setActivityLog] = useState([])
  const [deletingId, setDeletingId] = useState(null)

  const addActivity = useCallback((message) => {
    setActivityLog((prev) => [{ message, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 6))
  }, [])

  const refreshMenu = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [categoryResponse] = await Promise.all([CatalogAPI.listCategories()])
      const categoryData = unwrapList(categoryResponse)
      setCategories(categoryData)

      const derivedItems = categoryData.flatMap((category) =>
        (category.items || []).map((item) => ({
          ...item,
          category_id: item.category_id ?? category.id,
          category_name: item.category || category.name
        }))
      )
      setItems(derivedItems)
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Không thể tải danh sách món ăn.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshMenu()
  }, [refreshMenu])

  useEffect(() => {
    if (!editingItem) {
      setEditForm(initialItemForm)
      setEditStatus({ status: 'idle', message: '' })
      return
    }

    setEditForm({
      name: editingItem.name || '',
      description: editingItem.description || '',
      price: editingItem.price || '',
      categoryId: editingItem.category_id ? String(editingItem.category_id) : '',
      isAvailable: Boolean(editingItem.is_available),
      imageFile: null
    })
    setEditStatus({ status: 'idle', message: '' })
  }, [editingItem])

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: String(category.id), label: category.name })),
    [categories]
  )

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = !filterCategoryId || String(item.category_id) === filterCategoryId
      const matchesSearch =
        !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [items, filterCategoryId, searchTerm])

  const handleCreateCategory = async (event) => {
    event.preventDefault()
    if (!categoryForm.name.trim()) {
      setCategoryStatus({ status: 'error', message: 'Tên danh mục không được để trống.' })
      return
    }

    setCategoryStatus({ status: 'loading', message: '' })
    try {
      const payload = { name: categoryForm.name.trim() }
      const { data } = await CatalogAPI.createCategory(payload)

      if (categoryForm.imageFile && data?.id) {
        try {
          await CatalogAPI.uploadCategoryImage(data.id, categoryForm.imageFile)
        } catch (uploadError) {
          addActivity(`Upload ảnh danh mục thất bại: ${getErrorMessage(uploadError, 'Lỗi upload ảnh')}`)
        }
      }

      setCategoryStatus({ status: 'success', message: 'Đã tạo danh mục mới.' })
      setCategoryForm(initialCategoryForm)
      addActivity(`Tạo danh mục "${payload.name}"`)
      refreshMenu()
    } catch (error) {
      setCategoryStatus({
        status: 'error',
        message: getErrorMessage(error, 'Không thể tạo danh mục lúc này.')
      })
    }
  }

  const handleCreateItem = async (event) => {
    event.preventDefault()

    if (!itemForm.name.trim()) {
      setItemStatus({ status: 'error', message: 'Tên món ăn không được để trống.' })
      return
    }
    if (!itemForm.categoryId) {
      setItemStatus({ status: 'error', message: 'Vui lòng chọn danh mục.' })
      return
    }
    const priceNumber = Number(itemForm.price)
    if (Number.isNaN(priceNumber) || priceNumber <= 0) {
      setItemStatus({ status: 'error', message: 'Giá món ăn phải là số lớn hơn 0.' })
      return
    }

    setItemStatus({ status: 'loading', message: '' })
    try {
      const payload = {
        name: itemForm.name.trim(),
        description: itemForm.description.trim(),
        price: priceNumber,
        is_available: itemForm.isAvailable,
        category_id: Number(itemForm.categoryId)
      }

      const { data } = await CatalogAPI.createItem(payload)
      if (itemForm.imageFile && data?.id) {
        try {
          await CatalogAPI.uploadItemImage(data.id, itemForm.imageFile)
        } catch (uploadError) {
          addActivity(`Upload ảnh món ăn thất bại: ${getErrorMessage(uploadError, 'Lỗi upload ảnh')}`)
        }
      }

      setItemStatus({ status: 'success', message: 'Đã tạo món ăn.' })
      addActivity(`Tạo món "${payload.name}"`)
      setItemForm(initialItemForm)
      refreshMenu()
    } catch (error) {
      setItemStatus({
        status: 'error',
        message: getErrorMessage(error, 'Không thể tạo món ăn lúc này.')
      })
    }
  }

  const handleEditItem = async (event) => {
    event.preventDefault()
    if (!editingItem) return

    if (!editForm.name.trim()) {
      setEditStatus({ status: 'error', message: 'Tên món ăn không được để trống.' })
      return
    }
    if (!editForm.categoryId) {
      setEditStatus({ status: 'error', message: 'Vui lòng chọn danh mục.' })
      return
    }
    const priceNumber = Number(editForm.price)
    if (Number.isNaN(priceNumber) || priceNumber <= 0) {
      setEditStatus({ status: 'error', message: 'Giá món ăn phải là số lớn hơn 0.' })
      return
    }

    setEditStatus({ status: 'loading', message: '' })
    try {
      const payload = {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        price: priceNumber,
        is_available: editForm.isAvailable,
        category_id: Number(editForm.categoryId)
      }

      await CatalogAPI.updateItem(editingItem.id, payload)

      if (editForm.imageFile) {
        try {
          await CatalogAPI.uploadItemImage(editingItem.id, editForm.imageFile)
        } catch (uploadError) {
          addActivity(`Upload ảnh món #${editingItem.id} thất bại: ${getErrorMessage(uploadError, 'Lỗi upload ảnh')}`)
        }
      }

      setEditStatus({ status: 'success', message: 'Đã cập nhật món ăn.' })
      addActivity(`Cập nhật món "${payload.name}" (#${editingItem.id})`)
      setEditingItem(null)
      refreshMenu()
    } catch (error) {
      setEditStatus({
        status: 'error',
        message: getErrorMessage(error, 'Không thể cập nhật món ăn.')
      })
    }
  }

  const handleToggleAvailability = async (item) => {
    const nextAvailability = !item.is_available
    try {
      await CatalogAPI.patchItem(item.id, { is_available: nextAvailability })
      addActivity(
        `${nextAvailability ? 'Mở' : 'Ngừng'} bán món "${item.name}" (#${item.id})`
      )
      refreshMenu()
    } catch (error) {
      addActivity(
        `Không thể cập nhật trạng thái món "${item.name}": ${getErrorMessage(
          error,
          'Lỗi cập nhật trạng thái'
        )}`
      )
    }
  }

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Bạn chắn chắn muốn xóa "${item.name}"?`)) {
      return
    }
    setDeletingId(item.id)
    try {
      await CatalogAPI.deleteItem(item.id)
      addActivity(`Đã xóa món "${item.name}" (#${item.id})`)
      if (editingItem?.id === item.id) {
        setEditingItem(null)
      }
      refreshMenu()
    } catch (error) {
      addActivity(
        `Không thể xóa món "${item.name}": ${getErrorMessage(error, 'Lỗi xóa món')}`
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 space-y-10">
        <header className="space-y-3">
          <p className="text-sm font-semibold text-red-600 uppercase tracking-wide">Manager</p>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý thực đơn</h1>
          <p className="text-gray-600 max-w-3xl">
            Làm việc trực tiếp với <code className="bg-gray-200 px-1 py-0.5 rounded text-sm">CatalogAPI</code> từ{' '}
            <code className="bg-gray-200 px-1 py-0.5 rounded text-sm">api.js</code> để cập nhật danh mục, thêm món mới
            và kiểm soát trạng thái bán hàng.
          </p>
        </header>

        {loadError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {loadError}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Thêm danh mục</h2>
                <p className="text-sm text-gray-500">POST /catalog/categories/</p>
              </div>
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                CATEGORY
              </span>
            </div>

            <form className="space-y-4" onSubmit={handleCreateCategory}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
                  placeholder="Ví dụ: Burger"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ảnh (tùy chọn)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setCategoryForm((prev) => ({ ...prev, imageFile: event.target.files?.[0] || null }))
                  }
                  className="w-full text-sm text-gray-600"
                />
              </div>

              {categoryStatus.message && (
                <p
                  className={`text-sm ${
                    categoryStatus.status === 'error'
                      ? 'text-red-600'
                      : categoryStatus.status === 'success'
                        ? 'text-green-600'
                        : 'text-gray-600'
                  }`}
                >
                  {categoryStatus.message}
                </p>
              )}

              <button
                type="submit"
                disabled={categoryStatus.status === 'loading'}
                className="w-full py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition disabled:opacity-60"
              >
                {categoryStatus.status === 'loading' ? 'Đang tạo...' : 'Tạo danh mục'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Thêm món mới</h2>
                <p className="text-sm text-gray-500">POST /catalog/items/</p>
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                ITEM
              </span>
            </div>

            <form className="space-y-4" onSubmit={handleCreateItem}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên món ăn</label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(event) => setItemForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
                  placeholder="Ví dụ: Double Beef Burger"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                <select
                  value={itemForm.categoryId}
                  onChange={(event) => setItemForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
                  required
                >
                  <option value="">— Chọn danh mục —</option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VND)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={itemForm.price}
                  onChange={(event) => setItemForm((prev) => ({ ...prev, price: event.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
                  placeholder="Ví dụ: 65000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  rows="3"
                  value={itemForm.description}
                  onChange={(event) => setItemForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
                  placeholder="Mô tả ngắn cho món ăn"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="create-is-available"
                  checked={itemForm.isAvailable}
                  onChange={(event) => setItemForm((prev) => ({ ...prev, isAvailable: event.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="create-is-available" className="text-sm text-gray-700">
                  Đang mở bán
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ảnh minh họa (tùy chọn)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setItemForm((prev) => ({ ...prev, imageFile: event.target.files?.[0] || null }))
                  }
                  className="w-full text-sm text-gray-600"
                />
              </div>

              {itemStatus.message && (
                <p
                  className={`text-sm ${
                    itemStatus.status === 'error'
                      ? 'text-red-600'
                      : itemStatus.status === 'success'
                        ? 'text-green-600'
                        : 'text-gray-600'
                  }`}
                >
                  {itemStatus.message}
                </p>
              )}

              <button
                type="submit"
                disabled={itemStatus.status === 'loading'}
                className="w-full py-2 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition disabled:opacity-60"
              >
                {itemStatus.status === 'loading' ? 'Đang tạo...' : 'Tạo món mới'}
              </button>
            </form>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Danh sách món ăn</h2>
              <p className="text-sm text-gray-500">GET /catalog/categories/ → items</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="flex-1">
                <label className="sr-only" htmlFor="search-items">
                  Tìm kiếm món
                </label>
                <input
                  id="search-items"
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Tìm theo tên hoặc mô tả"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
                />
              </div>
              <div>
                <select
                  value={filterCategoryId}
                  onChange={(event) => setFilterCategoryId(event.target.value)}
                  className="w-full sm:w-48 rounded-lg border border-gray-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
                >
                  <option value="">Tất cả danh mục</option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-10 text-center text-gray-500">Đang tải thông tin...</div>
          ) : filteredItems.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-500">Không tìm thấy món ăn phù hợp.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              <div className="hidden lg:grid lg:grid-cols-6 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                <span>Món</span>
                <span>Danh mục</span>
                <span>Giá bán</span>
                <span className="col-span-2">Mô tả</span>
                <span className="text-right">Hành động</span>
              </div>

              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="px-6 py-4 grid gap-3 lg:grid-cols-6 lg:items-center border-t border-gray-50 lg:border-none"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      {item.name}
                      <span
                        className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                          item.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {item.is_available ? 'Đang bán' : 'Tắt'}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">#{item.id}</p>
                  </div>
                  <div className="text-sm text-gray-700">{item.category_name}</div>
                  <div className="text-sm text-gray-900">{formatCurrency(item.price)}</div>
                  <div className="lg:col-span-2 text-sm text-gray-600 line-clamp-3">
                    {item.description || <span className="text-gray-400 italic">Chưa có mô tả</span>}
                  </div>
                  <div className="flex flex-wrap lg:justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleAvailability(item)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:border-gray-300"
                    >
                      {item.is_available ? 'Tắt bán' : 'Mở bán'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingItem(item)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:border-gray-300"
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item)}
                      disabled={deletingId === item.id}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:border-red-300 disabled:opacity-60"
                    >
                      {deletingId === item.id ? 'Đang xóa...' : 'Xóa'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Hoạt động gần đây</h2>
            <button
              type="button"
              onClick={() => setActivityLog([])}
              className="text-sm text-gray-500 hover:text-red-600"
            >
              Xóa lịch sử
            </button>
          </div>
          {activityLog.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có hoạt động nào.</p>
          ) : (
            <ul className="space-y-3">
              {activityLog.map((entry, index) => (
                <li key={`${entry.time}-${index}`} className="flex items-start gap-3">
                  <span className="w-2 h-2 mt-2 rounded-full bg-red-500" />
                  <div>
                    <p className="text-sm text-gray-800">{entry.message}</p>
                    <p className="text-xs text-gray-500">{entry.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {editingItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                Chỉnh sửa món #{editingItem.id}: {editingItem.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Đóng</span>
                ×
              </button>
            </div>

            <form className="px-6 py-6 space-y-4" onSubmit={handleEditItem}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên món ăn</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                  <select
                    value={editForm.categoryId}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
                    required
                  >
                    <option value="">— Chọn danh mục —</option>
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VND)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={editForm.price}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, price: event.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  rows="3"
                  value={editForm.description}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-is-available"
                  checked={editForm.isAvailable}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, isAvailable: event.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="edit-is-available" className="text-sm text-gray-700">
                  Đang mở bán
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cập nhật ảnh (tùy chọn)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, imageFile: event.target.files?.[0] || null }))
                  }
                  className="w-full text-sm text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">Ảnh mới sẽ thay thế ảnh hiện tại sau khi lưu.</p>
              </div>

              {editStatus.message && (
                <p
                  className={`text-sm ${
                    editStatus.status === 'error'
                      ? 'text-red-600'
                      : editStatus.status === 'success'
                        ? 'text-green-600'
                        : 'text-gray-600'
                  }`}
                >
                  {editStatus.message}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:border-gray-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editStatus.status === 'loading'}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition disabled:opacity-60"
                >
                  {editStatus.status === 'loading' ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
