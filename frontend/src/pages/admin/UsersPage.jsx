import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'

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
    const [roleFilter, setRoleFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

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
                    date_joined: new Date().toISOString(),
                    last_login: new Date().toISOString()
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
                    date_joined: new Date().toISOString(),
                    last_login: new Date().toISOString()
                },
                {
                    id: 3,
                    username: 'manager1',
                    email: 'manager@example.com',
                    first_name: 'Trần',
                    last_name: 'Thị B',
                    is_active: true,
                    is_staff: true,
                    is_superuser: false,
                    date_joined: new Date().toISOString(),
                    last_login: new Date().toISOString()
                },
                {
                    id: 4,
                    username: 'user2',
                    email: 'user2@example.com',
                    first_name: 'Lê',
                    last_name: 'Văn C',
                    is_active: false,
                    is_staff: false,
                    is_superuser: false,
                    date_joined: new Date().toISOString(),
                    last_login: null
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

        const matchesRole = !roleFilter ||
            (roleFilter === 'admin' && user.is_superuser) ||
            (roleFilter === 'staff' && user.is_staff && !user.is_superuser) ||
            (roleFilter === 'user' && !user.is_staff && !user.is_superuser)

        const matchesStatus = !statusFilter ||
            (statusFilter === 'active' && user.is_active) ||
            (statusFilter === 'inactive' && !user.is_active)

        return matchesSearch && matchesRole && matchesStatus
    })

    const getUserRole = (user) => {
        if (user.is_superuser) return 'Super Admin'
        if (user.is_staff) return 'Staff'
        return 'User'
    }

    const getRoleBadge = (user) => {
        if (user.is_superuser) {
            return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Super Admin</span>
        }
        if (user.is_staff) {
            return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Staff</span>
        }
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">User</span>
    }

    const getStatusBadge = (user) => {
        return user.is_active ?
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Hoạt động</span> :
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Không hoạt động</span>
    }

    const handleToggleStatus = async (userId) => {
        try {
            setUsers(prev => prev.map(user =>
                user.id === userId ? { ...user, is_active: !user.is_active } : user
            ))
            // API call would go here
        } catch (error) {
            console.error('Failed to toggle user status:', error)
        }
    }

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                </div>
            </AdminLayout>
        )
    }

    return (
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
                                Vai trò
                            </label>
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            >
                                <option value="">Tất cả vai trò</option>
                                <option value="admin">Super Admin</option>
                                <option value="staff">Staff</option>
                                <option value="user">User</option>
                            </select>
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
                                <option value="inactive">Không hoạt động</option>
                            </select>
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
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Vai trò
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ngày tham gia
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Lần cuối đăng nhập
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                                                    <span className="text-white text-sm font-medium">
                                                        {user.first_name?.charAt(0) || user.username?.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {user.first_name} {user.last_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">@{user.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getRoleBadge(user)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(user)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(user.date_joined)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.last_login ? formatDate(user.last_login) : 'Chưa từng'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleToggleStatus(user.id)}
                                                    className={`px-3 py-1 text-xs rounded transition-colors ${user.is_active
                                                            ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                                                        }`}
                                                >
                                                    {user.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                                </button>
                                                <button className="px-3 py-1 text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 rounded transition-colors">
                                                    Chi tiết
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
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

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="text-2xl font-bold text-gray-900">{users.length}</div>
                        <div className="text-sm text-gray-600">Tổng người dùng</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="text-2xl font-bold text-green-600">
                            {users.filter(u => u.is_active).length}
                        </div>
                        <div className="text-sm text-gray-600">Đang hoạt động</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="text-2xl font-bold text-blue-600">
                            {users.filter(u => u.is_staff).length}
                        </div>
                        <div className="text-sm text-gray-600">Staff</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="text-2xl font-bold text-red-600">
                            {users.filter(u => u.is_superuser).length}
                        </div>
                        <div className="text-sm text-gray-600">Super Admin</div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
