import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/authContext'

// Loading component có thể tùy chỉnh
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600">Đang tải...</span>
    </div>
  )
}

// Unauthorized component
function Unauthorized({ requiredRoles, userRole }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h1>
        <p className="text-gray-600 mb-4">
          Trang này yêu cầu quyền: {requiredRoles?.join(', ')}
        </p>
        <p className="text-sm text-gray-500">
          Quyền hiện tại: {userRole || 'Chưa xác định'}
        </p>
        <button 
          onClick={() => window.history.back()} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Quay lại
        </button>
      </div>
    </div>
  )
}

export default function Protected({ 
  roles, 
  children, 
  fallback, 
  redirectTo = "/login",
  showUnauthorized = false 
}) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Hiển thị loading
  if (loading) {
    return fallback || <LoadingSpinner />
  }

  // Chưa đăng nhập -> redirect to login với return URL
  if (!user) {
    return <Navigate 
      to={redirectTo} 
      state={{ from: location.pathname }}
      replace 
    />
  }

  // Kiểm tra quyền truy cập
  if (roles && !roles.includes(user.role)) {
    if (showUnauthorized) {
      return <Unauthorized requiredRoles={roles} userRole={user.role} />
    }
    return <Navigate to="/" replace />
  }

  return children
}
