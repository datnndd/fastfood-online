import { useEffect, useState } from 'react'
import AdminProtected from '../../components/AdminProtected'
import AdminLayout from '../../components/AdminLayout'

// SVG Icons
const EyeIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
)

const PencilIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
)

const XMarkIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
)

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

export default function UsersPage() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [roleFilter, setRoleFilter] = useState('')

    // Modal states
    const [showModal, setShowModal] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [modalMode, setModalMode] = useState('view') // 'view', 'edit'
    const [editForm, setEditForm] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        is_active: true,
        is_staff: false,
        is_superuser: false
    })
    const [updating, setUpdating] = useState(false)

    useEffect(() => {
        loadUsers()
    }, [])

    const loadUsers = async () => {
        setLoading(true)
        try {
            // Sample data - thay thế bằng API thực
            setUsers([
                {
                    id: 1,
                    username: 'admin',
                    email: 'admin@example.com',
                    first_name: 'Admin',
                    last_name: 'User',
                    is_active: true,
                    is_staff: true,
                    is_superuser: true,
                    date_joined: '2024-01-01T10:00:00Z',
                    last_login: '2024-01-15T08:30:00Z',
                    total_orders: 0,
                    total_spent: 0
                },
                {
                    id: 2,
                    username: 'user1',
                    email: 'user1@example.com',
                    first_name: 'Nguyễn',
                    last_name: 'Văn A',
                    is_active: true,
                    is_staff: false,
                    is_superuser: false,
                    date_joined: '2024-01-02T14:30:00Z',
                    last_login: '2024-01-14T19:45:00Z',
                    total_orders: 15,
                    total_spent: 2500000
                },
                {
                    id: 3,
                    username: 'user2',
                    email: 'user2@example.com',
                    first_name: 'Trần',
                    last_name: 'Thị B',
                    is_active: true,
                    is_staff: false,
                    is_superuser: false,
                    date_joined: '2024-01-03T09:15:00Z',
                    last_login: '2024-01-13T16:20:00Z',
                    total_orders: 8,
                    total_spent: 1200000
                },
                {
                    id: 4,
                    username: 'staff1',
                    email: 'staff1@example.com',
                    first_name: 'Lê',
                    last_name: 'Văn C',
                    is_active: true,
                    is_staff: true,
                    is_superuser: false,
                    date_joined: '2024-01-04T11:00:00Z',
                    last_login: '2024-01-15T07:00:00Z',
                    total_orders: 3,
                    total_spent: 450000
                },
                {
                    id: 5,
                    username: 'inactive_user',
                    email: 'inactive@example.com',
                    first_name: 'Phạm',
                    last_name: 'Thị D',
                    is_active: false,
                    is_staff: false,
                    is_superuser: false,
                    date_joined: '2024-01-05T15:30:00Z',
                    last_login: '2024-01-10T12:00:00Z',
                    total_orders: 2,
                    total_spent: 300000
                }
            ])
        } catch (error) {
            console.error('Failed to load users:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.last_name?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = !statusFilter ||
            (statusFilter === 'active' && user.is_active) ||
            (statusFilter === 'inactive' && !user.is_active)

        const matchesRole = !roleFilter ||
            (roleFilter === 'superuser' && user.is_superuser) ||
            (roleFilter === 'staff' && user.is_staff && !user.is_superuser) ||
            (roleFilter === 'customer' && !user.is_staff && !user.is_superuser)

        return matchesSearch && matchesStatus && matchesRole
    })

    const getUserRole = (user) => {
        if (user.is_superuser) return { text: 'Super Admin', color: 'bg-purple-100 text-purple-800' }
        if (user.is_staff) return { text: 'Nhân viên', color: 'bg-blue-100 text-blue-800' }
        return { text: 'Khách hàng', color: 'bg-green-100 text-green-800' }
    }

    const getStatusBadge = (isActive) => {
        return isActive
            ? { text: 'Hoạt động', color: 'bg-green-100 text-green-800' }
            : { text: 'Tạm khóa', color: 'bg-red-100 text-red-800' }
    }

    const formatCurrency = (value) => {
        return Number(value || 0).toLocaleString('vi-VN')
    }

    const openViewModal = (user) => {
        setSelectedUser(user)
        setModalMode('view')
        setShowModal(true)
    }

    const openEditModal = (user) => {
        setSelectedUser(user)
        setEditForm({
            username: user.username || '',
            email: user.email || '',
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            is_active: user.is_active,
            is_staff: user.is_staff,
            is_superuser: user.is_superuser
        })
        setModalMode('edit')
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setSelectedUser(null)
        setModalMode('view')
        setEditForm({
            username: '',
            email: '',
            first_name: '',
            last_name: '',
            is_active: true,
            is_staff: false,
            is_superuser: false
        })
    }

    const handleUpdateUser = async (e) => {
        e.preventDefault()
        setUpdating(true)

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Update local state
            setUsers(prev => prev.map(user =>
                user.id === selectedUser.id
                    ? { ...user, ...editForm }
                    : user
            ))

            closeModal()
            alert('Cập nhật thông tin người dùng thành công')
        } catch (error) {
            console.error('Failed to update user:', error)
            alert('Không thể cập nhật thông tin người dùng')
        } finally {
            setUpdating(false)
        }
    }

    const handleToggleUserStatus = async (userId) => {
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500))

            setUsers(prev => prev.map(user =>
                user.id === userId
                    ? { ...user, is_active: !user.is_active }
                    : user
            ))

            const user = users.find(u => u.id === userId)
            const newStatus = !user.is_active ? 'kích hoạt' : 'tạm khóa'
            alert(`Đã ${newStatus} tài khoản thành công`)
        } catch (error) {
            console.error('Failed to toggle user status:', error)
            alert('Không thể thay đổi trạng thái tài khoản')
        }
    }

    if (loading) {
        return (
            <AdminProtected>
                <AdminLayout>
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                    </div>
                </AdminLayout>
            </AdminProtected>
        )
    }

    return (
        <AdminProtected>
            <AdminLayout>
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
                        <p className="text-gray-600">Danh sách tất cả người dùng trong hệ thống</p>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tìm kiếm
                                </label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Tên, email, username..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Trạng thái
                                </label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                >
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="active">Hoạt động</option>
                                    <option value="inactive">Tạm khóa</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Vai trò
                                </label>
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                >
                                    <option value="">Tất cả vai trò</option>
                                    <option value="superuser">Super Admin</option>
                                    <option value="staff">Nhân viên</option>
                                    <option value="customer">Khách hàng</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <div className="text-sm text-gray-600">
                                    Tổng: <span className="font-semibold">{filteredUsers.length}</span> người dùng
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Người dùng
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Vai trò
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Đơn hàng
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tổng chi tiêu
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ngày tham gia
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredUsers.length > 0 ? filteredUsers.map((user) => {
                                        const role = getUserRole(user)
                                        const status = getStatusBadge(user.is_active)

                                        return (
                                            <tr key={user.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="font-medium text-gray-900">
                                                            {user.first_name} {user.last_name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">@{user.username}</div>
                                                        <div className="text-sm text-gray-500">{user.email}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${role.color}`}>
                                                        {role.text}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                                                        {status.text}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {user.total_orders || 0}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatCurrency(user.total_spent)}₫
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(user.date_joined)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => openViewModal(user)}
                                                            className="text-blue-600 hover:text-blue-700"
                                                            title="Xem chi tiết"
                                                        >
                                                            <EyeIcon />
                                                        </button>
                                                        <button
                                                            onClick={() => openEditModal(user)}
                                                            className="text-green-600 hover:text-green-700"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <PencilIcon />
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleUserStatus(user.id)}
                                                            className={`text-sm font-medium ${user.is_active
                                                                ? 'text-red-600 hover:text-red-700'
                                                                : 'text-green-600 hover:text-green-700'
                                                                }`}
                                                        >
                                                            {user.is_active ? 'Khóa' : 'Kích hoạt'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    }) : (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                                                Không tìm thấy người dùng nào
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* User Detail Modal */}
                {showModal && selectedUser && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {modalMode === 'view' ? 'Chi tiết người dùng' : 'Chỉnh sửa người dùng'}
                                </h3>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XMarkIcon />
                                </button>
                            </div>

                            {modalMode === 'view' ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
                                            <p className="text-sm text-gray-900 mt-1">
                                                {selectedUser.first_name} {selectedUser.last_name}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Username</label>
                                            <p className="text-sm text-gray-900 mt-1">@{selectedUser.username}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Email</label>
                                            <p className="text-sm text-gray-900 mt-1">{selectedUser.email}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Vai trò</label>
                                            <p className="text-sm text-gray-900 mt-1">{getUserRole(selectedUser).text}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                                            <p className="text-sm text-gray-900 mt-1">{getStatusBadge(selectedUser.is_active).text}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Ngày tham gia</label>
                                            <p className="text-sm text-gray-900 mt-1">{formatDate(selectedUser.date_joined)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Lần đăng nhập cuối</label>
                                            <p className="text-sm text-gray-900 mt-1">
                                                {selectedUser.last_login ? formatDate(selectedUser.last_login) : 'Chưa đăng nhập'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Tổng đơn hàng</label>
                                            <p className="text-sm text-gray-900 mt-1">{selectedUser.total_orders || 0}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">Tổng chi tiêu</label>
                                            <p className="text-sm text-gray-900 mt-1">{formatCurrency(selectedUser.total_spent)}₫</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            onClick={() => setModalMode('edit')}
                                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 mr-2"
                                        >
                                            Chỉnh sửa
                                        </button>
                                        <button
                                            onClick={closeModal}
                                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                        >
                                            Đóng
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleUpdateUser} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Username *
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.username}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                                                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Email *
                                            </label>
                                            <input
                                                type="email"
                                                value={editForm.email}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tên
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.first_name}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                                                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Họ
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.last_name}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                                                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={editForm.is_active}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.checked }))}
                                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                            />
                                            <span className="ml-2 text-sm text-gray-900">Tài khoản hoạt động</span>
                                        </label>

                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={editForm.is_staff}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, is_staff: e.target.checked }))}
                                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                            />
                                            <span className="ml-2 text-sm text-gray-900">Quyền nhân viên</span>
                                        </label>

                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={editForm.is_superuser}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, is_superuser: e.target.checked }))}
                                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                            />
                                            <span className="ml-2 text-sm text-gray-900">Quyền super admin</span>
                                        </label>
                                    </div>

                                    <div className="flex justify-end space-x-2 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setModalMode('view')}
                                            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                                            disabled={updating}
                                        >
                                            Quay lại
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                                            disabled={updating}
                                        >
                                            {updating ? 'Đang lưu...' : 'Cập nhật'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </AdminLayout>
        </AdminProtected>
    )
}
