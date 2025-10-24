import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

export default function AdminProtected({ children }) {
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        const checkAdminAccess = async () => {
            try {
                const token = localStorage.getItem('accessToken')

                // Tạm thời bỏ qua kiểm tra token để test admin
                // if (!token) {
                //   setLoading(false)
                //   return
                // }

                // Tạm thời cho phép tất cả user truy cập admin để test
                console.log('Admin access granted for testing')
                setIsAdmin(true)
            } catch (error) {
                console.error('Failed to verify admin access:', error)
                setIsAdmin(true) // Vẫn cho phép để test
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
        return <Navigate to="/login" replace />
    }

    return children
}
