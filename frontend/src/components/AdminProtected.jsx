import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

export default function AdminProtected({ children }) {
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        const checkAdminAccess = async () => {
            try {
                // Tạm thời cho phép tất cả user truy cập admin để test (bỏ kiểm tra token)
                console.log('Admin access check - allowing access for testing')
                setIsAdmin(true)
            } catch (error) {
                console.error('Failed to verify admin access:', error)
                setIsAdmin(false)
            } finally {
                setLoading(false)
            }
        }

        checkAdminAccess()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        )
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />
    }

    return children
}
