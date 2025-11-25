import { IMAGE_PLACEHOLDER } from '../lib/placeholders'

const PLACEHOLDER_IMG = IMAGE_PLACEHOLDER

const toNumber = (value) => {
  const parsed = Number.parseFloat(value ?? 0)
  return Number.isNaN(parsed) ? 0 : parsed
}

const formatCurrency = (value) => toNumber(value).toLocaleString('vi-VN')

export default function ComboCard({ combo, onViewDetail, categoryName, onCategoryClick, status = 'idle' }) {
  const itemsPreview = (combo.items ?? []).slice(0, 3)
  const remainingCount = Math.max((combo.items?.length ?? 0) - itemsPreview.length, 0)
  const rawStock = Number(combo?.stock)
  const hasStockInfo = Number.isFinite(rawStock)
  const isOutOfStock = combo?.is_available === false || (hasStockInfo && rawStock <= 0)
  const discountLabel = (() => {
    const discount = combo.discount_percentage ?? combo.savings
    const numeric = toNumber(discount)
    if (!numeric) return null
    return `-${Math.round(numeric)}%`
  })()

  const handleViewDetail = () => {
    onViewDetail?.(combo)
  }

  const handleCardKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleViewDetail()
    }
  }

  const actionLabel = (() => {
    if (isOutOfStock) return 'Hết hàng'
    if (status === 'pending') return 'Đang thêm...'
    if (status === 'success') return 'Đã thêm ✓'
    if (status === 'error') return 'Thử lại'
    return 'Xem chi tiết'
  })()

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Xem chi tiết combo ${combo.name}`}
      onClick={handleViewDetail}
      onKeyDown={handleCardKeyDown}
      className="group relative overflow-hidden rounded-2xl bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer border-2 vn-border-gold"
    >
      <div className="relative aspect-[3/2] overflow-hidden">
        <img
          src={combo.image_url || PLACEHOLDER_IMG}
          alt={combo.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm font-bold uppercase tracking-widest text-white backdrop-blur-sm">
            Hết hàng
          </div>
        )}
        {discountLabel && (
          <div className="absolute top-2 right-2">
            <div className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md border border-white/20 animate-pulse">
              {discountLabel}
            </div>
          </div>
        )}
      </div>
      <div className="p-5 space-y-3 bg-gradient-to-b from-white to-amber-50/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            {categoryName && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onCategoryClick && onCategoryClick()
                }}
                className="mb-2 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700 hover:border-amber-300 hover:bg-amber-100 transition-colors"
              >
                <span className="text-[9px] text-amber-500">Danh mục</span>
                {categoryName}
              </button>
            )}
            <h3 className="font-bold text-gray-900 text-lg group-hover:text-amber-700 transition-colors">{combo.name}</h3>
          </div>
          <span className="text-xs bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 px-3 py-1 rounded-full font-bold shadow-sm">
            Combo
          </span>
        </div>

        {combo.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{combo.description}</p>
        )}

        {itemsPreview.length > 0 && (
          <ul className="text-xs text-gray-500 space-y-1 bg-white/50 p-2 rounded-lg border border-amber-100">
            {itemsPreview.map((item) => (
              <li key={item.id} className="flex items-center gap-1">
                <span className="text-amber-500">•</span> {item.menu_item?.name} × {item.quantity}
              </li>
            ))}
            {remainingCount > 0 && (
              <li className="font-semibold text-amber-600 pl-2">+ {remainingCount} món khác</li>
            )}
          </ul>
        )}

        <div className="flex items-end justify-between pt-2">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-red-600">
                {formatCurrency(combo.final_price)}₫
              </span>
              <span className="text-xs text-gray-400 line-through decoration-red-300">
                {formatCurrency(combo.original_price)}₫
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1 font-medium">
              {isOutOfStock
                ? 'Combo tạm hết'
                : hasStockInfo
                  ? `Còn: ${rawStock} suất`
                  : 'Sẵn sàng phục vụ'}
            </div>
          </div>
          <div className="text-right">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                handleViewDetail()
              }}
              disabled={status === 'pending'}
              aria-disabled={isOutOfStock}
              className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-bold shadow-sm transition-all transform active:scale-95 ${isOutOfStock
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : status === 'pending'
                    ? 'bg-amber-100 text-amber-600 cursor-wait'
                    : 'vn-btn-gold text-amber-900 hover:shadow-md'
                }`}
            >
              {actionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
