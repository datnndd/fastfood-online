import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js'
import { OrderAPI, FeedbackAPI } from '../lib/api'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
)

const TIMEFRAME_TABS = [
  { value: 'day', label: 'Theo ngày' },
  { value: 'month', label: 'Theo tháng' },
  { value: 'year', label: 'Theo năm' }
]

const STATUS_META = {
  PREPARING: { label: 'Chuẩn bị', color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700' }, // Turmeric/Fried
  READY: { label: 'Sẵn sàng', color: '#ea580c', bg: 'bg-orange-50', text: 'text-orange-700' }, // Cooked/Hot
  DELIVERING: { label: 'Đang giao', color: '#0ea5e9', bg: 'bg-sky-50', text: 'text-sky-700' }, // Neutral for logistics
  COMPLETED: { label: 'Hoàn tất', color: '#16a34a', bg: 'bg-green-50', text: 'text-green-700' }, // Fresh herbs
  CANCELLED: { label: 'Đã hủy', color: '#78716c', bg: 'bg-stone-100', text: 'text-stone-600' } // Stone
}

const MANAGEMENT_LINKS = [
  {
    title: 'Danh mục',
    description: 'Tổ chức nhóm sản phẩm',
    icon: '🗂️',
    path: '/manager/categories',
    accent: 'from-orange-50 to-amber-50',
    textClass: 'text-orange-700'
  },
  {
    title: 'Món lẻ',
    description: 'Thêm & cập nhật món ăn',
    icon: '🍜',
    path: '/manager/menu',
    accent: 'from-red-50 to-orange-50',
    textClass: 'text-red-700'
  },
  {
    title: 'Combo ưu đãi',
    description: 'Thiết kế combo bán chạy',
    icon: '🍱',
    path: '/manager/combos',
    accent: 'from-amber-50 to-yellow-50',
    textClass: 'text-amber-700'
  },
  {
    title: 'Nội dung trang',
    description: 'Quản lý nội dung động',
    icon: '📝',
    path: '/manager/content',
    accent: 'from-stone-50 to-orange-50',
    textClass: 'text-stone-700'
  },
  {
    title: 'Đơn hàng',
    description: 'Theo dõi & xử lý đơn',
    icon: '🥡',
    path: '/work',
    accent: 'from-green-50 to-emerald-50',
    textClass: 'text-emerald-700'
  },
  {
    title: 'Nhân sự & khách',
    description: 'Quản lý tài khoản người dùng',
    icon: '👥',
    path: '/manager/accounts',
    accent: 'from-slate-50 to-stone-50',
    textClass: 'text-slate-600'
  },
  {
    title: 'Đơn hàng chi tiết',
    description: 'Theo dõi và xuất CSV',
    icon: '📊',
    path: '/manager/orders-report',
    accent: 'from-teal-50 to-cyan-50',
    textClass: 'text-teal-700'
  }
]

const formatDateString = (date) => date.toISOString().split('T')[0]

const getDefaultFilterValue = (timeframe) => {
  const now = new Date()
  if (timeframe === 'day') return formatDateString(now)
  if (timeframe === 'month') return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return `${now.getFullYear()}`
}

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

export default function ManagerDashboard() {
  const [timeframe, setTimeframe] = useState('month')
  const [filterValue, setFilterValue] = useState(() => getDefaultFilterValue('month'))

  const [summary, setSummary] = useState({ totalRevenue: 0, totalOrders: 0, avgPerDay: 0, days: 0 })
  const [chartData, setChartData] = useState({ labels: [], values: [] })
  const [statusStats, setStatusStats] = useState({})
  const [topItems, setTopItems] = useState([])
  const [topCombos, setTopCombos] = useState([])
  const [feedbacks, setFeedbacks] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      // Prepare params for different endpoints
      const chartParams = { timeframe }
      if (timeframe === 'day') chartParams.date = filterValue
      if (timeframe === 'month') chartParams.month = filterValue
      if (timeframe === 'year') chartParams.year = filterValue

      // Calculate date range for other stats based on chart params logic (simplified here or reused from backend response)
      // For simplicity, we'll let the backend handle the exact range for chart,
      // but for "Top Items" and "Summary", we need to pass from_date/to_date.
      // We can get these from the chart response or calculate them locally.
      // Let's fetch the chart first to get the range.

      const chartRes = await OrderAPI.stats.getRevenueChart(chartParams)
      const { start_date, end_date, labels, values } = chartRes.data

      setChartData({ labels, values })

      // Now fetch other stats using the range returned by chart API
      const rangeParams = { from_date: start_date, to_date: end_date }

      const [revenueRes, statusRes, topItemsRes, topCombosRes, feedbackRes] = await Promise.all([
        OrderAPI.stats.getRevenue({ ...rangeParams }),
        OrderAPI.stats.getStatusStats({ ...rangeParams }),
        OrderAPI.stats.getTopItems({ ...rangeParams }),
        OrderAPI.stats.getTopCombos({ ...rangeParams }),
        FeedbackAPI.list({ limit: 5 })
      ])

      setSummary({
        totalRevenue: Number(revenueRes.data?.total_revenue) || 0,
        totalOrders: revenueRes.data?.total_orders || 0,
        avgPerDay: Number(revenueRes.data?.avg_per_day) || 0,
        days: revenueRes.data?.days || 1
      })

      setStatusStats(statusRes.data)
      setTopItems((topItemsRes.data?.items || []).slice(0, 5))
      setTopCombos((topCombosRes.data?.combos || []).slice(0, 5))
      setFeedbacks(feedbackRes.data?.results || feedbackRes.data || [])

    } catch (err) {
      console.error('Load dashboard error:', err)
      setError('Không thể tải dữ liệu thống kê. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }, [timeframe, filterValue])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const handleTimeframeChange = (value) => {
    setTimeframe(value)
    setFilterValue(getDefaultFilterValue(value))
  }

  // Chart Configs
  const lineChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Doanh thu',
        data: chartData.values,
        fill: true,
        borderColor: '#ea580c', // Orange 600
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(234, 88, 12, 0.2)');
          gradient.addColorStop(1, 'rgba(234, 88, 12, 0)');
          return gradient;
        },
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#ea580c',
        pointBorderWidth: 2
      }
    ]
  }

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#431407', // Stone 950 / Dark Brown
        padding: 12,
        titleFont: { size: 13 },
        bodyFont: { size: 13 },
        callbacks: {
          label: (context) => formatCurrency(context.parsed.y)
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: formatYAxisTick,
          color: '#78716c', // Stone 500
          font: { size: 11 }
        },
        grid: { color: '#e7e5e4', borderDash: [4, 4] }, // Stone 200
        border: { display: false }
      },
      x: {
        ticks: { color: '#78716c', font: { size: 11 } },
        grid: { display: false },
        border: { display: false }
      }
    }
  }

  const doughnutData = {
    labels: Object.keys(STATUS_META).map(k => STATUS_META[k].label),
    datasets: [
      {
        data: Object.keys(STATUS_META).map(k => statusStats[k] || 0),
        backgroundColor: Object.keys(STATUS_META).map(k => STATUS_META[k].color),
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    cutout: '75%'
  }

  const inputType = timeframe === 'day' ? 'date' : timeframe === 'month' ? 'month' : 'number'

  return (
    <div className="min-h-screen bg-stone-50 py-8 font-sans">
      <div className="container mx-auto px-4 max-w-7xl space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">Bếp Trưởng Dashboard</h1>
            <p className="text-stone-500 mt-1">Chào mừng trở lại! Hôm nay bếp có gì vui?</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-stone-200 shadow-sm">
            <div className="flex bg-stone-100 rounded-lg p-1">
              {TIMEFRAME_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => handleTimeframeChange(tab.value)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${timeframe === tab.value
                    ? 'bg-white text-orange-700 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="h-8 w-px bg-stone-200 mx-1"></div>
            <input
              type={inputType}
              min="2020"
              max="2100"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="border-none bg-transparent text-sm font-medium text-stone-700 focus:ring-0 p-0 pr-2"
            />
          </div>
        </header>

        {loading && !chartData.labels.length ? (
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-stone-500">Tổng doanh thu</p>
                    <h3 className="text-2xl font-bold text-stone-800 mt-1">{formatCurrency(summary.totalRevenue)}</h3>
                  </div>
                  <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                    <span className="text-xl">💰</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-stone-500">Tổng đơn hàng</p>
                    <h3 className="text-2xl font-bold text-stone-800 mt-1">{summary.totalOrders}</h3>
                  </div>
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                    <span className="text-xl">🧾</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-stone-500">Doanh thu / ngày</p>
                    <h3 className="text-2xl font-bold text-stone-800 mt-1">{formatCurrency(summary.avgPerDay)}</h3>
                  </div>
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <span className="text-xl">📈</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-stone-500">Giá trị TB / đơn</p>
                    <h3 className="text-2xl font-bold text-stone-800 mt-1">
                      {formatCurrency(summary.totalOrders ? summary.totalRevenue / summary.totalOrders : 0)}
                    </h3>
                  </div>
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <span className="text-xl">🏷️</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Charts Section */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Chart */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
                <h3 className="text-lg font-bold text-stone-800 mb-6">Biểu đồ doanh thu</h3>
                <div className="h-80">
                  <Line data={lineChartData} options={lineChartOptions} />
                </div>
              </div>

              {/* Status Chart */}
              <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm flex flex-col">
                <h3 className="text-lg font-bold text-stone-800 mb-6">Trạng thái đơn hàng</h3>
                <div className="flex-1 relative min-h-[200px]">
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-stone-800">{statusStats.total || 0}</p>
                      <p className="text-xs text-stone-500 uppercase font-medium">Tổng đơn</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {Object.entries(STATUS_META).map(([key, meta]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: meta.color }}></span>
                        <span className="text-stone-600">{meta.label}</span>
                      </div>
                      <span className="font-medium text-stone-800">{statusStats[key] || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Top Items & Combos */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
                <h3 className="text-lg font-bold text-stone-800 mb-4">Top 5 Món Ăn</h3>
                <div className="space-y-4">
                  {topItems.length === 0 ? (
                    <p className="text-stone-500 text-sm text-center py-4">Chưa có dữ liệu</p>
                  ) : (
                    topItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-orange-50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-lg border border-stone-100 group-hover:border-orange-200">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-medium text-stone-800 text-sm group-hover:text-orange-800">{item.name}</p>
                            <p className="text-xs text-stone-500">{item.quantity} đã bán</p>
                          </div>
                        </div>
                        <span className="font-semibold text-stone-800 text-sm">{formatCurrency(Number(item.revenue))}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
                <h3 className="text-lg font-bold text-stone-800 mb-4">Top 5 Combo</h3>
                <div className="space-y-4">
                  {topCombos.length === 0 ? (
                    <p className="text-stone-500 text-sm text-center py-4">Chưa có dữ liệu</p>
                  ) : (
                    topCombos.map((combo, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-orange-50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-lg border border-stone-100 group-hover:border-orange-200">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-medium text-stone-800 text-sm group-hover:text-orange-800">{combo.name}</p>
                            <p className="text-xs text-stone-500">{combo.quantity} đã bán</p>
                          </div>
                        </div>
                        <span className="font-semibold text-stone-800 text-sm">{formatCurrency(Number(combo.revenue))}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            {/* Quick Links */}
            <section>
              <h3 className="text-lg font-bold text-stone-800 mb-4">Truy cập nhanh</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {MANAGEMENT_LINKS.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all text-center group"
                  >
                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br ${link.accent} text-xl mb-3 group-hover:scale-110 transition-transform`}>
                      {link.icon}
                    </div>
                    <span className="text-xs font-medium text-stone-700 group-hover:text-stone-900">{link.title}</span>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
