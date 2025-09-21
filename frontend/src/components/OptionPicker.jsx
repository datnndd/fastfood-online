export default function OptionPicker({ group, value, onChange }) {
  const isSingle = (group.max_select ?? 1) === 1
  const selected = new Set(value || [])
  
  // Lọc ra các options thuộc group này
  const selectedInGroup = value?.filter(optionId => 
    group.options?.some(opt => opt.id === optionId)
  ) || []

  function toggle(id) {
    if (isSingle) {
      // Single select: replace selection
      const newSelected = value.filter(optionId => 
        !group.options?.some(opt => opt.id === optionId)
      )
      onChange([...newSelected, id])
    } else {
      // Multiple select với giới hạn
      const isCurrentlySelected = selectedInGroup.includes(id)
      
      if (isCurrentlySelected) {
        // Remove option
        const newValue = value.filter(optionId => optionId !== id)
        onChange(newValue)
      } else {
        // Add option (check limits)
        const maxSelect = group.max_select || 999
        if (selectedInGroup.length >= maxSelect) {
          alert(`Bạn chỉ có thể chọn tối đa ${maxSelect} tùy chọn`)
          return
        }
        onChange([...value, id])
      }
    }
  }

  const isSelected = (optionId) => selectedInGroup.includes(optionId)

  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {group.options?.map(opt => {
        const selected = isSelected(opt.id)
        const priceText = Number(opt.price_delta) 
          ? ` (+${Number(opt.price_delta).toLocaleString()}₫)` 
          : ''

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
              selected 
                ? 'bg-red-600 text-white border-red-600 shadow-sm' 
                : 'bg-white text-gray-700 border-gray-300 hover:border-red-300 hover:bg-red-50'
            }`}
          >
            {opt.name}{priceText}
          </button>
        )
      })}
      
      {/* Hiển thị thông tin selection limits */}
      {!isSingle && group.max_select && (
        <div className="w-full text-xs text-gray-500 mt-1">
          Đã chọn: {selectedInGroup.length}/{group.max_select}
          {group.min_select > 0 && ` (Tối thiểu: ${group.min_select})`}
        </div>
      )}
    </div>
  )
}