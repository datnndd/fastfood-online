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
      color: 'red'
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
        color: 'red'
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
        color: 'red'
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
        color: order.status === 'DELIVERING' ? 'gold' : 'red'
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
          color: 'gold'
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

  // Compact, Shopee-like vertical list
  const compact = timelineEvents.slice(0, 6)
  return (
    <div className="text-sm">
      <div className="relative pl-6">
        <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-red-100"></div>
        <div className="space-y-6">
          {compact.map((e, idx) => (
            <div key={idx} className="relative">
              <span className={`absolute -left-[21px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${e.color === 'green' ? 'bg-green-500' :
                  e.color === 'gold' ? 'bg-amber-500' : 'bg-red-600'
                }`}></span>
              <div className="flex items-start justify-between">
                <div>
                  <div className={`font-bold text-base ${e.color === 'green' ? 'text-green-700' :
                      e.color === 'gold' ? 'text-amber-700' : 'vn-text-red-primary'
                    }`}>{e.title}</div>
                  <div className="text-gray-600 font-medium mt-1">{e.description}</div>
                </div>
                <div className="text-gray-500 whitespace-nowrap ml-4 text-xs font-medium">{formatDateTime(e.time)}</div>
              </div>
            </div>
          ))}
        </div>
        {timelineEvents.length > compact.length && (
          <div className="mt-4 text-red-600 font-bold hover:underline cursor-pointer">Xem thêm</div>
        )}
      </div>
    </div>
  )
}
