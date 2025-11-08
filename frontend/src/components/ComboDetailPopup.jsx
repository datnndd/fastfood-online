import { useEffect, useMemo, useState } from 'react'

const PLACEHOLDER_IMG = 'https://via.placeholder.com/600x400'

export default function ComboDetailPopup({ combo, isOpen, onClose, onAddToCart }) {
  const [quantity, setQuantity] = useState(1)

  const rawStock = Number(combo?.stock)
  const hasStockInfo = Number.isFinite(rawStock)
  const isOutOfStock = combo?.is_available === false || (hasStockInfo && rawStock <= 0)

  const includedItems = useMemo(() => {
    if (!Array.isArray(combo?.items)) return []
    return combo.items.map((item, index) => {
      const name = item?.menu_item?.name || item?.name || `Món ${index + 1}`
      const qty = Number(item?.quantity) || 1
      return { id: item?.id || `${name}-${index}`, name, quantity: qty }
    })
  }, [combo])

  const basePrice = Number(combo?.final_price ?? combo?.price ?? combo?.base_price ?? 0)
  const originalPrice = Number(combo?.original_price ?? combo?.list_price ?? 0)
  const hasDiscount = Number.isFinite(originalPrice) && originalPrice > basePrice
  const totalPrice = basePrice * quantity

  useEffect(() => {
    if (!combo) return
    setQuantity(1)
  }, [combo])

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.()
    }
  }

  const handleAddToCart = () => {
    if (isOutOfStock) {
      alert('Combo này đã hết hàng.')
      return
    }
    if (hasStockInfo && quantity > rawStock) {
      alert(`Combo chỉ còn ${rawStock} suất.`)
      return
    }
    onAddToCart?.(combo, quantity)
    onClose?.()
  }

  if (!isOpen || !combo) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white/95 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-amber-500">Chi tiết combo</p>
            <h2 className="text-2xl font-bold text-gray-900">{combo.name}</h2>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="text-gray-400 transition hover:text-gray-600"
          >
            <span className="text-3xl leading-none">×</span>
          </button>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-amber-100">
              <img
                src={combo.image_url || PLACEHOLDER_IMG}
                alt={combo.name}
                className="h-64 w-full object-cover"
              />
            </div>
            {combo.description && <p className="text-sm text-gray-600">{combo.description}</p>}

            {includedItems.length > 0 && (
              <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                <p className="text-sm font-semibold text-amber-800">Combo bao gồm</p>
                <ul className="mt-2 space-y-2 text-sm text-amber-900">
                  {includedItems.map((item) => (
                    <li key={item.id} className="flex items-center justify-between">
                      <span>{item.name}</span>
                      <span className="font-semibold">× {item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {hasStockInfo && (
              <p className={`text-sm font-medium ${isOutOfStock ? 'text-red-500' : 'text-emerald-600'}`}>
                {isOutOfStock ? 'Combo này đã hết hàng.' : `Còn lại: ${rawStock} suất trong kho.`}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <div className="text-sm text-gray-500">Giá ưu đãi</div>
              <div className="mt-1 text-3xl font-bold text-[#ee4d2d]">{basePrice.toLocaleString()}₫</div>
              {hasDiscount && (
                <div className="text-sm text-gray-400 line-through">{originalPrice.toLocaleString()}₫</div>
              )}
            </div>

            <div className="mt-4 rounded-xl bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">Số lượng</span>
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

            <div className="mt-4 rounded-xl bg-white px-4 py-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Tổng cộng</span>
                <span className="text-2xl font-bold text-red-600">{totalPrice.toLocaleString()}₫</span>
              </div>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`mt-4 w-full rounded-xl py-3 text-sm font-semibold uppercase tracking-wide transition-colors ${
                  !isOutOfStock ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isOutOfStock ? 'Đã hết hàng' : 'Thêm combo'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
