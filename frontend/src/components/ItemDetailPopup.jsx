// components/ItemDetailPopup.jsx
import { useEffect, useMemo, useState } from 'react'
import OptionPicker from './OptionPicker.jsx'

export default function ItemDetailPopup({ item, isOpen, onClose, onAddToCart }) {
  const optionGroups = useMemo(() => {
    if (!item?.option_groups) return []
    return item.option_groups
      .filter((group) => Array.isArray(group.options) && group.options.length > 0)
      .map((group) => ({
        ...group,
        options: group.options.filter((option) => option && typeof option.id !== 'undefined')
      }))
  }, [item])

  const [selectedOptions, setSelectedOptions] = useState(() => {
    const initialOptions = []
    optionGroups.forEach((group) => {
      if (group.required && group.options?.length > 0) {
        initialOptions.push(group.options[0].id)
      }
    })
    return initialOptions
  })

  const [quantity, setQuantity] = useState(1)
  const rawStock = Number(item?.stock)
  const hasStockInfo = Number.isFinite(rawStock)
  const isOutOfStock = item?.is_available === false || (hasStockInfo && rawStock <= 0)
  const maxQuantity = hasStockInfo ? Math.max(0, rawStock) : Infinity
  const hasOptionGroups = optionGroups.length > 0

  const flattenedOptions = useMemo(() => optionGroups.flatMap((group) => group.options || []), [optionGroups])

  const selectionIsValid = useMemo(() => {
    if (!item) return false
    if (!hasOptionGroups) return true
    return optionGroups.every((group) => {
      if (!group.required) return true
      const selectedInGroup = selectedOptions.filter((optionId) =>
        group.options?.some((opt) => opt.id === optionId)
      )
      const requiredCount = group.min_select || 1
      return selectedInGroup.length >= requiredCount
    })
  }, [item, optionGroups, selectedOptions, hasOptionGroups])

  // Reset khi item thay đổi
  useEffect(() => {
    if (!item) return
    const initialOptions = []
    optionGroups.forEach((group) => {
      if (group.required && group.options?.length > 0) {
        initialOptions.push(group.options[0].id)
      }
    })
    setSelectedOptions(initialOptions)
    setQuantity(() => {
      if (!hasStockInfo) return 1
      if (maxQuantity === 0) return 1
      return Math.min(1, maxQuantity)
    })
  }, [item, optionGroups, hasStockInfo, maxQuantity])

  // Tính tổng giá
  const calculateTotalPrice = () => {
    if (!item) return 0
    const basePrice = Number(item.price ?? item.base_price ?? 0)
    const optionsPrice = selectedOptions.reduce((sum, optionId) => {
      const option = flattenedOptions.find((opt) => opt.id === optionId)
      return sum + (Number(option?.price_delta) || 0)
    }, 0)
    return (basePrice + optionsPrice) * quantity
  }

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.()
    }
  }

  const handleAddToCart = () => {
    if (!selectionIsValid) {
      alert('Vui lòng chọn đầy đủ các tùy chọn bắt buộc')
      return
    }
    if (isOutOfStock) {
      alert('Món này đã hết hàng.')
      return
    }
    if (hasStockInfo && quantity > rawStock) {
      alert(`Chỉ còn ${rawStock} phần cho món này.`)
      return
    }

    const cartItem = {
      menu_item_id: item.id,
      quantity: quantity,
      option_ids: selectedOptions
    }
    
    onAddToCart(cartItem)
    onClose?.()
  }

  if (!isOpen || !item) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white/95 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-red-500">Chi tiết món</p>
            <h2 className="text-2xl font-bold text-gray-900">{item.name}</h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Đóng"
            className="text-gray-400 transition hover:text-gray-600"
          >
            <span className="text-3xl leading-none">×</span>
          </button>
        </div>
        
        <div className="grid gap-6 p-6 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="overflow-hidden rounded-xl border border-gray-100">
              <img
                src={item.image_url || 'https://via.placeholder.com/600x400'}
                alt={item.name}
                className="h-60 w-full object-cover"
              />
            </div>
            {item.description && <p className="mt-4 text-sm text-gray-600">{item.description}</p>}
            {hasStockInfo && (
              <p className={`mt-3 text-sm font-medium ${isOutOfStock ? 'text-red-500' : 'text-emerald-600'}`}>
                {isOutOfStock ? 'Món này đã hết hàng.' : `Còn lại: ${rawStock} phần trong kho.`}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5">
            <p className="text-sm font-semibold text-gray-700">Tùy chọn & số lượng</p>
            <div className="mt-4 space-y-4">
              {hasOptionGroups ? (
                optionGroups.map((group, index) => (
                  <OptionPicker
                    key={group.id || `${group.name}-${index}`}
                    group={group}
                    value={selectedOptions}
                    onChange={setSelectedOptions}
                  />
                ))
              ) : (
                <div className="rounded-xl bg-white px-4 py-3 text-sm text-gray-600">
                  Món này không có tùy chọn thêm. Bạn chỉ cần chọn số lượng bên dưới.
                </div>
              )}

              <div className="rounded-xl bg-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Số lượng:</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      disabled={quantity <= 1}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-lg leading-none text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="min-w-[32px] text-center text-lg font-semibold">{quantity}</span>
                    <button
                      onClick={() => {
                        setQuantity((prev) => {
                          const next = prev + 1
                          if (!hasStockInfo) return next
                          return Math.min(next, Math.max(rawStock, 1))
                        })
                      }}
                      disabled={isOutOfStock || (hasStockInfo && quantity >= Math.max(rawStock, 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-lg leading-none text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white px-4 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Tổng cộng</span>
                  <span className="text-2xl font-bold text-red-600">{calculateTotalPrice().toLocaleString()}₫</span>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={!selectionIsValid || isOutOfStock}
                  className={`mt-4 w-full rounded-xl py-3 text-sm font-semibold uppercase tracking-wide transition-colors ${
                    selectionIsValid && !isOutOfStock
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isOutOfStock ? 'Đã hết hàng' : 'Thêm vào giỏ'}
                </button>
              </div>
            </div>
          </div>
        
        </div>
      </div>
    </div>
  )
}
