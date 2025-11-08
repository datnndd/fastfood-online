const PLACEHOLDER_IMG = 'https://via.placeholder.com/300x200'

const toNumber = (value) => {
  const parsed = Number.parseFloat(value ?? 0)
  return Number.isNaN(parsed) ? 0 : parsed
}

const formatCurrency = (value) => toNumber(value).toLocaleString('vi-VN')

export default function ComboCard({ combo, onAddToCart, categoryName, onCategoryClick }) {
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

  const handleAdd = () => {
    if (!isOutOfStock && typeof onAddToCart === 'function') {
      onAddToCart(combo)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-amber-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-xl">
      <div className="relative aspect-[3/2] overflow-hidden">
        <img
          src={combo.image_url || PLACEHOLDER_IMG}
          alt={combo.name}
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
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            {categoryName && (
              <button
                type="button"
                onClick={() => onCategoryClick && onCategoryClick()}
                className="mb-2 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700 hover:border-amber-300"
              >
                <span className="text-[9px] text-amber-500">Danh mục</span>
                {categoryName}
              </button>
            )}
            <h3 className="font-semibold text-gray-900">{combo.name}</h3>
          </div>
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold">
            Combo
          </span>
        </div>

        {combo.description && (
          <p className="text-sm text-gray-600">{combo.description}</p>
        )}

        {itemsPreview.length > 0 && (
          <ul className="text-xs text-gray-500 space-y-1">
            {itemsPreview.map((item) => (
              <li key={item.id}>
                • {item.menu_item?.name} × {item.quantity}
              </li>
            ))}
            {remainingCount > 0 && (
              <li>+ {remainingCount} món khác</li>
            )}
          </ul>
        )}

        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-[#ee4d2d]">
              {formatCurrency(combo.final_price)}₫
            </div>
            <div className="text-xs text-gray-400 line-through">
              {formatCurrency(combo.original_price)}₫
            </div>
            <div className="text-xs text-gray-500">
              {isOutOfStock
                ? 'Combo tạm hết'
                : hasStockInfo
                  ? `Còn lại: ${rawStock} suất`
                  : 'Còn hàng'}
            </div>
          </div>
          <div className="text-right">
            <button
              onClick={handleAdd}
              disabled={isOutOfStock}
              className="mt-2 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-sm font-semibold text-white shadow hover:from-amber-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
            >
              {isOutOfStock ? 'Hết hàng' : 'Thêm combo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
