import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

const createApiInstance = () => {
  const instance = axios.create({
    baseURL: API_BASE,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('accessToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          try {
            const { data } = await axios.post(`${API_BASE}/accounts/token/refresh/`, {
              refresh: refreshToken
            })
            localStorage.setItem('accessToken', data.access)
            error.config.headers.Authorization = `Bearer ${data.access}`
            return instance(error.config)
          } catch (refreshError) {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            window.location.href = '/login'
          }
        } else {
          localStorage.removeItem('accessToken')
          window.location.href = '/login'
        }
      }
      return Promise.reject(error)
    }
  )

  return instance
}

const api = createApiInstance()

export const AccountsAPI = {
  login: (credentials) => api.post('/accounts/login/', credentials),
  register: (userData) => api.post('/accounts/register/', userData),
  profile: () => api.get('/accounts/profile/'),
  updateProfile: (data) => api.patch('/accounts/profile/', data),
  changePassword: (data) => api.post('/accounts/change-password/', data),

  // Address management
  addresses: {
    list: () => api.get('/accounts/addresses/'),
    create: (data) => api.post('/accounts/addresses/', data),
    update: (id, data) => api.patch(`/accounts/addresses/${id}/`, data),
    delete: (id) => api.delete(`/accounts/addresses/${id}/`),
  },

  // Location APIs
  listProvinces: () => api.get('/accounts/provinces/'),
  listDistricts: (provinceId) => api.get(`/accounts/districts/?province=${provinceId}`),
  listWards: (districtId) => api.get(`/accounts/wards/?district=${districtId}`),
}

export const MenuAPI = {
  categories: () => api.get('/categories/'),
  menuItems: (params = {}) => api.get('/menu-items/', { params }),
  menuItem: (id) => api.get(`/menu-items/${id}/`),
}

export const CartAPI = {
  getCart: () => api.get('/cart/'),
  addItem: (data) => api.post('/cart/items/', data),
  updateItem: (itemId, data) => api.patch(`/cart/items/${itemId}/`, data),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}/`),
  patchItem: (itemId, data) => api.patch(`/cart/items/${itemId}/`, data),

  // Combo operations
  addCombo: (data) => api.post('/cart/combos/', data),
  updateCombo: (comboId, data) => api.patch(`/cart/combos/${comboId}/`, data),
  removeCombo: (comboId) => api.delete(`/cart/combos/${comboId}/`),
  patchCombo: (comboId, data) => api.patch(`/cart/combos/${comboId}/`, data),

  clearCart: () => api.delete('/cart/clear/'),
}

export const OrderAPI = {
  list: (params = {}) => api.get('/orders/', { params }),
  get: (id) => api.get(`/orders/${id}/`),
  checkout: (data) => api.post('/orders/checkout/', data),
  updateStatus: (id, status) => api.patch(`/orders/${id}/`, { status }),
}

export const ComboAPI = {
  list: (params = {}) => api.get('/combos/', { params }),
  get: (id) => api.get(`/combos/${id}/`),
}

// Export default for backward compatibility
export default {
  AccountsAPI,
  MenuAPI,
  CartAPI,
  OrderAPI,
  ComboAPI,
}
