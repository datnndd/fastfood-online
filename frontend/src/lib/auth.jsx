import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, subscribeToSession, getCurrentSession } from './supabaseClient'
import { AuthAPI, setApiAccessToken } from './api'

const AuthContext = createContext(null)
const defaultRedirect = typeof window !== 'undefined' ? window.location.origin : undefined
const oauthRedirectTo = import.meta.env.VITE_SUPABASE_REDIRECT_URL || defaultRedirect

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getCurrentSession())
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    const activeSession = getCurrentSession()
    if (!activeSession?.access_token) {
      setUser(null)
      return null
    }

    try {
      const { data } = await AuthAPI.profile()
      setUser(data)
      return data
    } catch (error) {
      console.warn('Không thể tải thông tin người dùng', error)
      setUser(null)
      throw error
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const unsubscribe = subscribeToSession((nextSession) => {
      if (!mounted) return
      setSession(nextSession)
      setApiAccessToken(nextSession?.access_token)
      if (nextSession?.access_token) {
        setLoading(true)
        fetchProfile()
          .catch(() => {})
          .finally(() => {
            if (mounted) {
              setLoading(false)
            }
          })
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [fetchProfile])

  const login = useCallback(async (email, password) => {
    const cleanedEmail = (email || '').trim().toLowerCase()
    if (!cleanedEmail) {
      throw new Error('Vui lòng nhập email')
    }
    if (!cleanedEmail.includes('@')) {
      throw new Error('Email không hợp lệ')
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanedEmail, password })
    if (error) {
      throw error
    }
    setSession(data.session)
    setApiAccessToken(data.session?.access_token)
    await fetchProfile()
  }, [fetchProfile])

  const register = useCallback(async (formValues) => {
    const payload = {
      username: formValues.username?.trim() || '',
      password: formValues.password,
      email: formValues.email?.trim() || '',
      phone: formValues.phone?.trim() || '',
      address_line: formValues.address_line?.trim() || '',
      province_id: formValues.province_id ? Number(formValues.province_id) : null,
      ward_id: formValues.ward_id ? Number(formValues.ward_id) : null,
      set_default_address: Boolean(formValues.set_default_address)
    }

    await AuthAPI.register(payload, { dryRun: true })

    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          username: payload.username,
          phone: payload.phone
        }
      }
    })
    if (error) {
      throw error
    }

    let profileSynced = true
    try {
      await AuthAPI.register({ ...payload, supabase_id: data.user?.id })
    } catch (syncError) {
      console.error('Không thể đồng bộ hồ sơ với backend', syncError)
      profileSynced = false
    }

    return { data, profileSynced }
  }, [])

  const requestPasswordReset = useCallback(async (email) => {
    const cleanedEmail = (email || '').trim().toLowerCase()
    if (!cleanedEmail) throw new Error('Vui lòng nhập email')
    const { error } = await supabase.auth.resetPasswordForEmail(cleanedEmail, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) throw error
  }, [])

  const updatePassword = useCallback(async (newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Mật khẩu mới phải từ 6 ký tự')
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }, [])

  const loginWithProvider = useCallback(async (provider) => {
    const options = {}
    if (oauthRedirectTo) {
      options.redirectTo = oauthRedirectTo
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options,
    })
    if (error) {
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setApiAccessToken(null)
    setSession(null)
    setUser(null)
  }, [])

  const refreshProfile = useCallback(() => fetchProfile(), [fetchProfile])

  const value = useMemo(() => ({
    user,
    session,
    loading,
    login,
    loginWithProvider,
    logout,
    register,
    refreshProfile
  }), [user, session, loading, login, loginWithProvider, logout, register, refreshProfile])

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

export const useRole = () => {
  const { user } = useAuth()
  const role = user?.role
  const hasStaffAccess = role === 'staff' || role === 'manager'
  return {
    role,
    hasStaffAccess,
    isManager: role === 'manager'
  }
}
