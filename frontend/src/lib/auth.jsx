// ============================================
// lib/auth.jsx - FIXED VERSION
// ============================================
import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { AuthAPI, isAuthenticated, getCurrentTokens } from './api'

const Ctx = createContext()
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // Auto-login khi component mount
    useEffect(() => {
        const initAuth = async () => {
            try {
                // Kiểm tra có tokens không
                if (!isAuthenticated()) {
                    setLoading(false)
                    return
                }

                // Lấy profile từ server để verify token và lấy thông tin user
                const response = await AuthAPI.profile()
                setUser(response.data)
            } catch (error) {
                // Token invalid hoặc expired, API client sẽ tự động handle
                console.error('Auth init failed:', error)
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        initAuth()
    }, [])

    // Login function - sử dụng API client
    const login = async (username, password) => {
        try {
            setLoading(true)
            // API client sẽ tự động lưu tokens
            await AuthAPI.login({ username, password })

            // Lấy thông tin user sau khi login thành công
            const profileResponse = await AuthAPI.profile()
            setUser(profileResponse.data)

            return profileResponse.data
        } catch (error) {
            throw error // Re-throw để component có thể handle error
        } finally {
            setLoading(false)
        }
    }

    // Register function - thêm mới
    const register = async (userData) => {
        try {
            const response = await AuthAPI.register(userData)
            return response.data
        } catch (error) {
            throw error
        }
    }

    // Logout function - sử dụng API client
    const logout = () => {
        AuthAPI.logout() // API client sẽ handle việc xóa tokens và redirect
        setUser(null)
    }

    // Update user profile sau khi edit
    const updateUser = (userData) => {
        setUser(prevUser => ({ ...prevUser, ...userData }))
    }

    // Refresh user data from server
    const refreshUser = async () => {
        try {
            if (!isAuthenticated()) return null

            const response = await AuthAPI.profile()
            setUser(response.data)
            return response.data
        } catch (error) {
            console.error('Failed to refresh user:', error)
            setUser(null)
            return null
        }
    }

    // Memoize computed values để tránh re-render không cần thiết
    const authState = useMemo(() => ({
        isAuthenticated: !!user && isAuthenticated(), // Reactive value
        tokens: getCurrentTokens()
    }), [user])

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
        ...authState
    }

    return (
        <Ctx.Provider value={value}>
            {children}
        </Ctx.Provider>
    )
}

// Hook để kiểm tra role
export const useRole = () => {
    const { user } = useAuth()

    return useMemo(() => ({
        role: user?.role,
        isCustomer: user?.role === 'customer',
        isStaff: user?.role === 'staff',
        isManager: user?.role === 'manager',
        hasStaffAccess: ['staff', 'manager'].includes(user?.role),
        hasManagerAccess: user?.role === 'manager'
    }), [user?.role])
}

// Hook để check authentication status
export const useAuthStatus = () => {
    const { user, loading } = useAuth()

    return useMemo(() => ({
        isLoggedIn: !!user,
        isLoading: loading,
        isGuest: !user && !loading
    }), [user, loading])
}