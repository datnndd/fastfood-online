import { useMemo } from 'react'

export default function OrderTimeline({ order }) {
  const timelineEvents = useMemo(() => {
    if (!order) return []

    const events = []
    const orderTime = new Date(order.created_at)
    
    // Sự kiện: Đơn hàng đã đặt
    events.push({
      time: orderTime,
      status: 'placed',
      title: 'Đơn hàng đã đặt',
      description: 'Đơn hàng của bạn đã được tiếp nhận',
      icon: 'checkmark',
      color: 'green'
    })

    // Sự kiện: Đã xác nhận (sau 60s hoặc khi status không còn PREPARING)
    const currentTime = new Date()
    const diffInSeconds = (currentTime - orderTime) / 1000
    
    if (order.status !== 'PREPARING' || diffInSeconds > 60) {
      const confirmedTime = new Date(orderTime)
      confirmedTime.setSeconds(confirmedTime.getSeconds() + Math.min(300, diffInSeconds)) // 5 phút hoặc thời gian thực tế
      
      events.push({
        time: confirmedTime,
        status: 'confirmed',
        title: 'Đã xác nhận',
        description: 'Đơn hàng đã được xác nhận và đang được chuẩn bị',
        icon: 'checkmark',
        color: 'green'
      })
    }

    // Sự kiện: Sẵn sàng giao hàng
    if (['READY', 'DELIVERING', 'COMPLETED'].includes(order.status)) {
      const readyTime = new Date(orderTime)
      readyTime.setMinutes(readyTime.getMinutes() + 60) // Giả định 60 phút
      
      events.push({
        time: readyTime,
        status: 'ready',
        title: 'Sẵn sàng giao hàng',
        description: 'Đơn hàng đã được chuẩn bị xong và sẵn sàng giao',
        icon: 'checkmark',
        color: 'green'
      })
    }

    // Sự kiện: Đang giao hàng
    if (['DELIVERING', 'COMPLETED'].includes(order.status)) {
      const deliveringTime = new Date(orderTime)
      deliveringTime.setMinutes(deliveringTime.getMinutes() + 90)
      
      events.push({
        time: deliveringTime,
        status: 'delivering',
        title: 'Đang vận chuyển',
        description: 'Đơn hàng sẽ sớm được giao, vui lòng chú ý điện thoại',
        icon: 'truck',
        color: order.status === 'DELIVERING' ? 'blue' : 'green'
      })

      // Thêm sự kiện: Đã đến trạm giao hàng (nếu đang DELIVERING)
      if (order.status === 'DELIVERING') {
        const stationTime = new Date(deliveringTime)
        stationTime.setMinutes(stationTime.getMinutes() + 30)
        
        events.push({
          time: stationTime,
          status: 'at_station',
          title: 'Đơn hàng đã đến trạm giao hàng',
          description: 'Đơn hàng đã đến trạm giao hàng tại khu vực của bạn và sẽ được giao trong vòng 12 giờ tiếp theo',
          icon: 'location',
          color: 'blue'
        })
      }
    }

    // Sự kiện: Đã giao hàng
    if (order.status === 'COMPLETED') {
      const completedTime = new Date(orderTime)
      completedTime.setMinutes(completedTime.getMinutes() + 120)
      
      events.push({
        time: completedTime,
        status: 'delivered',
        title: 'Đã giao',
        description: 'Giao hàng thành công',
        icon: 'checkmark',
        color: 'green'
      })
    }

    // Sắp xếp theo thời gian (mới nhất ở trên)
    return events.sort((a, b) => b.time - a.time)
  }, [order])

  if (!order || timelineEvents.length === 0) {
    return null
  }

  const formatDateTime = (date) => {
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getIcon = (iconType, color) => {
    const iconClass = `w-5 h-5 ${
      color === 'green' ? 'text-green-600' : 'text-blue-600'
    }`
    
    if (iconType === 'checkmark') {
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    } else if (iconType === 'truck') {
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    } else if (iconType === 'location') {
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  }

  // Compact, Shopee-like vertical list
  const compact = timelineEvents.slice(0, 6)
  return (
    <div className="text-sm">
      <div className="relative pl-6">
        <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-200"></div>
        <div className="space-y-4">
          {compact.map((e, idx) => (
            <div key={idx} className="relative">
              <span className={`absolute -left-2 top-1.5 w-3 h-3 rounded-full ${e.color === 'green' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
              <div className="flex items-start justify-between">
                <div>
                  <div className={`font-medium ${e.color === 'green' ? 'text-green-700' : 'text-blue-700'}`}>{e.title}</div>
                  <div className="text-gray-600">{e.description}</div>
                </div>
                <div className="text-gray-500 whitespace-nowrap ml-4">{formatDateTime(e.time)}</div>
              </div>
            </div>
          ))}
        </div>
        {timelineEvents.length > compact.length && (
          <div className="mt-3 text-blue-600">Xem thêm</div>
        )}
      </div>
    </div>
  )
}
