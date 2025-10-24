import React, { createContext, useContext, useEffect, useState } from 'react'
import { AccountsAPI } from './api' // Sửa đường dẫn import

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadUser()
    }, [])

    const loadUser = async () => {
        const token = localStorage.getItem('accessToken')
        if (!token) {
            setUser(null)
            setLoading(false)
            return
        }

        try {
            const { data } = await AccountsAPI.profile()
            // Đảm bảo lưu thông tin quyền admin
            setUser({
                ...data,
                is_staff: data.is_staff || false,
                is_superuser: data.is_superuser || false
            })
        } catch (error) {
            console.error('Failed to load user profile:', error)
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    const login = async (credentials) => {
        try {
            const { data } = await AccountsAPI.login(credentials)
            localStorage.setItem('accessToken', data.access)
            localStorage.setItem('refreshToken', data.refresh)
            await loadUser()
            return { success: true }
        } catch (error) {
            console.error('Login failed:', error)
            return {
                success: false,
                error: error.response?.data?.detail || 'Đăng nhập thất bại'
            }
        }
    }

    const register = async (userData) => {
        try {
            const { data } = await AccountsAPI.register(userData)
            localStorage.setItem('accessToken', data.access)
            localStorage.setItem('refreshToken', data.refresh)
            await loadUser()
            return { success: true }
        } catch (error) {
            console.error('Registration failed:', error)
            return {
                success: false,
                error: error.response?.data || 'Đăng ký thất bại'
            }
        }
    }

    const logout = () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        setUser(null)
    }

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        loadUser
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}