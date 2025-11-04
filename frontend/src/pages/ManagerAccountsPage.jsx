import { useCallback, useEffect, useMemo, useState } from 'react'
import { AccountsAPI } from '../lib/api'

const ROLE_OPTIONS = [
  { value: 'customer', label: 'Khách hàng' },
  { value: 'staff', label: 'Nhân viên' },
  { value: 'manager', label: 'Quản lý' }
]

const getErrorMessage = (error, fallback = 'Đã có lỗi xảy ra') => {
  const data = error?.response?.data
  if (!data) {
    return error?.message || fallback
  }
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
  const [staffForm, setStaffForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'staff'
  })
  const [staffState, setStaffState] = useState({ status: 'idle', message: '' })

  const [roleForm, setRoleForm] = useState({ userId: '', role: 'staff' })
  const [roleState, setRoleState] = useState({ status: 'idle', message: '' })

  const [activityLog, setActivityLog] = useState([])
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userListError, setUserListError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const [roleEdits, setRoleEdits] = useState({})
  const [rowStatuses, setRowStatuses] = useState({})

  const addActivity = (message) => {
    setActivityLog((prev) => [{ message, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 5))
  }

  const staffDisabled = staffState.status === 'loading'
  const roleDisabled = roleState.status === 'loading'

  const successColor = 'text-green-600'
  const errorColor = 'text-red-600'

  const helperText = useMemo(() => ({
    createStaff: 'POST /accounts/staff/create/',
    updateRole: 'PATCH /accounts/users/<id>/role/',
    listUsers: 'GET /accounts/users/?search=<string>'
  }), [])

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

  useEffect(() => {
    const params = searchValue ? { search: searchValue } : {}
    loadUsers(params)
  }, [searchValue, loadUsers])

  const refreshUsers = () => {
    const params = searchValue ? { search: searchValue } : {}
    loadUsers(params)
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
      setRowStatus(user.id, { type: 'success', message: 'Đã cập nhật vai trò.' })
      addActivity(`Cập nhật vai trò user #${user.id} thành ${pendingRole}`)
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
      setStaffState({ status: 'success', message: 'Tạo tài khoản nhân viên thành công.' })
      setStaffForm({ username: '', email: '', password: '', role: 'staff' })
      addActivity(`Đã tạo nhân viên "${staffForm.username}" với vai trò ${staffForm.role}`)
    } catch (error) {
      setStaffState({
        status: 'error',
        message: getErrorMessage(error, 'Không thể tạo tài khoản. Vui lòng thử lại.')
      })
    }
  }

  const handleUpdateRole = async (event) => {
    event.preventDefault()
    if (!roleForm.userId) {
      setRoleState({ status: 'error', message: 'Vui lòng nhập ID người dùng cần cập nhật.' })
      return
    }

    const userId = Number(roleForm.userId)
    if (Number.isNaN(userId)) {
      setRoleState({ status: 'error', message: 'ID người dùng không hợp lệ.' })
      return
    }

    setRoleState({ status: 'loading', message: '' })

    try {
      await AccountsAPI.patchUserRole(userId, roleForm.role)
      setRoleState({ status: 'success', message: 'Cập nhật vai trò thành công.' })
      addActivity(`Đã đổi vai trò user #${userId} thành ${roleForm.role}`)
    } catch (error) {
      setRoleState({
        status: 'error',
        message: getErrorMessage(error, 'Không thể cập nhật vai trò lúc này.')
      })
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 space-y-10">
        <header className="space-y-3">
          <p className="text-sm font-semibold text-red-600 uppercase tracking-wide">Manager</p>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý tài khoản</h1>
          <p className="text-gray-600 max-w-3xl">
            Trang này giúp bạn tạo nhanh tài khoản cho nhân viên và điều chỉnh vai trò người dùng.
            Các thao tác sử dụng trực tiếp các endpoint có trong <code className="bg-gray-200 px-1 py-0.5 rounded text-sm">AccountsAPI</code> của <code className="bg-gray-200 px-1 py-0.5 rounded text-sm">api.js</code>.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-2">
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Tạo tài khoản nhân viên</h2>
                <p className="text-sm text-gray-500">{helperText.createStaff}</p>
              </div>
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">CREATE</span>
            </div>

            <form className="space-y-4" onSubmit={handleCreateStaff}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={staffForm.username}
                  onChange={(event) => setStaffForm({ ...staffForm, username: event.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={staffForm.email}
                  onChange={(event) => setStaffForm({ ...staffForm, email: event.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu tạm</label>
                <input
                  type="password"
                  required
                  value={staffForm.password}
                  onChange={(event) => setStaffForm({ ...staffForm, password: event.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nhân viên có thể đổi mật khẩu sau khi đăng nhập.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                <select
                  value={staffForm.role}
                  onChange={(event) => setStaffForm({ ...staffForm, role: event.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
                >
                  {ROLE_OPTIONS.filter((role) => role.value !== 'customer').map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {staffState.message && (
                <p className={`${staffState.status === 'error' ? errorColor : successColor} text-sm`}>
                  {staffState.message}
                </p>
              )}

              <button
                type="submit"
                disabled={staffDisabled}
                className="w-full py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition disabled:opacity-60"
              >
                {staffDisabled ? 'Đang xử lý...' : 'Tạo tài khoản'}
              </button>
            </form>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Điều chỉnh vai trò</h2>
                <p className="text-sm text-gray-500">{helperText.updateRole}</p>
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">PATCH</span>
            </div>

            <form className="space-y-4" onSubmit={handleUpdateRole}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={roleForm.userId}
                  onChange={(event) => setRoleForm({ ...roleForm, userId: event.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
                  placeholder="Ví dụ: 42"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò mới</label>
                <select
                  value={roleForm.role}
                  onChange={(event) => setRoleForm({ ...roleForm, role: event.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {roleState.message && (
                <p className={`${roleState.status === 'error' ? errorColor : successColor} text-sm`}>
                  {roleState.message}
                </p>
              )}

              <button
                type="submit"
                disabled={roleDisabled}
                className="w-full py-2 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition disabled:opacity-60"
              >
                {roleDisabled ? 'Đang cập nhật...' : 'Cập nhật vai trò'}
              </button>
            </form>

            <div className="mt-4 text-xs text-gray-500">
              Gợi ý: Sử dụng Django admin hoặc báo cáo nội bộ để tra user ID trước khi cập nhật.
            </div>
          </section>
        </div>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Danh sách tài khoản</h2>
              <p className="text-sm text-gray-500">{helperText.listUsers}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="flex-1">
                <label className="sr-only" htmlFor="search-users">Tìm kiếm</label>
                <input
                  id="search-users"
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Tìm theo tên hoặc email"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-red-500 focus:ring-red-500"
                />
              </div>
              <button
                type="button"
                onClick={refreshUsers}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:border-gray-300"
              >
                Làm mới
              </button>
            </div>
          </div>

          {userListError && (
            <div className="px-6 py-3 text-sm text-red-600 bg-red-50 border-b border-red-100">
              {userListError}
            </div>
          )}

          <div className="divide-y divide-gray-100">
            <div className="hidden md:grid md:grid-cols-4 gap-4 px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
              <span>Người dùng</span>
              <span>Liên hệ</span>
              <span>Vai trò</span>
              <span className="text-right">Hành động</span>
            </div>

            {usersLoading ? (
              <div className="px-6 py-10 text-center text-gray-500">Đang tải danh sách...</div>
            ) : users.length === 0 ? (
              <div className="px-6 py-10 text-center text-gray-500">Không có tài khoản phù hợp.</div>
            ) : (
              users.map((user) => {
                const pendingRole = roleEdits[user.id] ?? user.role
                const rowStatus = rowStatuses[user.id]
                const originalRoleLabel = roleLabelMap[user.role] || user.role_display || user.role
                return (
                  <div key={user.id} className="px-6 py-4 flex flex-col gap-4 md:grid md:grid-cols-4 md:items-center">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{user.full_name || user.username}</p>
                      <p className="text-xs text-gray-500">#{user.id} · {user.username}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">{user.email}</p>
                      {user.phone && <p className="text-xs text-gray-500">{user.phone}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={pendingRole}
                        onChange={(event) =>
                          setRoleEdits((prev) => ({ ...prev, [user.id]: event.target.value }))
                        }
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-500 focus:ring-red-500"
                      >
                        {ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <span className="text-xs text-gray-500">{originalRoleLabel}</span>
                    </div>
                    <div className="md:text-right">
                      <button
                        type="button"
                        onClick={() => handleInlineRoleSave(user)}
                        disabled={rowStatus?.type === 'loading'}
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:border-gray-300 disabled:opacity-60"
                      >
                        {rowStatus?.type === 'loading' ? 'Đang lưu...' : 'Lưu vai trò'}
                      </button>
                      {rowStatus?.message && (
                        <p
                          className={`mt-2 text-xs ${
                            rowStatus.type === 'error'
                              ? 'text-red-600'
                              : rowStatus.type === 'success'
                                ? 'text-green-600'
                                : 'text-gray-500'
                          }`}
                        >
                          {rowStatus.message}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Hoạt động gần đây</h2>
            <button
              type="button"
              onClick={() => setActivityLog([])}
              className="text-sm text-gray-500 hover:text-red-600"
            >
              Xóa lịch sử
            </button>
          </div>

          {activityLog.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có hoạt động nào.</p>
          ) : (
            <ul className="space-y-3">
              {activityLog.map((item, index) => (
                <li key={`${item.time}-${index}`} className="flex items-start space-x-3">
                  <span className="w-2 h-2 mt-2 rounded-full bg-red-500" />
                  <div>
                    <p className="text-sm text-gray-800">{item.message}</p>
                    <p className="text-xs text-gray-500">{item.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
