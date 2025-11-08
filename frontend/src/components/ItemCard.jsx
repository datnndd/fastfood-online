// components/ItemCard.jsx
export default function ItemCard({ item, onAddToCart, categoryName, onCategoryClick }) {
  const displayCategory = categoryName || (typeof item.category === 'string' ? item.category : null)

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-sky-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-lg">
      <div className="aspect-[3/2] overflow-hidden">
        <img 
          src={item.image_url || 'https://via.placeholder.com/300x200'} 
          alt={item.name}
          className="w-full h-full object-cover"
        />
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
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-red-600">
            {Number(item.price).toLocaleString()}₫
          </span>
          <button
            onClick={() => onAddToCart(item)}
            className="rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:from-red-600 hover:to-red-700"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}
