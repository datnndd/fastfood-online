import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

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

