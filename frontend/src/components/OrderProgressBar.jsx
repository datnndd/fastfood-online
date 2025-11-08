import { useMemo } from 'react'

const ORDER_STEPS = [
  {
    key: 'PLACED',
    label: 'Đơn hàng đã đặt',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    key: 'CONFIRMED',
    label: 'Đã xác nhận',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    key: 'READY',
    label: 'Sẵn sàng giao hàng',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    )
  },
  {
    key: 'DELIVERING',
    label: 'Đang giao hàng',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    key: 'COMPLETED',
    label: 'Đã hoàn thành',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
]

// Mapping từ status sang step key
const statusToStep = {
  'PREPARING': 'PLACED',
  'READY': 'READY',
  'DELIVERING': 'DELIVERING',
  'COMPLETED': 'COMPLETED',
  'CANCELLED': null // Không hiển thị progress cho đơn hủy
}

export default function OrderProgressBar({ order }) {
  const { currentStepIndex, completedSteps } = useMemo(() => {
    if (!order || order.status === 'CANCELLED') {
      return { currentStepIndex: -1, completedSteps: [] }
    }

    // Với PREPARING, coi như đã qua bước PLACED, và có thể CONFIRMED
    if (order.status === 'PREPARING') {
      const orderTime = new Date(order.created_at)
      const currentTime = new Date()
      const diffInSeconds = (currentTime - orderTime) / 1000
      if (diffInSeconds > 60) {
        // Đã xác nhận - hiển thị bước CONFIRMED là current
        return { 
          currentStepIndex: 1, 
          completedSteps: ['PLACED', 'CONFIRMED'] 
        }
      } else {
        // Chỉ mới đặt - hiển thị bước PLACED là current
        return { 
          currentStepIndex: 0, 
          completedSteps: ['PLACED'] 
        }
      }
    }

    // Với các trạng thái khác, map trực tiếp
    const currentStepKey = statusToStep[order.status]
    const currentIndex = ORDER_STEPS.findIndex(step => step.key === currentStepKey)
    
    // Tính toán các bước đã hoàn thành - bao gồm tất cả các bước từ đầu đến bước hiện tại
    const completed = []
    for (let i = 0; i <= currentIndex; i++) {
      if (ORDER_STEPS[i]) {
        completed.push(ORDER_STEPS[i].key)
      }
    }

    return { currentStepIndex: currentIndex, completedSteps: completed }
  }, [order])

  if (!order || order.status === 'CANCELLED') {
    return null
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Tính toán thời gian cho mỗi bước - chỉ hiển thị thời gian thực tế
  const getStepTime = (stepKey) => {
    if (!order) return ''
    
    const stepOrder = ['PLACED', 'CONFIRMED', 'READY', 'DELIVERING', 'COMPLETED']
    const stepIndex = stepOrder.indexOf(stepKey)
    const currentStepIndexFromOrder = stepOrder.indexOf(statusToStep[order.status] || 'PLACED')
    
    // Chỉ hiển thị thời gian cho các bước đã hoàn thành
    if (stepIndex <= currentStepIndexFromOrder) {
      if (stepKey === 'PLACED') {
        return formatDate(order.created_at)
      }
      // Các bước khác - dùng created_at tạm thời (sau này có thể thêm timestamps riêng từ backend)
      // Tính toán thời gian giả định dựa trên thời điểm hiện tại và trạng thái
      const orderTime = new Date(order.created_at)
      const now = new Date()
      
      // Ước tính thời gian dựa trên status hiện tại
      if (stepKey === 'CONFIRMED' && order.status !== 'PREPARING') {
        // Nếu đã qua PREPARING, coi như CONFIRMED là ngay sau PLACED
        const confirmedTime = new Date(orderTime)
        confirmedTime.setMinutes(confirmedTime.getMinutes() + 5)
        return formatDate(confirmedTime.toISOString())
      }
      
      if (stepKey === 'READY' && ['READY', 'DELIVERING', 'COMPLETED'].includes(order.status)) {
        // Ước tính thời gian READY (dùng thời gian thực tế nếu có)
        return formatDate(order.created_at) // Tạm thời, sau này có thể thêm ready_at từ backend
      }
      
      if (stepKey === 'DELIVERING' && ['DELIVERING', 'COMPLETED'].includes(order.status)) {
        return formatDate(order.created_at) // Tạm thời
      }
      
      if (stepKey === 'COMPLETED' && order.status === 'COMPLETED') {
        return formatDate(order.created_at) // Tạm thời, sau này có thể thêm completed_at từ backend
      }
    }
    
    // Không hiển thị thời gian cho các bước chưa hoàn thành
    return ''
  }


  return (
    <div className="bg-white border rounded-lg p-6 mb-4 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wide">MÃ ĐƠN HÀNG</span>
              <div className="text-xl font-bold text-gray-900 mt-1">#{order.id}</div>
            </div>
          </div>
          <div className="text-right">
            <div className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${
              order.status === 'COMPLETED' 
                ? 'text-green-700 bg-green-50 border-green-300'
                : order.status === 'DELIVERING'
                ? 'text-purple-700 bg-purple-50 border-purple-300'
                : order.status === 'READY'
                ? 'text-blue-700 bg-blue-50 border-blue-300'
                : 'text-yellow-700 bg-yellow-50 border-yellow-300'
            }`}>
              {order.status === 'COMPLETED' && 'ĐƠN HÀNG ĐÃ HOÀN THÀNH'}
              {order.status === 'DELIVERING' && 'ĐANG GIAO HÀNG'}
              {order.status === 'READY' && 'SẴN SÀNG GIAO HÀNG'}
              {order.status === 'PREPARING' && 'ĐANG XỬ LÝ'}
            </div>
          </div>
        </div>
        
        {order.status === 'COMPLETED' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
            <p className="text-sm text-green-800 font-medium flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Cảm ơn bạn đã mua sắm tại McDono!
            </p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative py-2">
        {/* Progress Line Background */}
        <div className="absolute top-6 left-0 right-0 h-2 bg-gray-200 rounded-full">
          {/* Progress Line Fill */}
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-700 shadow-sm"
            style={{ 
              width: `${Math.max(0, Math.min(100, (currentStepIndex / (ORDER_STEPS.length - 1)) * 100))}%` 
            }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between items-start">
          {ORDER_STEPS.map((step, index) => {
            const isCompleted = completedSteps.includes(step.key)
            const isCurrent = index === currentStepIndex
            const isPast = index < currentStepIndex
            const isUpcoming = index > currentStepIndex

            return (
              <div key={step.key} className="flex flex-col items-center flex-1 relative z-10">
                {/* Step Circle */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-3 transition-all duration-300 shadow-md ${
                    isCompleted || isPast
                      ? 'bg-green-600 border-green-700 text-white scale-110'
                      : isCurrent
                      ? 'bg-white border-green-600 text-green-600 ring-4 ring-green-100 scale-110 animate-pulse'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                  style={{ borderWidth: '3px' }}
                >
                  {isCompleted || isPast ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.icon
                  )}
                </div>

                {/* Step Label */}
                <div className="mt-4 text-center max-w-[130px]">
                  <div
                    className={`text-xs font-semibold mb-1 ${
                      isCompleted || isPast
                        ? 'text-green-700'
                        : isCurrent
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </div>
                  {getStepTime(step.key) && (
                    <div className={`text-xs mt-1 ${
                      isCompleted || isPast || isCurrent
                        ? 'text-gray-700 font-medium'
                        : 'text-gray-400'
                    }`}>
                      {getStepTime(step.key)}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
