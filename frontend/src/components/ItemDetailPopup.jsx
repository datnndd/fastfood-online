// components/ItemDetailPopup.jsx
import { useState } from 'react'
import OptionPicker from './OptionPicker.jsx'

export default function ItemDetailPopup({ item, isOpen, onClose, onAddToCart }) {
  const [selectedOptions, setSelectedOptions] = useState(() => {
    // Tự động chọn option đầu tiên của mỗi group required
    const initialOptions = []
    item?.option_groups?.forEach(group => {
      if (group.required && group.options?.length > 0) {
        initialOptions.push(group.options[0].id)
      }
    })
    return initialOptions
  })
  
  const [quantity, setQuantity] = useState(1)

  // Reset khi item thay đổi
  useState(() => {
    if (item) {
      const initialOptions = []
      item.option_groups?.forEach(group => {
        if (group.required && group.options?.length > 0) {
          initialOptions.push(group.options[0].id)
        }
      })
      setSelectedOptions(initialOptions)
      setQuantity(1)
    }
  }, [item])

  // Tính tổng giá
  const calculateTotalPrice = () => {
    if (!item) return 0
    const basePrice = Number(item.price)
    const optionsPrice = selectedOptions.reduce((sum, optionId) => {
      const option = item.option_groups
        ?.flatMap(g => g.options)
        ?.find(opt => opt.id === optionId)
      return sum + (Number(option?.price_delta) || 0)
    }, 0)
    return (basePrice + optionsPrice) * quantity
  }

  // Kiểm tra validation
  const isValidSelection = () => {
    if (!item) return false
    return item.option_groups?.every(group => {
      if (!group.required) return true
      const selectedInGroup = selectedOptions.filter(optionId => 
        group.options?.some(opt => opt.id === optionId)
      )
      return selectedInGroup.length >= (group.min_select || 1)
    })
  }

  const handleAddToCart = () => {
    if (!isValidSelection()) {
      alert('Vui lòng chọn đầy đủ các tùy chọn bắt buộc')
      return
    }

    const cartItem = {
      menu_item_id: item.id,
      quantity: quantity,
      option_ids: selectedOptions
    }
    
    onAddToCart(cartItem)
    onClose()
  }

  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{item.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="p-4">
          <img 
            src={item.image_url || 'https://via.placeholder.com/400x200'} 
            alt={item.name}
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
          
          <p className="text-gray-600 mb-4">{item.description}</p>
          
          {/* Options */}
          {item.option_groups?.map(group => (
            <OptionPicker
              key={group.id}
              group={group}
              value={selectedOptions}
              onChange={setSelectedOptions}
            />
          ))}
          
          {/* Quantity */}
          <div className="flex items-center justify-between mb-6">
            <span className="font-medium text-gray-900">Số lượng:</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
              >
                -
              </button>
              <span className="font-medium text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
              >
                +
              </button>
            </div>
          </div>
          
          {/* Total & Add to cart */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium">Tổng cộng:</span>
              <span className="text-xl font-bold text-red-600">
                {calculateTotalPrice().toLocaleString()}₫
              </span>
            </div>
            
            <button
              onClick={handleAddToCart}
              disabled={!isValidSelection()}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                isValidSelection()
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}