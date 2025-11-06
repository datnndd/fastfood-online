// components/ItemCard.jsx
export default function ItemCard({ item, onAddToCart }) {
  const hasDiscount =
    (typeof item?.discount_percentage === 'number' && item.discount_percentage > 0) ||
    (item?.original_price && Number(item.original_price) > Number(item.price))

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative aspect-[3/2] overflow-hidden">
        <img 
          src={item.image_url || 'https://via.placeholder.com/300x200'} 
          alt={item.name}
          className="w-full h-full object-cover"
        />
        {discountLabel && (
          <div className="absolute top-0 right-0">
            <div className="bg-[#ee4d2d] text-white text-xs font-bold px-2 py-1 rounded-bl-lg">
              {discountLabel}
            </div>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
        <p className="text-sm text-gray-500 mb-3">{item.category}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-[#ee4d2d]">
            {Number(item.price).toLocaleString()}₫
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through mr-2">
              {Number(item.original_price || 0).toLocaleString()}₫
            </span>
          )}
          <button
            onClick={() => onAddToCart(item)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}