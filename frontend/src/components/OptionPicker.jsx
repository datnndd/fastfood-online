// components/OptionPicker.jsx
export default function OptionPicker({ group, value, onChange }) {
  const isSingle = (group.max_select ?? 1) === 1
  
  // Lọc ra các options thuộc group này
  const selectedInGroup = value?.filter(optionId => 
    group.options?.some(opt => opt.id === optionId)
  ) || []

  function toggle(optionId) {
    if (isSingle) {
      // Single select: thay thế selection
      const newSelected = value.filter(id => 
        !group.options?.some(opt => opt.id === id)
      )
      onChange([...newSelected, optionId])
    } else {
      // Multiple select với giới hạn
      const isCurrentlySelected = selectedInGroup.includes(optionId)
      
      if (isCurrentlySelected) {
        // Remove option
        onChange(value.filter(id => id !== optionId))
      } else {
        // Add option (check limits)
        const maxSelect = group.max_select || 999
        if (selectedInGroup.length >= maxSelect) {
          alert(`Bạn chỉ có thể chọn tối đa ${maxSelect} tùy chọn cho ${group.name}`)
          return
        }
        onChange([...value, optionId])
      }
    }
  }

  const isSelected = (optionId) => selectedInGroup.includes(optionId)

  return (
    <div className="mb-4">
      <div className="font-medium text-gray-900 mb-2">
        {group.name}{group.required ? ' *' : ''}
      </div>
      <div className="flex flex-wrap gap-2">
        {group.options?.map(option => {
          const selected = isSelected(option.id)
          const priceText = Number(option.price_delta) 
            ? ` (+${Number(option.price_delta).toLocaleString()}₫)` 
            : ''

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggle(option.id)}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                selected 
                  ? 'bg-red-600 text-white border-red-600 shadow-sm' 
                  : 'bg-white text-gray-700 border-gray-300 hover:border-red-300 hover:bg-red-50'
              }`}
            >
              {option.name}{priceText}
            </button>
          )
        })}
      </div>
      
      {/* Hiển thị thông tin selection limits */}
      {!isSingle && group.max_select && (
        <div className="text-xs text-gray-500 mt-1">
          Đã chọn: {selectedInGroup.length}/{group.max_select}
          {group.min_select > 0 && ` (Tối thiểu: ${group.min_select})`}
        </div>
      )}
    </div>
  )
}