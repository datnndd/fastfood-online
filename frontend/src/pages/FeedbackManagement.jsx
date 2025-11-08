import { useEffect, useMemo, useState } from 'react'
import { FeedbackAPI } from '../lib/api'
import DashboardBackButton from '../components/DashboardBackButton'

export default function FeedbackManagement() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null })

  const totalPages = useMemo(() => {
    if (!pagination.count) return 1
    return Math.ceil(pagination.count / 20)
  }, [pagination.count])

  useEffect(() => {
    loadFeedbacks(page)
  }, [page])

  const loadFeedbacks = async (pageNumber = 1) => {
    try {
      setLoading(true)
      const params = { page: pageNumber }
      const response = await FeedbackAPI.list(params)
      const data = response.data
      const list = data.results || data || []
      setItems(list)
      setPagination({
        count: typeof data.count === 'number' ? data.count : list.length,
        next: data.next || null,
        previous: data.previous || null
      })
    } catch (error) {
      console.error('Load feedbacks failed', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (value) => {
    if (!value) return ''
    return new Date(value).toLocaleString('vi-VN')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 via-white to-orange-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 space-y-4">
          <DashboardBackButton />
          <p className="text-sm uppercase tracking-[0.4em] text-gray-400 font-semibold">
            Feedback Center
          </p>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-4xl font-black text-[#e21b1b]">Quản lý phản hồi khách hàng</h1>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => loadFeedbacks(page)}
                className="bg-[#e21b1b] text-white px-5 py-2 rounded-full font-semibold shadow-md hover:bg-[#c21515] transition-colors"
                disabled={loading}
              >
                {loading ? 'Đang tải...' : 'Làm mới'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-yellow-100">
          {loading ? (
            <div className="space-y-4">
              <div className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
              <div className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
              <div className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-10 text-gray-500 font-semibold">
              Không có phản hồi phù hợp.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-sm uppercase text-gray-400 border-b">
                    <th className="py-3 font-semibold">Khách hàng</th>
                    <th className="py-3 font-semibold">Liên hệ</th>
                    <th className="py-3 font-semibold">Chủ đề</th>
                    <th className="py-3 font-semibold">Nội dung</th>
                    <th className="py-3 font-semibold">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((feedback) => (
                    <tr key={feedback.id} className="align-top hover:bg-slate-50">
                      <td className="py-4">
                        <div className="font-semibold text-gray-900">{feedback.full_name}</div>
                      </td>
                      <td className="py-4 text-sm text-gray-600">
                        <div className="font-medium">{feedback.email}</div>
                        {feedback.phone && <div className="text-gray-500">{feedback.phone}</div>}
                      </td>
                      <td className="py-4 text-sm text-gray-600">
                        {feedback.subject || <span className="text-gray-400 italic">Không có</span>}
                      </td>
                      <td className="py-4 text-sm text-gray-600">
                        <p className="whitespace-pre-line">{feedback.message}</p>
                      </td>
                      <td className="py-4 text-sm text-gray-500">{formatDateTime(feedback.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-6 text-sm text-gray-600">
          <span>
            Trang {page}/{totalPages || 1}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((curr) => Math.max(1, curr - 1))}
              className="px-4 py-2 rounded-full border border-gray-200 bg-white font-semibold disabled:opacity-50"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={!pagination.next && page >= totalPages}
              onClick={() => setPage((curr) => curr + 1)}
              className="px-4 py-2 rounded-full border border-gray-200 bg-white font-semibold disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
