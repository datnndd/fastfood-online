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
      className="relative overflow-hidden rounded-2xl border-2 border-sky-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer"
    >
      <div className="relative aspect-[3/2] overflow-hidden">
        <img
          src={item.image_url || 'https://via.placeholder.com/300x200'}
          alt={item.name}
          className="w-full h-full object-cover"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-semibold uppercase tracking-wide text-white">
            Hết hàng
          </div>
        )}
        {discountLabel && (
          <div className="absolute top-0 right-0">
            <div className="bg-[#ee4d2d] text-white text-xs font-bold px-2 py-1 rounded-bl-lg">
              {discountLabel}
            </div>
          </div>
        )}
      </div>
      <div className="p-4">
        {displayCategory && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onCategoryClick && onCategoryClick()
            }}
            className="mb-3 inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
          >
            <span className="text-[10px] text-sky-500">Danh mục</span>
            {displayCategory}
          </button>
        )}
        <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-bold text-[#ee4d2d]">
              {Number(item.price).toLocaleString()}₫
            </div>
            <div className="text-xs text-gray-500">
              {isOutOfStock
                ? 'Đã hết hàng'
                : hasStockInfo
                  ? `Còn lại: ${rawStock} phần`
                  : 'Còn hàng'}
            </div>
            {hasDiscount && (
              <div className="text-xs text-gray-400 line-through">
                {Number(item.original_price || 0).toLocaleString()}₫
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              handleViewDetail()
            }}
            disabled={status === 'pending'}
            aria-disabled={isOutOfStock}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow transition ${
              isOutOfStock
                ? 'bg-gray-400 hover:bg-gray-400'
                : status === 'pending'
                  ? 'bg-red-400 cursor-wait'
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
            }`}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
