import { useState, useEffect, useMemo } from 'react'
import { OrderAPI } from '../lib/api'
import DashboardBackButton from '../components/DashboardBackButton'

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PREPARING', label: 'Đang chuẩn bị' },
  { value: 'READY', label: 'Sẵn sàng giao' },
  { value: 'DELIVERING', label: 'Đang giao' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' }
]

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value) || 0)

const getDateString = (date) => date.toISOString().split('T')[0]

const getDefaultFilters = () => {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 7)
  return {
    from_date: getDateString(from),
    to_date: getDateString(to),
    status: ''
  }
}

export default function OrdersDetailReport() {
  const [filters, setFilters] = useState(getDefaultFilters)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const summary = useMemo(() => {
    const totalOrders = orders.length
    const totalAmount = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
    const averageTicket = totalOrders ? totalAmount / totalOrders : 0
    return { totalOrders, totalAmount, averageTicket }
  }, [orders])

  const validateFilters = () => {
    if (!filters.from_date || !filters.to_date) {
      setError('Vui lòng chọn khoảng thời gian rõ ràng.')
      return false
    }
    if (new Date(filters.from_date) > new Date(filters.to_date)) {
      setError('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.')
      return false
    }
    return true
  }

  const fetchOrders = async () => {
    if (!validateFilters()) return
    setLoading(true)
    setError('')
    try {
      const params = {
        from_date: filters.from_date,
        to_date: filters.to_date
      }
      if (filters.status) params.status = filters.status
      const response = await OrderAPI.stats.getOrderStats(params)
      const list = response.data?.orders || []
      setOrders(list)
      if (!list.length) {
        setError('Không tìm thấy đơn hàng nào trong khoảng thời gian này.')
      }
    } catch (err) {
      console.error('Load order report error:', err)
      setError('Không thể tải dữ liệu đơn hàng. Vui lòng thử lại sau.')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleExportCsv = () => {
    if (!orders.length) return
    const headers = ['Mã đơn', 'Ngày tạo', 'Trạng thái', 'Khách hàng', 'Tổng tiền']
    const rows = orders.map((order) => [
      `#${order.id}`,
      new Date(order.created_at).toLocaleString('vi-VN'),
      order.status,
      order.customer || '—',
      order.total_amount
    ])
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute(
      'download',
      `bao-cao-don-hang-${filters.from_date}-${filters.to_date}.csv`
    )
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  const currentRange = `${filters.from_date || '—'} → ${filters.to_date || '—'}`

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="container mx-auto px-4 space-y-8">
        <header className="space-y-4">
          <DashboardBackButton />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Báo cáo đơn hàng
              </p>
              <h1 className="text-3xl font-semibold text-slate-900">Đơn hàng chi tiết</h1>
              <p className="text-slate-500">Theo dõi và xuất danh sách đơn hàng theo thời gian thực.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Khoảng thời gian</p>
              <p className="text-sm font-semibold text-slate-900">{currentRange}</p>
              <p className="text-xs text-slate-400">
                Trạng thái: {STATUS_OPTIONS.find((item) => item.value === filters.status)?.label || 'Tất cả'}
              </p>
            </div>
          </div>
        </header>

        <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              <span>Từ ngày *</span>
              <input
                type="date"
                value={filters.from_date}
                onChange={(event) => handleFilterChange('from_date', event.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              <span>Đến ngày *</span>
              <input
                type="date"
                value={filters.to_date}
                onChange={(event) => handleFilterChange('to_date', event.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              <span>Trạng thái đơn</span>
              <select
                value={filters.status}
                onChange={(event) => handleFilterChange('status', event.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={fetchOrders}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {loading ? 'Đang tải...' : 'Lọc kết quả'}
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={!orders.length}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 disabled:opacity-40"
                >
                  Xuất CSV
                </button>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm font-medium text-red-700 shadow-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
            <p className="mt-4 text-sm font-medium text-slate-500">Đang tổng hợp dữ liệu...</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase text-slate-500">Tổng đơn hàng</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{summary.totalOrders}</p>
                <p className="text-xs text-slate-400">Trong khoảng {currentRange}</p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase text-slate-500">Tổng doanh thu</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">
                  {formatCurrency(summary.totalAmount)}
                </p>
                <p className="text-xs text-slate-400">Đã bao gồm các trạng thái được lọc</p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase text-slate-500">Giá trị trung bình/đơn</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">
                  {formatCurrency(summary.averageTicket)}
                </p>
                <p className="text-xs text-slate-400">Dựa trên {summary.totalOrders} đơn hàng</p>
              </article>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4">
                <p className="text-sm font-semibold text-slate-900">Danh sách đơn hàng ({orders.length})</p>
                <p className="text-xs text-slate-400">Tối đa 100 đơn hàng gần nhất theo bộ lọc hiện tại</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium">Mã đơn</th>
                      <th className="px-6 py-3 text-left font-medium">Ngày tạo</th>
                      <th className="px-6 py-3 text-left font-medium">Khách hàng</th>
                      <th className="px-6 py-3 text-left font-medium">Trạng thái</th>
                      <th className="px-6 py-3 text-right font-medium">Tổng tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-3 font-semibold text-slate-900">#{order.id}</td>
                        <td className="px-6 py-3 text-slate-600">
                          {new Date(order.created_at).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-6 py-3 text-slate-700">{order.customer || '—'}</td>
                        <td className="px-6 py-3">
                          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right font-semibold text-slate-900">
                          {formatCurrency(order.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
