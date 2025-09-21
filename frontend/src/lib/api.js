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
  addItem: (itemData) => api.post('/cart/items/', itemData),
  
  // Cập nhật item trong cart
  updateItem: (itemId, itemData) => api.put(`/cart/items/${itemId}/`, itemData),
  
  // Cập nhật item trong cart (partial)
  patchItem: (itemId, itemData) => api.patch(`/cart/items/${itemId}/`, itemData),
  
  // Xóa item khỏi cart
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}/`)
}

// =============================================================================
// ORDERS APIs
// =============================================================================
export const OrderAPI = {
  // Checkout - tạo đơn hàng từ cart
  checkout: (orderData) => api.post('/orders/checkout/', orderData),
  
  // Lấy đơn hàng của user hiện tại
  getMyOrders: (params = {}) => api.get('/orders/my/', { params }),
  
  // APIs cho Staff/Manager
  work: {
    // Lấy tất cả đơn hàng (staff/manager)
    list: (params = {}) => api.get('/orders/work/', { params }),
    
    // Tạo đơn hàng (staff/manager)
    create: (orderData) => api.post('/orders/work/', orderData),
    
    // Lấy chi tiết đơn hàng
    get: (orderId) => api.get(`/orders/work/${orderId}/`),
    
    // Cập nhật đơn hàng
    update: (orderId, orderData) => api.put(`/orders/work/${orderId}/`, orderData),
    
    // Cập nhật trạng thái đơn hàng
    updateStatus: (orderId, status) => api.patch(`/orders/work/${orderId}/`, { status }),
    
    // Xóa đơn hàng
    delete: (orderId) => api.delete(`/orders/work/${orderId}/`)
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

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

/*
// Đăng ký tài khoản mới
try {
  const userData = {
    username: 'newuser',
    password: 'securepassword',
    email: 'user@example.com',
    phone: '0123456789'
  }
  const response = await AuthAPI.register(userData)
  console.log('Đăng ký thành công:', response.data)
} catch (error) {
  console.error('Lỗi đăng ký:', error.response?.data)
}

// Đăng nhập
try {
  const response = await AuthAPI.login({
    username: 'newuser',
    password: 'securepassword'
  })
  console.log('Đăng nhập thành công')
} catch (error) {
  console.error('Lỗi đăng nhập:', error.response?.data)
}

// Lấy danh sách món ăn
const items = await CatalogAPI.listItems({ search: 'pizza', page: 1 })

// Thêm vào giỏ hàng
await CartAPI.addItem({
  menu_item_id: 1,
  quantity: 2,
  option_ids: [1, 3] // các option được chọn
})

// Checkout
await OrderAPI.checkout({
  payment_method: 'cash',
  note: 'Giao hàng tại cổng chính'
})
*/