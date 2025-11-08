import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { OrderAPI, FeedbackAPI } from '../lib/api'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

const TIMEFRAME_TABS = [
  { value: 'day', label: 'Theo ngày' },
  { value: 'month', label: 'Theo tháng' },
  { value: 'year', label: 'Theo năm' }
]

const STATUS_META = {
  PREPARING: { label: 'Chuẩn bị', barClass: 'bg-amber-400' },
  READY: { label: 'Sẵn sàng', barClass: 'bg-sky-500' },
  DELIVERING: { label: 'Đang giao', barClass: 'bg-indigo-500' },
  COMPLETED: { label: 'Hoàn tất', barClass: 'bg-emerald-500' },
  CANCELLED: { label: 'Đã hủy', barClass: 'bg-gray-400' }
}

const MANAGEMENT_LINKS = [
  {
    title: 'Danh mục',
    description: 'Tổ chức nhóm sản phẩm',
    icon: '🗂️',
    path: '/manager/categories',
    accent: 'from-blue-50 to-indigo-50',
    textClass: 'text-indigo-600'
  },
  {
    title: 'Món lẻ',
    description: 'Thêm & cập nhật món ăn',
    icon: '🍔',
    path: '/manager/menu',
    accent: 'from-amber-50 to-orange-50',
    textClass: 'text-orange-600'
  },
  {
    title: 'Combo ưu đãi',
    description: 'Thiết kế combo bán chạy',
    icon: '🎁',
    path: '/manager/combos',
    accent: 'from-pink-50 to-rose-50',
    textClass: 'text-rose-600'
  },
  {
    title: 'Đơn hàng',
    description: 'Theo dõi & xử lý đơn',
    icon: '📦',
    path: '/work',
    accent: 'from-yellow-50 to-lime-50',
    textClass: 'text-yellow-600'
  },
  {
    title: 'Nhân sự & khách',
    description: 'Quản lý tài khoản người dùng',
    icon: '👥',
    path: '/manager/accounts',
    accent: 'from-slate-50 to-gray-50',
    textClass: 'text-slate-600'
  },
  {
    title: 'Đơn hàng chi tiết',
    description: 'Theo dõi và xuất CSV',
    icon: '📊',
    path: '/manager/orders-report',
    accent: 'from-emerald-50 to-teal-50',
    textClass: 'text-emerald-600'
  }
]

const formatDateString = (date) => date.toISOString().split('T')[0]

const getDefaultFilterValue = (timeframe) => {
  const now = new Date()
  if (timeframe === 'day') return formatDateString(now)
  if (timeframe === 'month') return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return `${now.getFullYear()}`
}

const getRangeFromFilter = (timeframe, value) => {
  const fallback = new Date()

  if (timeframe === 'day') {
    const dateValue = value ? new Date(value) : fallback
    const date = Number.isNaN(dateValue.getTime()) ? fallback : dateValue
    return {
      from: formatDateString(date),
      to: formatDateString(date),
      label: date.toLocaleDateString('vi-VN')
    }
  }

  if (timeframe === 'month') {
    const [yearStr, monthStr] = (value || '').split('-')
    const year = Number(yearStr) || fallback.getFullYear()
    const month = Number(monthStr) || fallback.getMonth() + 1
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0)
    return {
      from: formatDateString(start),
      to: formatDateString(end),
      label: `Tháng ${month}/${year}`,
      year,
      month
    }
  }

  const year = Number(value) || fallback.getFullYear()
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31)
  return {
    from: formatDateString(start),
    to: formatDateString(end),
    label: `Năm ${year}`,
    year
  }
}

const parseMoney = (value) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate()

const buildChartSeries = (orders, timeframe, rangeInfo) => {
  if (timeframe === 'day') {
    const labels = Array.from({ length: 24 }, (_, idx) => `${String(idx).padStart(2, '0')}h`)
    const values = new Array(24).fill(0)

    orders.forEach((order) => {
      const date = new Date(order.created_at)
      if (Number.isNaN(date.getTime())) return
      const hour = date.getHours()
      values[hour] += parseMoney(order.total_amount)
    })

    return { labels, values }
  }

  if (timeframe === 'month') {
    const year = rangeInfo?.year || new Date().getFullYear()
    const month = rangeInfo?.month || new Date().getMonth() + 1
    const daysInMonth = getDaysInMonth(year, month)
    const labels = Array.from({ length: daysInMonth }, (_, idx) => `${idx + 1}/${month}`)
    const values = new Array(daysInMonth).fill(0)

    orders.forEach((order) => {
      const date = new Date(order.created_at)
      if (Number.isNaN(date.getTime())) return
      if (date.getFullYear() !== year || date.getMonth() + 1 !== month) return
      const index = date.getDate() - 1
      values[index] += parseMoney(order.total_amount)
    })

    return { labels, values }
  }

  const year = rangeInfo?.year || new Date().getFullYear()
  const labels = Array.from({ length: 12 }, (_, idx) => `T${idx + 1}`)
  const values = new Array(12).fill(0)

  orders.forEach((order) => {
    const date = new Date(order.created_at)
    if (Number.isNaN(date.getTime())) return
    if (date.getFullYear() !== year) return
    const index = date.getMonth()
    values[index] += parseMoney(order.total_amount)
  })

  return { labels, values }
}

const truncate = (text, limit = 70) => {
  if (!text) return ''
  return text.length > limit ? `${text.slice(0, limit)}…` : text
}

const formatDateTime = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleString('vi-VN')
}

const getCurrentGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Chào buổi sáng'
  if (hour < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

export default function ManagerDashboard() {
  const [timeframe, setTimeframe] = useState('month')
  const [filterValue, setFilterValue] = useState(() => getDefaultFilterValue('month'))
  const [summary, setSummary] = useState({ totalRevenue: 0, totalOrders: 0, avgPerDay: 0, days: 0 })
  const [orders, setOrders] = useState([])
  const [topItems, setTopItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [feedbacks, setFeedbacks] = useState([])
  const [feedbackLoading, setFeedbackLoading] = useState(true)

  const rangeInfo = useMemo(() => getRangeFromFilter(timeframe, filterValue), [timeframe, filterValue])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      const { from, to } = getRangeFromFilter(timeframe, filterValue)

      try {
        const [ordersRes, revenueRes, topItemsRes] = await Promise.all([
          OrderAPI.stats.getOrderStats({ from_date: from, to_date: to }),
          OrderAPI.stats.getRevenue({ from_date: from, to_date: to }),
          OrderAPI.stats.getTopItems({ from_date: from, to_date: to })
        ])

        setOrders(ordersRes.data?.orders || [])
        setSummary({
          totalRevenue: parseMoney(revenueRes.data?.total_revenue),
          totalOrders: revenueRes.data?.total_orders || 0,
          avgPerDay: parseMoney(revenueRes.data?.avg_per_day),
          days: revenueRes.data?.days || 0
        })
        setTopItems((topItemsRes.data?.items || []).slice(0, 5))
      } catch (err) {
        console.error('Load dashboard error:', err)
        setError('Không thể tải dữ liệu thống kê. Vui lòng thử lại.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [timeframe, filterValue])

  const loadFeedbacks = useCallback(async () => {
    try {
      setFeedbackLoading(true)
      const response = await FeedbackAPI.list()
      const items = response.data?.results || response.data || []
      setFeedbacks(items.slice(0, 5))
    } catch (err) {
      console.error('Load feedback error:', err)
    } finally {
      setFeedbackLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFeedbacks()
  }, [loadFeedbacks])

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatYAxisTick = (value) => {
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return '0'
    if (numeric >= 1_000_000) return `${(numeric / 1_000_000).toFixed(1)}tr`
    if (numeric >= 1_000) return `${Math.round(numeric / 1_000)}k`
    return `${numeric}`
  }

  const statusBreakdown = useMemo(() => {
    const base = { total: orders.length }
    Object.keys(STATUS_META).forEach((key) => {
      base[key] = 0
    })

    orders.forEach((order) => {
      const key = order.status || 'PREPARING'
      base[key] = (base[key] || 0) + 1
    })

    return base
  }, [orders])

  const completionRate = statusBreakdown.total
    ? Math.round(((statusBreakdown.COMPLETED || 0) / statusBreakdown.total) * 100)
    : 0

  const avgTicket = summary.totalOrders ? summary.totalRevenue / summary.totalOrders : 0

  const chartSeries = useMemo(
    () => buildChartSeries(orders, timeframe, rangeInfo),
    [orders, timeframe, rangeInfo]
  )

  const chartData = {
    labels: chartSeries.labels,
    datasets: [
      {
        label: 'Doanh thu (VND)',
        data: chartSeries.values,
        fill: true,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(248, 113, 113, 0.15)',
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const parsedValue =
              typeof context.parsed === 'object' ? context.parsed?.y : context.parsed
            return formatCurrency(parsedValue || 0)
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => formatYAxisTick(value),
          color: '#4b5563'
        },
        grid: { color: '#e5e7eb' }
      },
      x: {
        ticks: { color: '#6b7280' },
        grid: { display: false }
      }
    }
  }

  const handleTimeframeChange = (value) => {
    setTimeframe(value)
    setFilterValue(getDefaultFilterValue(value))
  }

  const inputType = timeframe === 'day' ? 'date' : timeframe === 'month' ? 'month' : 'number'

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 space-y-8">
        <header className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-wide text-gray-500">Dashboard quản lý</p>
          <h1 className="text-3xl font-semibold text-gray-900">{getCurrentGreeting()}, Manager</h1>
          <p className="text-gray-600">Tổng quan hiệu suất cửa hàng • {rangeInfo.label}</p>
        </header>

        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Hiệu suất doanh thu</h2>
              <p className="text-sm text-gray-500">Tự động cập nhật theo phạm vi ngày bạn đã chọn</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-2 rounded-xl bg-gray-100 p-1">
                {TIMEFRAME_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => handleTimeframeChange(tab.value)}
                    className={`px-3 py-1 text-sm font-medium rounded-lg transition ${
                      timeframe === tab.value
                        ? 'bg-white shadow text-gray-900'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <input
                type={inputType}
                min="2020"
                max="2100"
                value={filterValue}
                onChange={(event) => setFilterValue(event.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-gray-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-6 h-80">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
            {!error && (
              <>
                {loading ? (
                  <div className="h-full rounded-xl bg-gray-100 animate-pulse" />
                ) : (
                  <Line data={chartData} options={chartOptions} />
                )}
              </>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Tổng doanh thu</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{formatCurrency(summary.totalRevenue)}</p>
            <p className="text-xs text-gray-400">{rangeInfo.label}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Số đơn</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{summary.totalOrders}</p>
            <p className="text-xs text-gray-400">Trung bình {summary.days || 1} ngày</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Doanh thu / ngày</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{formatCurrency(summary.avgPerDay)}</p>
            <p className="text-xs text-gray-400">Theo báo cáo doanh thu</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Giá trị trung bình/đơn</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{formatCurrency(avgTicket)}</p>
            <p className="text-xs text-gray-400">Tỉ lệ hoàn tất {completionRate}%</p>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Điều hướng quản lý</h3>
              <p className="text-sm text-gray-500">Tới nhanh các chức năng quan trọng</p>
            </div>
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {MANAGEMENT_LINKS.length} khu vực
            </span>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {MANAGEMENT_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="group flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className={`rounded-2xl bg-gradient-to-br ${link.accent} p-3 text-2xl ${link.textClass}`}>
                    {link.icon}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-900">{link.title}</p>
                    <p className="text-sm text-gray-500">{link.description}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <span className="font-medium text-gray-600 group-hover:text-gray-900">Mở trang quản lý</span>
                  <span className="text-lg text-gray-400 transition group-hover:translate-x-1 group-hover:text-gray-900">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Tình trạng đơn hàng</h3>
                <p className="text-sm text-gray-500">{statusBreakdown.total} đơn trong phạm vi hiện tại</p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {Object.entries(STATUS_META).map(([key, meta]) => {
                const count = statusBreakdown[key] || 0
                const ratio = statusBreakdown.total ? (count / statusBreakdown.total) * 100 : 0
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{meta.label}</span>
                      <span className="font-semibold text-gray-900">{count} đơn</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-gray-100">
                      <div className={`h-full rounded-full ${meta.barClass}`} style={{ width: `${ratio}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Món bán chạy</h3>
                <p className="text-sm text-gray-500">Top 5 theo doanh thu</p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, idx) => (
                    <div key={idx} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : topItems.length === 0 ? (
                <p className="text-sm text-gray-500">Chưa có dữ liệu trong phạm vi này.</p>
              ) : (
                topItems.map((item) => (
                  <div key={item.id || item.name} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.quantity} món đã bán</p>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(parseMoney(item.revenue))}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Phản hồi gần đây</h3>
              <p className="text-sm text-gray-500">Giữ kết nối với khách hàng</p>
            </div>
            <button
              type="button"
              onClick={loadFeedbacks}
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Làm mới
            </button>
          </div>

          {feedbackLoading ? (
            <div className="mt-6 space-y-4">
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : feedbacks.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500">Chưa có phản hồi nào.</p>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 font-medium">Khách hàng</th>
                    <th className="py-2 font-medium">Liên hệ</th>
                    <th className="py-2 font-medium">Chủ đề</th>
                    <th className="py-2 font-medium">Nội dung</th>
                    <th className="py-2 font-medium">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {feedbacks.map((feedback) => (
                    <tr key={feedback.id}>
                      <td className="py-3 font-medium text-gray-900">{feedback.full_name || 'Khách'}</td>
                      <td className="py-3 text-gray-600">
                        <div>{feedback.email}</div>
                        {feedback.phone && <div className="text-xs text-gray-400">{feedback.phone}</div>}
                      </td>
                      <td className="py-3 text-gray-600">{feedback.subject || '—'}</td>
                      <td className="py-3 text-gray-600">{truncate(feedback.message)}</td>
                      <td className="py-3 text-gray-500">{formatDateTime(feedback.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
