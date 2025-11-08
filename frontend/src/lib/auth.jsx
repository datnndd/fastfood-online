import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase, subscribeToSession, getCurrentSession } from './supabaseClient'
import { AuthAPI, setApiAccessToken } from './api'
import { AuthContext } from './authContext'

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

  const login = useCallback(async (usernameOrEmail, password) => {
    const loginInput = (usernameOrEmail || '').trim().toLowerCase()
    if (!loginInput) {
      throw new Error('Vui lòng nhập email hoặc tên đăng nhập')
    }
    if (!password) {
      // Thêm kiểm tra mật khẩu cho chắc chắn
      throw new Error('Vui lòng nhập mật khẩu')
    }

    let loginEmail = ''
    if (loginInput.includes('@')) {
      // Người dùng đã nhập email
      loginEmail = loginInput.toLowerCase()
    } else {
      // Người dùng đã nhập username, gọi backend để lấy email
      try {
        const { data } = await AuthAPI.getEmailForUsername(loginInput)
        if (!data?.email) {
          throw new Error('Không tìm thấy email cho username này.')
        }
        loginEmail = data.email
      } catch (err) {
        console.error('Lỗi khi lấy email từ username:', err)
        if (err.response?.status === 404) {
          throw new Error('Username không tồn tại.')
        }
        throw new Error('Đăng nhập thất bại. Không thể xác thực username.')
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password })
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Email/username hoặc mật khẩu không đúng.')
      }
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
      full_name: formValues.full_name?.trim() || '',
      phone: formValues.phone?.trim() || '',
      gender: formValues.gender || 'unspecified',
      date_of_birth: formValues.date_of_birth || null,
      address_line: formValues.address_line?.trim() || '',
      province_id: formValues.province_id ? Number(formValues.province_id) : null,
      ward_id: formValues.ward_id ? Number(formValues.ward_id) : null,
      set_default_address: Boolean(formValues.set_default_address)
    }

    await AuthAPI.register(payload, { dryRun: true })

    const metadata = {
      username: payload.username
    }
    if (payload.phone) metadata.phone = payload.phone
    if (payload.full_name) metadata.full_name = payload.full_name
    if (payload.gender && payload.gender !== 'unspecified') metadata.gender = payload.gender
    if (payload.date_of_birth) metadata.date_of_birth = payload.date_of_birth

    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: metadata
      }
    })
    if (error) {
      if (error.message.includes('Anonymous sign-ins are disabled')) {
          throw new Error('Nhập thêm email hoặc số điện thoại.')
        }
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

  const resetPasswordForEmail = useCallback(async (email) => {
    const cleanedEmail = (email || '').trim().toLowerCase()
    if (!cleanedEmail) throw new Error('Vui lòng nhập email')
    const redirectTo = import.meta.env.VITE_PASSWORD_RESET_URL || (window.location.origin + '/update-password')

    const { error } = await supabase.auth.resetPasswordForEmail(cleanedEmail, { redirectTo })
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

  const updatePassword = useCallback(async (password) => {
    // 1. Cập nhật mật khẩu trong Supabase
    // Hàm này chỉ hoạt động khi user đang ở trong session "PASSWORD_RECOVERY"
    // (tức là vừa click link trong email)
    const { data, error } = await supabase.auth.updateUser({ password })
    if (error) {
      throw new Error(`Supabase error: ${error.message}`)
    }

    // 2. Cập nhật mật khẩu trong Django
    // Hàm setApiAccessToken() trong file này và supabaseClient.js
    // đã tự động lấy access token mới từ session PASSWORD_RECOVERY,
    // nên api.js sẽ tự động dùng token đó để xác thực với Django.
    try {
      await AuthAPI.setPassword(password)
    } catch (djangoError) {
      console.error("Lỗi nghiêm trọng: Không thể đồng bộ mật khẩu với Django", djangoError)
      // Xử lý lỗi: Mật khẩu đã đổi ở Supabase nhưng chưa đổi ở Django
      throw new Error("Mật khẩu đã được cập nhật, nhưng không thể đồng bộ với máy chủ. Vui lòng đăng nhập lại và thử đổi mật khẩu trong trang cá nhân.")
    }
    return data
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
    refreshProfile,
    resetPasswordForEmail,
    updatePassword
  }), [user, session, loading, login, loginWithProvider, logout, register, refreshProfile, resetPasswordForEmail, updatePassword])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export { useAuth, useRole } from './authContext'
