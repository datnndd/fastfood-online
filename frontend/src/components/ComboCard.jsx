const PLACEHOLDER_IMG = 'https://via.placeholder.com/300x200'

const toNumber = (value) => {
  const parsed = Number.parseFloat(value ?? 0)
  return Number.isNaN(parsed) ? 0 : parsed
}

const formatCurrency = (value) => toNumber(value).toLocaleString('vi-VN')

export default function ComboCard({ combo, onAddToCart }) {
  const itemsPreview = (combo.items ?? []).slice(0, 3)
  const remainingCount = Math.max((combo.items?.length ?? 0) - itemsPreview.length, 0)
  const discountLabel = (() => {
    const discount = combo.discount_percentage ?? combo.savings
    const numeric = toNumber(discount)
    if (!numeric) return null
    return `-${Math.round(numeric)}%`
  })()

  const handleAdd = () => {
    if (combo?.is_available !== false && typeof onAddToCart === 'function') {
      onAddToCart(combo)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-[3/2] overflow-hidden">
        <img
          src={combo.image_url || PLACEHOLDER_IMG}
          alt={combo.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-gray-900">{combo.name}</h3>
          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
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
            <div className="text-lg font-bold text-red-600">
              {formatCurrency(combo.final_price)}₫
            </div>
            <div className="text-xs text-gray-400 line-through">
              {formatCurrency(combo.original_price)}₫
            </div>
          </div>
          <div className="text-right">
            {discountLabel && (
              <div className="text-xs font-semibold text-green-600">
                {discountLabel}
              </div>
            )}
            <button
              onClick={handleAdd}
              disabled={combo?.is_available === false}
              className="mt-2 inline-flex items-center justify-center rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              Thêm combo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
