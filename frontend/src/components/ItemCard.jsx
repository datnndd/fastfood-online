import { IMAGE_PLACEHOLDER } from '../lib/placeholders'

// components/ItemCard.jsx
export default function ItemCard({ item, onViewDetail, categoryName, onCategoryClick, status = 'idle' }) {
  const displayCategory = categoryName || (typeof item.category === 'string' ? item.category : null)
  const hasDiscount =
    (typeof item?.discount_percentage === 'number' && item.discount_percentage > 0) ||
    (item?.original_price && Number(item.original_price) > Number(item.price))
  const rawStock = Number(item?.stock)
  const hasStockInfo = Number.isFinite(rawStock)
  const isOutOfStock = item?.is_available === false || (hasStockInfo && rawStock <= 0)

  const discountLabel = (() => {
    if (typeof item?.discount_percentage === 'number' && item.discount_percentage > 0) {
      return `-${Math.round(item.discount_percentage)}%`
    }
    if (item?.original_price && Number(item.original_price) > Number(item.price)) {
      const pct = Math.round((1 - Number(item.price) / Number(item.original_price)) * 100)
      return pct > 0 ? `-${pct}%` : null
    }
    return null
  })()

  const handleViewDetail = () => {
    onViewDetail?.(item)
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
      aria-label={`Xem chi tiết ${item.name}`}
      onClick={handleViewDetail}
      onKeyDown={handleCardKeyDown}
      className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer border border-gray-100 hover:border-red-200"
    >
      <div className="relative aspect-[3/2] overflow-hidden">
        <img
          src={item.image_url || IMAGE_PLACEHOLDER}
          alt={item.name}
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
      <div className="p-5">
        {displayCategory && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onCategoryClick && onCategoryClick()
            }}
            className="mb-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-red-600 transition-colors"
          >
            {displayCategory}
          </button>
        )}
        <h3 className="font-bold text-gray-900 mb-2 text-lg line-clamp-1 group-hover:text-red-700 transition-colors">{item.name}</h3>

        <div className="flex items-end justify-between gap-3 mt-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-red-600">
                {Number(item.price).toLocaleString()}₫
              </span>
              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through decoration-red-300">
                  {Number(item.original_price || 0).toLocaleString()}₫
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1 font-medium">
              {isOutOfStock
                ? 'Tạm hết hàng'
                : hasStockInfo
                  ? `Còn: ${rawStock} phần`
                  : 'Sẵn sàng phục vụ'}
            </div>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              handleViewDetail()
            }}
            disabled={status === 'pending'}
            aria-disabled={isOutOfStock}
            className={`rounded-full px-4 py-2 text-sm font-bold shadow-sm transition-all transform active:scale-95 ${isOutOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : status === 'pending'
                  ? 'bg-red-100 text-red-600 cursor-wait'
                  : 'bg-red-50 text-red-700 hover:bg-red-600 hover:text-white hover:shadow-md'
              }`}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
