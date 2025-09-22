// components/ItemCard.jsx
export default function ItemCard({ item, onAddToCart }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-[3/2] overflow-hidden">
        <img 
          src={item.image_url || 'https://via.placeholder.com/300x200'} 
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
        <p className="text-sm text-gray-500 mb-3">{item.category}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-red-600">
            {Number(item.price).toLocaleString()}₫
          </span>
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