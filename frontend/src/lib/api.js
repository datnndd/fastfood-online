import axios from 'axios'

const api = axios.create({ 
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'
})

// Read tokens from localStorage
function getTokens() {
  const raw = localStorage.getItem('auth')
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

function setTokens(tokens) {
  if (!tokens) localStorage.removeItem('auth')
  else localStorage.setItem('auth', JSON.stringify(tokens))
}

// Request interceptor - tự động thêm token
api.interceptors.request.use((config) => {
  const tokens = getTokens()
  if (tokens?.access) {
    config.headers.Authorization = `Bearer ${tokens.access}`
  }
  return config
})

// Response interceptor - tự động refresh token
let refreshing = null

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error
    if (response?.status === 401 && !config.__isRetry) {
      const tokens = getTokens()
      if (tokens?.refresh && !refreshing) {
        try {
          refreshing = api.post('/auth/token/refresh/', { refresh: tokens.refresh })
          const { data } = await refreshing
          const next = { ...tokens, access: data.access }
          setTokens(next)
          refreshing = null
          const retry = { ...config, __isRetry: true }
          retry.headers = { ...retry.headers, Authorization: `Bearer ${data.access}` }
          return api(retry)
        } catch (e) {
          refreshing = null
          setTokens(null)
          // Redirect to login page hoặc dispatch logout action
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// =============================================================================
// AUTH APIs
// =============================================================================
export const AuthAPI = {
  // Đăng nhập
  login: async (credentials) => {
    const response = await api.post('/auth/token/', credentials)
    // Tự động lưu tokens sau khi login thành công
    if (response.data.access && response.data.refresh) {
      setTokens({
        access: response.data.access,
        refresh: response.data.refresh
      })
    }
    return response
  },

  // Đăng ký tài khoản mới
  register: async (userData) => {
    return await api.post('/accounts/register/', userData)
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    return await api.post('/auth/token/refresh/', { refresh: refreshToken })
  },

  // Lấy thông tin profile
  profile: () => api.get('/accounts/me/'),

  // Đăng xuất (xóa tokens khỏi localStorage)
  logout: () => {
    setTokens(null)
    window.location.href = '/login'
  }
}

// =============================================================================
// ACCOUNTS APIs (cho admin/manager)
// =============================================================================
export const AccountsAPI = {
  // Tạo tài khoản staff
  createStaff: (userData) => api.post('/accounts/staff/create/', userData),

  // Cập nhật role của user
  updateUserRole: (userId, role) => api.put(`/accounts/users/${userId}/role/`, { role }),

  // Cập nhật role của user (partial)
  patchUserRole: (userId, role) => api.patch(`/accounts/users/${userId}/role/`, { role })
}

// =============================================================================
// CATALOG APIs
// =============================================================================
export const CatalogAPI = {
  // Categories
  listCategories: (params = {}) => api.get('/catalog/categories/', { params }),
  getCategory: (id) => api.get(`/catalog/categories/${id}/`),
  createCategory: (data) => api.post('/catalog/categories/', data),
  updateCategory: (id, data) => api.put(`/catalog/categories/${id}/`, data),
  patchCategory: (id, data) => api.patch(`/catalog/categories/${id}/`, data),
  deleteCategory: (id) => api.delete(`/catalog/categories/${id}/`),

  // Menu Items
  listItems: (params = {}) => api.get('/catalog/items/', { params }),
  getItem: (id) => api.get(`/catalog/items/${id}/`),
  createItem: (data) => api.post('/catalog/items/', data),
  updateItem: (id, data) => api.put(`/catalog/items/${id}/`, data),
  patchItem: (id, data) => api.patch(`/catalog/items/${id}/`, data),
  deleteItem: (id) => api.delete(`/catalog/items/${id}/`)
}

// =============================================================================
// CART APIs
// =============================================================================
export const CartAPI = {
  // Lấy giỏ hàng
  getCart: () => api.get('/cart/'),
  
  // Thêm item vào cart
  addItem: ({ menu_item_id, quantity = 1, option_ids = [] }) =>
    api.post('/cart/items/', { 
      menu_item_id, 
      quantity, 
      option_ids 
    }),

  // Cập nhật item trong cart
  updateItem: (itemId, { menu_item_id, quantity, option_ids }) => 
    api.put(`/cart/items/${itemId}/`, { 
      menu_item_id, 
      quantity, 
      option_ids 
    }),
  
  // Cập nhật item trong cart (partial)
  patchItem: (itemId, data) => api.patch(`/cart/items/${itemId}/`, data),
  
  // Xóa item khỏi cart
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}/`)
}

// =============================================================================
// ORDERS APIs
// =============================================================================
export const OrderAPI = {
  work: {
    list: async (params = {}) => {
      const searchParams = new URLSearchParams()
      
      if (params.status) searchParams.append('status', params.status)
      if (params.page) searchParams.append('page', params.page.toString())
      if (params.limit) searchParams.append('limit', params.limit.toString())
      if (params.date) searchParams.append('date', params.date)
      if (params.ordering) searchParams.append('ordering', params.ordering)
      
      const response = await api.get(`/orders/work/?${searchParams.toString()}`)
      return response
    },
    
    updateStatus: async (orderId, newStatus) => {
      const response = await api.patch(`/orders/work/${orderId}/update_status/`, {
        status: newStatus
      })
      return response
    },
    
    getStats: async (date = null) => {
      const params = date ? `?date=${date}` : ''
      const response = await api.get(`/orders/admin/stats/${params}`)
      return response
    }
  },
  
  my: {
    list: async (page = 1, status = null) => {
      const searchParams = new URLSearchParams()
      
      if (page) searchParams.append('page', page.toString())
      if (status) searchParams.append('status', status)

      const response = await api.get(`/orders/my/?${searchParams.toString()}`)
      return response
    },
    
    cancel: async (orderId) => {
      const response = await api.patch(`/orders/my/${orderId}/cancel/`)
      return response
    }
  },
  
  checkout: async (data) => {
    const response = await api.post('/orders/checkout/', data)
    return response
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Kiểm tra user đã đăng nhập chưa
export const isAuthenticated = () => {
  const tokens = getTokens()
  return !!(tokens?.access)
}

// Lấy thông tin tokens hiện tại
export const getCurrentTokens = () => getTokens()

// Lấy user role từ token (cần decode JWT)
export const getUserRole = async () => {
  try {
    const response = await AuthAPI.profile()
    return response.data.role
  } catch (error) {
    return null
  }
}

// Export default
export default api