import { useEffect, useMemo, useState } from 'react'
import { IMAGE_PLACEHOLDER } from '../lib/placeholders'

const PLACEHOLDER_IMG = IMAGE_PLACEHOLDER

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="vn-card border-2 vn-border-lotus shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative bg-white">
        <div className="sticky top-0 flex items-center justify-between border-b-2 border-red-100 bg-white/95 px-6 py-4 z-10 backdrop-blur">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] vn-text-gold-primary">Chi tiết combo</p>
            <h2 className="text-2xl font-black vn-heading-display text-gray-900">{combo.name}</h2>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="text-gray-400 transition hover:text-red-600"
          >
            <span className="text-4xl leading-none">×</span>
          </button>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border-2 vn-border-lotus shadow-lg">
              <img
                src={combo.image_url || PLACEHOLDER_IMG}
                alt={combo.name}
                className="h-64 w-full object-cover"
              />
            </div>
            {combo.description && <p className="text-sm font-medium text-gray-600 leading-relaxed">{combo.description}</p>}

            {includedItems.length > 0 && (
              <div className="rounded-2xl border-2 border-red-100 bg-red-50/30 p-4">
                <p className="text-sm font-bold vn-text-red-primary uppercase tracking-wide">Combo bao gồm</p>
                <ul className="mt-2 space-y-2 text-sm text-gray-800 font-medium">
                  {includedItems.map((item) => (
                    <li key={item.id} className="flex items-center justify-between">
                      <span>{item.name}</span>
                      <span className="font-bold text-red-600">× {item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {hasStockInfo && (
              <p className={`text-sm font-bold ${isOutOfStock ? 'text-red-600' : 'text-green-600'}`}>
                {isOutOfStock ? 'Combo này đã hết hàng.' : `Còn lại: ${rawStock} suất trong kho.`}
              </p>
            )}
          </div>

          <div className="rounded-2xl border-2 border-red-100 bg-red-50/30 p-5">
            <div className="rounded-xl bg-white border border-red-100 p-4 shadow-sm">
              <div className="text-sm font-bold text-gray-500 uppercase tracking-wide">Giá ưu đãi</div>
              <div className="mt-1 text-3xl font-black vn-text-red-primary">{basePrice.toLocaleString()}₫</div>
              {hasDiscount && (
                <div className="text-sm font-medium text-gray-400 line-through">{originalPrice.toLocaleString()}₫</div>
              )}
            </div>

            <div className="mt-4 rounded-xl bg-white border border-red-100 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">Số lượng</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    disabled={quantity <= 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-gray-200 text-lg leading-none text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-40 font-bold transition-all"
                  >
                    −
                  </button>
                  <span className="min-w-[32px] text-center text-lg font-black vn-text-red-primary">{quantity}</span>
                  <button
                    onClick={() => {
                      setQuantity((prev) => {
                        const next = prev + 1
                        if (!hasStockInfo) return next
                        return Math.min(next, Math.max(rawStock, 1))
                      })
                    }}
                    disabled={isOutOfStock || (hasStockInfo && quantity >= Math.max(rawStock, 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-gray-200 text-lg leading-none text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-40 font-bold transition-all"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-white border border-red-100 px-4 py-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-600">Tổng cộng</span>
                <span className="text-2xl font-black vn-text-red-primary">{totalPrice.toLocaleString()}₫</span>
              </div>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`mt-4 w-full vn-btn-primary py-3 text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
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
