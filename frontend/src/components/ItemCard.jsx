// components/ItemCard.jsx
export default function ItemCard({ item, onAddToCart, categoryName, onCategoryClick }) {
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

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-sky-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-lg">
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
            onClick={() => onCategoryClick && onCategoryClick()}
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
            onClick={() => {
              if (!isOutOfStock) onAddToCart(item)
            }}
            disabled={isOutOfStock}
            className="rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:from-red-600 hover:to-red-700 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
          >
            {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
          </button>
        </div>
      </div>
    </div>
  )
}
