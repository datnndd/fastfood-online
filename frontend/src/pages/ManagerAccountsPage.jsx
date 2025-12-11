import { useCallback, useEffect, useMemo, useState } from 'react'
import { AccountsAPI } from '../lib/api'
import DashboardBackButton from '../components/DashboardBackButton'

const ROLE_OPTIONS = [
  { value: 'customer', label: '👤 Khách hàng', color: 'bg-blue-100 text-blue-800' },
  { value: 'staff', label: '👨‍🍳 Nhân viên', color: 'bg-green-100 text-green-800' },
  { value: 'manager', label: '👔 Quản lý', color: 'bg-purple-100 text-purple-800' }
]

const ROLE_FILTERS = [
  { value: 'all', label: 'Tất cả', icon: '✨' },
  { value: 'manager', label: 'Quản lý', icon: '👔' },
  { value: 'staff', label: 'Nhân viên', icon: '👨‍🍳' },
  { value: 'customer', label: 'Khách hàng', icon: '👤' }
]

const getErrorMessage = (error, fallback = 'Đã có lỗi xảy ra') => {
  const data = error?.response?.data
  if (!data) return error?.message || fallback
  if (typeof data === 'string') return data
  if (Array.isArray(data)) return data.join(', ')
  if (data.detail) {
    if (Array.isArray(data.detail)) return data.detail.join(', ')
    if (typeof data.detail === 'string') return data.detail
  }
  const firstKey = Object.keys(data)[0]
  if (firstKey) {
    const value = data[firstKey]
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'string') return value
  }
  return fallback
}

export default function ManagerAccountsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [staffForm, setStaffForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'staff'
  })
  const [staffState, setStaffState] = useState({ status: 'idle', message: '' })
  const [activityLog, setActivityLog] = useState([])
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userListError, setUserListError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [roleEdits, setRoleEdits] = useState({})
  const [rowStatuses, setRowStatuses] = useState({})

  const addActivity = (message) => {
    setActivityLog((prev) => [{ message, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10))
  }

  const staffDisabled = staffState.status === 'loading'

  const roleLabelMap = useMemo(() =>
    ROLE_OPTIONS.reduce((acc, option) => {
      acc[option.value] = option.label
      return acc
    }, {}),
    [])

  const loadUsers = useCallback(async (params = {}) => {
    setUsersLoading(true)
    setUserListError('')
    try {
      const { data } = await AccountsAPI.listUsers(params)
      const records = Array.isArray(data?.results) ? data.results : data
      setUsers(records)
    } catch (error) {
      setUserListError(getErrorMessage(error, 'Không thể tải danh sách tài khoản.'))
    } finally {
      setUsersLoading(false)
    }
  }, [])

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchValue(searchInput.trim())
    }, 400)
    return () => clearTimeout(handler)
  }, [searchInput])

  const getCurrentListParams = useCallback(() => {
    const params = {}
    if (searchValue) params.search = searchValue
    if (roleFilter !== 'all') params.role = roleFilter
    return params
  }, [searchValue, roleFilter])

  useEffect(() => {
    loadUsers(getCurrentListParams())
  }, [searchValue, roleFilter, loadUsers, getCurrentListParams])

  const refreshUsers = () => {
    loadUsers(getCurrentListParams())
  }

  const setRowStatus = (userId, status) => {
    setRowStatuses((prev) => ({ ...prev, [userId]: status }))
  }

  const handleInlineRoleSave = async (user) => {
    const pendingRole = roleEdits[user.id] ?? user.role
    if (pendingRole === user.role) {
      setRowStatus(user.id, { type: 'info', message: 'Vai trò không thay đổi.' })
      return
    }

    setRowStatus(user.id, { type: 'loading', message: '' })
    try {
      await AccountsAPI.patchUserRole(user.id, pendingRole)
      setUsers((prev) =>
        prev.map((item) =>
          item.id === user.id ? { ...item, role: pendingRole, role_display: roleLabelMap[pendingRole] } : item
        )
      )
      setRoleEdits((prev) => {
        const next = { ...prev }
        delete next[user.id]
        return next
      })
      setRowStatus(user.id, { type: 'success', message: '✅ Đã cập nhật!' })
      addActivity(`🎯 Cập nhật vai trò user #${user.id} → ${roleLabelMap[pendingRole]}`)
    } catch (error) {
      setRowStatus(user.id, {
        type: 'error',
        message: getErrorMessage(error, 'Không thể cập nhật vai trò.')
      })
    }
  }

  const handleCreateStaff = async (event) => {
    event.preventDefault()
    setStaffState({ status: 'loading', message: '' })

    try {
      await AccountsAPI.createStaff({
        username: staffForm.username.trim(),
        email: staffForm.email.trim(),
        password: staffForm.password,
        role: staffForm.role
      })
      setStaffState({ status: 'success', message: '✅ Tạo tài khoản thành công!' })
      setStaffForm({ username: '', email: '', password: '', role: 'staff' })
      addActivity(`👤 Đã tạo nhân viên "${staffForm.username}" - ${roleLabelMap[staffForm.role]}`)
      refreshUsers()

      // Tự động đóng modal sau 1.5s
      setTimeout(() => {
        setShowCreateModal(false)
        setStaffState({ status: 'idle', message: '' })
      }, 1500)
    } catch (error) {
      setStaffState({
        status: 'error',
        message: getErrorMessage(error, 'Không thể tạo tài khoản. Vui lòng thử lại.')
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white shadow-2xl">
        <div className="container mx-auto px-4 py-8 space-y-4">
          <DashboardBackButton className="bg-white/10 text-white hover:bg-white hover:text-purple-600 border-transparent" />
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-5xl">👥</span>
                <h1 className="text-4xl font-black tracking-tight">
                  QUẢN LÝ TÀI KHOẢN
                </h1>
              </div>
              <p className="text-purple-100 text-lg">
                Tổng: <span className="font-bold text-white">{users.length}</span> tài khoản
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-white text-purple-600 px-8 py-4 rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
              >
                <span className="text-2xl">➕</span>
                <span className="hidden sm:inline">Tạo nhân viên</span>
                <span className="sm:hidden">Tạo NV</span>
              </button>
              <button
                onClick={refreshUsers}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-6 py-4 rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
              >
                <span className="text-xl">🔄</span>

              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Users List */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">📋</span>
                  <div>
                    <h2 className="text-2xl font-black text-white">Danh sách tài khoản</h2>
                    <p className="text-blue-100 text-sm">Tìm kiếm và chỉnh sửa vai trò</p>
                  </div>
                </div>
              </div>

              {/* Search Bar - Fixed: bỏ icon thứ 2 */}
              <div className="relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Tìm kiếm theo tên, email hoặc username..."
                  className="w-full pl-4 pr-12 py-4 border-2 border-white border-opacity-30 rounded-2xl text-gray-800 placeholder-gray-400 bg-white backdrop-blur-sm focus:border-opacity-100 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-30 transition-all text-lg font-medium shadow-lg"
                />
                {searchInput && (
                  <button
                    onClick={() => setSearchInput('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl font-bold"
                  >
                    ✖
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {ROLE_FILTERS.map((filter) => {
                  const isActive = roleFilter === filter.value
                  return (
                    <button
                      key={filter.value}
                      onClick={() => setRoleFilter(filter.value)}
                      className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-all ${isActive
                        ? 'bg-white text-blue-700 shadow-lg ring-2 ring-white ring-offset-2 ring-offset-blue-500'
                        : 'bg-white bg-opacity-10 text-white hover:bg-opacity-20'
                        }`}
                    >
                      <span className="text-base">{filter.icon}</span>
                      <span>{filter.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {userListError && (
            <div className="px-6 py-4 bg-red-50 border-l-4 border-red-500 flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <p className="text-red-800 font-semibold">{userListError}</p>
            </div>
          )}

          <div className="p-6">
            {usersLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
                <p className="mt-4 text-gray-600 font-semibold">Đang tải...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl block mb-4">👤</span>
                <p className="text-gray-500 font-semibold">
                  {searchValue ? 'Không tìm thấy tài khoản nào' : 'Không có tài khoản nào'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {users.map((user) => {
                  const pendingRole = roleEdits[user.id] ?? user.role
                  const rowStatus = rowStatuses[user.id]
                  const roleOption = ROLE_OPTIONS.find(r => r.value === user.role)

                  return (
                    <div
                      key={user.id}
                      className="bg-gradient-to-r from-gray-50 to-white border-2 border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-200"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                        {/* User Info */}
                        <div className="flex-1 flex items-start gap-4">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0">
                            {user.full_name?.[0] || user.username[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 truncate">
                              {user.full_name || user.username}
                            </h3>
                            <p className="text-sm text-gray-600 truncate">
                              📧 {user.email}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              ID: #{user.id} · @{user.username}
                            </p>
                            {user.phone && (
                              <p className="text-xs text-gray-500">
                                📱 {user.phone}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Role Badge */}
                        <div className="flex items-center gap-3">
                          <span className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap ${roleOption?.color || 'bg-gray-100 text-gray-800'}`}>
                            {roleOption?.label || user.role}
                          </span>
                        </div>

                        {/* Role Editor */}
                        <div className="flex items-center gap-3 lg:w-80">
                          <select
                            value={pendingRole}
                            onChange={(e) =>
                              setRoleEdits((prev) => ({ ...prev, [user.id]: e.target.value }))
                            }
                            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl font-semibold focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
                          >
                            {ROLE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleInlineRoleSave(user)}
                            disabled={rowStatus?.type === 'loading'}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-200 disabled:opacity-60 whitespace-nowrap"
                          >
                            {rowStatus?.type === 'loading' ? '⏳' : '💾 Lưu'}
                          </button>
                        </div>
                      </div>
                      {rowStatus?.message && (
                        <div className={`mt-3 px-4 py-2 rounded-lg text-sm font-semibold ${rowStatus.type === 'error'
                          ? 'bg-red-100 text-red-800'
                          : rowStatus.type === 'success'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                          }`}>
                          {rowStatus.message}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-4xl">📊</span>
              <div>
                <h2 className="text-2xl font-black text-white">Hoạt động gần đây</h2>
                <p className="text-yellow-100 text-sm">10 hoạt động mới nhất</p>
              </div>
            </div>
            <button
              onClick={() => setActivityLog([])}
              className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl font-semibold transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <span className="text-xl">🗑️</span>
            </button>
          </div>

          <div className="p-6">
            {activityLog.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-5xl block mb-3">📝</span>
                <p className="text-gray-500 font-semibold">Chưa có hoạt động nào</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activityLog.map((item, index) => (
                  <div
                    key={`${item.time}-${index}`}
                    className="flex items-start gap-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-l-4 border-yellow-500"
                  >
                    <span className="text-xl">📌</span>
                    <div className="flex-1">
                      <p className="text-gray-800 font-semibold">{item.message}</p>
                      <p className="text-xs text-gray-500 mt-1">🕐 {item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Staff Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl transform animate-slideUp">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">➕</span>
                  <div>
                    <h2 className="text-2xl font-black text-white">Tạo nhân viên mới</h2>
                    <p className="text-green-100 text-sm">Thêm tài khoản cho đội ngũ</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setStaffState({ status: 'idle', message: '' })
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form className="p-6 space-y-4" onSubmit={handleCreateStaff}>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-xl">👤</span>
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={staffForm.username}
                  onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                  placeholder="nguyenvana"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-xl">📧</span>
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  placeholder="nguyenvana@example.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-xl">🔒</span>
                  Mật khẩu tạm
                </label>
                <input
                  type="password"
                  required
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-xl">🎯</span>
                  Vai trò
                </label>
                <select
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-semibold focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                >
                  {ROLE_OPTIONS.filter((role) => role.value !== 'customer').map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {staffState.message && (
                <div className={`p-4 rounded-xl font-semibold ${staffState.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {staffState.message}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setStaffState({ status: 'idle', message: '' })
                  }}
                  className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-100 transition-all"
                >
                  ❌ Hủy
                </button>
                <button
                  type="submit"
                  disabled={staffDisabled}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {staffDisabled ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      Tạo tài khoản
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </div>
  )
}
