import { useState, useEffect, useMemo } from 'react'
import { OrderAPI } from '../lib/api'
import Protected from '../components/Protected'

// 1) Định nghĩa chuỗi trạng thái & UI
const STATUSES = ['PREPARING', 'READY', 'DELIVERING', 'COMPLETED']
const NEXT_STATUS = {
  PREPARING: 'READY',
  READY: 'DELIVERING',
  DELIVERING: 'COMPLETED',
  COMPLETED: null,
}
const statusLabels = {
  PREPARING: 'Đang chuẩn bị',
  READY: 'Sẵn sàng',
  DELIVERING: 'Đang giao',
  COMPLETED: 'Hoàn tất',
}
const statusColors = {
  PREPARING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  READY: 'bg-blue-100 text-blue-800 border-blue-200',
  DELIVERING: 'bg-purple-100 text-purple-800 border-purple-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
}

const tabColors = {
  PREPARING: 'border-yellow-500 text-yellow-700',
  READY: 'border-blue-500 text-blue-700',
  DELIVERING: 'border-purple-500 text-purple-700',
  COMPLETED: 'border-green-500 text-green-700',
}

const badgeColors = {
  PREPARING: 'bg-yellow-500 text-white',
  READY: 'bg-blue-500 text-white',
  DELIVERING: 'bg-purple-500 text-white',
  COMPLETED: 'bg-green-500 text-white',
}

export default function WorkPage() {
  const [activeTab, setActiveTab] = useState('PREPARING')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)
  const [tabCounts, setTabCounts] = useState({
    PREPARING: 0,
    READY: 0,
    DELIVERING: 0,
    COMPLETED: 0
  })
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })

  const ordersPerPage = 10

  // Load số lượng đơn hàng cho tất cả các tab
  const loadTabCounts = async () => {
    try {
      const promises = STATUSES.map(async (status) => {
        const res = await OrderAPI.work.list({
          status,
          page: 1,
          limit: 1, // Chỉ cần lấy 1 item để có count
          date: selectedDate
        })
        return { status, count: res.data.count || 0 }
      })
      
      const results = await Promise.all(promises)
      const newCounts = {}
      results.forEach(({ status, count }) => {
        newCounts[status] = count
      })
      setTabCounts(newCounts)
    } catch (e) {
      console.error('Failed to load tab counts:', e)
    }
  }

  const loadOrders = async (page = 1, status = activeTab) => {
    setLoading(true)
    try {
      const params = {
        status,
        page,
        limit: ordersPerPage,
        date: selectedDate,
        // Thêm ordering: 3 tab đầu sắp xếp tăng dần, tab cuối giảm dần
        ordering: ['PREPARING', 'READY', 'DELIVERING'].includes(status) ? 'created_at' : '-created_at'
      }
      
      const res = await OrderAPI.work.list(params)
      setOrders(res.data.results || [])
      setTotalCount(res.data.count)
      setHasNext(res.data.next)
      setHasPrevious(res.data.previous)
    } catch (e) {
      console.error('Failed to load orders:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
    loadOrders(1, activeTab)
    loadTabCounts() // Load counts khi thay đổi tab hoặc ngày
  }, [activeTab, selectedDate])

  useEffect(() => {
    loadOrders(currentPage, activeTab)
  }, [currentPage])

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadOrders(currentPage, activeTab)
      loadTabCounts()
    }, 30000)
    return () => clearInterval(interval)
  }, [currentPage, activeTab, selectedDate])

  const advanceStatus = async (orderId, current) => {
    const next = NEXT_STATUS[current]
    if (!next) return
    
    setUpdating(s => ({ ...s, [orderId]: true }))
    try {
      await OrderAPI.work.updateStatus(orderId, next)
      await loadOrders(currentPage, activeTab)
      await loadTabCounts() // Cập nhật lại counts sau khi thay đổi status
    } catch (e) {
      console.error('Failed to update status:', e)
      alert('Có lỗi xảy ra khi cập nhật trạng thái')
    } finally {
      setUpdating(s => ({ ...s, [orderId]: false }))
    }
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }

  const totalPages = Math.ceil(totalCount / ordersPerPage)

  const renderPagination = () => {
    if (totalPages <= 1) return null

    return (
      <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white border rounded-lg">
        <div className="text-sm text-gray-600">
          Hiển thị {Math.min((currentPage - 1) * ordersPerPage + 1, totalCount)} - {Math.min(currentPage * ordersPerPage, totalCount)} trong tổng số {totalCount} đơn
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPrevious}
            className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum
            if (totalPages <= 5) {
              pageNum = i + 1
            } else if (currentPage <= 3) {
              pageNum = i + 1
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i
            } else {
              pageNum = currentPage - 2 + i
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  currentPage === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'border hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            )
          })}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNext}
            className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <Protected roles={['staff', 'manager']}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Quản lý đơn hàng theo trạng thái</h1>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => {
                loadOrders(currentPage, activeTab)
                loadTabCounts()
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Tabs với số lượng */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {STATUSES.map(status => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`flex-1 py-3 px-4 rounded-md font-medium text-sm transition-all relative ${
                activeTab === status
                  ? `bg-white shadow-sm border-b-2 ${tabColors[status]}`
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <span>{statusLabels[status]}</span>
                {tabCounts[status] > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeColors[status]}`}>
                    {tabCounts[status]}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Thông tin sắp xếp và logic 60s */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600 flex items-center space-x-4">
            <div>
              {['PREPARING', 'READY', 'DELIVERING'].includes(activeTab) ? (
                <span>📅 Sắp xếp: Đơn cũ nhất trước</span>
              ) : (
                <span>📅 Sắp xếp: Đơn mới nhất trước</span>
              )}
            </div>
          </div>
          {totalCount > 0 && (
            <div className="text-sm font-medium text-gray-700">
              Tổng: {totalCount} đơn hàng
            </div>
          )}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto" />
            <p className="mt-2 text-gray-600">Đang tải đơn hàng...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border">
                <p className="text-gray-500">Không có đơn hàng nào trong trạng thái này</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-white border rounded-lg p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold">Đơn hàng #{order.id}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm border ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Thời gian đặt:</p>
                          <p className="font-medium">{new Date(order.created_at).toLocaleString('vi-VN')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Tổng tiền:</p>
                          <p className="font-medium text-lg">{parseFloat(order.total_amount).toLocaleString()}₫</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Món ăn:</p>
                        <div className="space-y-2">
                          {order.items.map(item => (
                            <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-md">
                              <div>
                                <p className="font-medium">{item.menu_item_name} × {item.quantity}</p>
                                {item.options_text && (
                                  <p className="text-sm text-gray-600">Tùy chọn: {item.options_text}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600">
                            Thanh toán: <span className="font-medium">{order.payment_method}</span>
                          </span>
                          {order.note && (
                            <span className="text-sm text-gray-600">
                              Ghi chú: <span className="font-medium">{order.note}</span>
                            </span>
                          )}
                        </div>

                        {NEXT_STATUS[activeTab] ? (
                          <button
                            onClick={() => advanceStatus(order.id, activeTab)}
                            disabled={!!updating[order.id]}
                            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                          >
                            {updating[order.id] ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                <span>Đang cập nhật...</span>
                              </>
                            ) : (
                              <span>Chuyển → {statusLabels[NEXT_STATUS[activeTab]]}</span>
                            )}
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400 px-4 py-2 border rounded-lg">
                            Đã hoàn tất
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {renderPagination()}
      </div>
    </Protected>
  )
}