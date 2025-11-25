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
      <div className="font-bold text-gray-900 mb-2 flex items-center gap-2">
        <span className="w-1 h-4 bg-red-600 rounded-full"></span>
        {group.name}
        {group.required && <span className="text-red-600">*</span>}
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
              className={`px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all shadow-sm ${selected
                  ? 'vn-btn-primary border-transparent'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-700'
                }`}
            >
              {option.name}{priceText}
            </button>
          )
        })}
      </div>

      {/* Hiển thị thông tin selection limits */}
      {!isSingle && group.max_select && (
        <div className="text-xs font-medium text-gray-500 mt-2 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Đã chọn: <span className="font-bold text-gray-900">{selectedInGroup.length}/{group.max_select}</span>
          {group.min_select > 0 && ` (Tối thiểu: ${group.min_select})`}
        </div>
      )}
    </div>
  )
}