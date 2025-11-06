import axios from 'axios'
import { subscribeToSession, getCurrentSession } from './supabaseClient'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'
})

let accessToken = null

const uploadImage = (url, file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const setApiAccessToken = (token) => {
  accessToken = token || null
}

const syncAccessToken = (session) => {
  setApiAccessToken(session?.access_token)
}

syncAccessToken(getCurrentSession())
subscribeToSession(syncAccessToken)

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// =============================================================================
// AUTH APIs
// =============================================================================
export const AuthAPI = {
  register: async (userData, { dryRun = false } = {}) => {
    const url = dryRun ? '/accounts/register/?dry_run=1' : '/accounts/register/'
    return api.post(url, userData)
  },
  profile: () => api.get('/accounts/me/'),
  getEmailForUsername: (username) => {
    return api.post('/accounts/get-email/', { username })
  },
  setPassword: (password) => {
    return api.post('/accounts/set-password/', { password })
  }
}

// =============================================================================
// ACCOUNTS APIs (cho admin/manager)
// =============================================================================
export const AccountsAPI = {
  listUsers: (params = {}) => api.get('/accounts/users/', { params }),
  createStaff: (userData) => api.post('/accounts/staff/create/', userData),
  updateUserRole: (userId, role) => api.put(`/accounts/users/${userId}/role/`, { role }),
  patchUserRole: (userId, role) => api.patch(`/accounts/users/${userId}/role/`, { role }),
  listProvinces: () => api.get('/accounts/locations/provinces/'),
  listDistricts: (provinceId) =>
    api.get('/accounts/locations/districts/', {
      params: provinceId ? { province_id: provinceId } : {}
    }),
  listWards: (provinceId) =>
    api.get('/accounts/locations/wards/', {
      params: provinceId ? { province_id: provinceId } : {}
    }),
  addresses: {
    list: () => api.get('/accounts/addresses/'),
    create: (data) => api.post('/accounts/addresses/', data),
    update: (id, data) => api.put(`/accounts/addresses/${id}/`, data),
    patch: (id, data) => api.patch(`/accounts/addresses/${id}/`, data),
    remove: (id) => api.delete(`/accounts/addresses/${id}/`)
  }
}

// =============================================================================
// CATALOG APIs
// =============================================================================
export const CatalogAPI = {
  listCategories: (params = {}) => api.get('/catalog/categories/', { params }),
  getCategory: (id) => api.get(`/catalog/categories/${id}/`),
  createCategory: (data) => api.post('/catalog/categories/', data),
  updateCategory: (id, data) => api.put(`/catalog/categories/${id}/`, data),
  patchCategory: (id, data) => api.patch(`/catalog/categories/${id}/`, data),
  uploadCategoryImage: (id, file) => uploadImage(`/catalog/categories/${id}/upload-image/`, file),
  deleteCategory: (id) => api.delete(`/catalog/categories/${id}/`),
  listItems: (params = {}) => api.get('/catalog/items/', { params }),
  getItem: (id) => api.get(`/catalog/items/${id}/`),
  createItem: (data) => api.post('/catalog/items/', data),
  updateItem: (id, data) => api.put(`/catalog/items/${id}/`, data),
  patchItem: (id, data) => api.patch(`/catalog/items/${id}/`, data),
  uploadItemImage: (id, file) => uploadImage(`/catalog/items/${id}/upload-image/`, file),
  deleteItem: (id) => api.delete(`/catalog/items/${id}/`),
  listCombos: (params = {}) => api.get('/catalog/combos/', { params }),
  getCombo: (id) => api.get(`/catalog/combos/${id}/`),
  createCombo: (data) => api.post('/catalog/combos/', data),
  updateCombo: (id, data) => api.put(`/catalog/combos/${id}/`, data),
  patchCombo: (id, data) => api.patch(`/catalog/combos/${id}/`, data),
  uploadComboImage: (id, file) => uploadImage(`/catalog/combos/${id}/upload-image/`, file),
  deleteCombo: (id) => api.delete(`/catalog/combos/${id}/`)
}

// =============================================================================
// CART APIs
// =============================================================================
export const CartAPI = {
  getCart: () => api.get('/cart/'),
  addItem: ({ menu_item_id, quantity = 1, option_ids = [] }) =>
    api.post('/cart/items/', {
      menu_item_id,
      quantity,
      option_ids
    }),
  updateItem: (itemId, { menu_item_id, quantity, option_ids }) =>
    api.put(`/cart/items/${itemId}/`, {
      menu_item_id,
      quantity,
      option_ids
    }),
  patchItem: (itemId, data) => api.patch(`/cart/items/${itemId}/`, data),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}/`),
  addCombo: ({ combo_id, quantity = 1, note = '' }) =>
    api.post('/cart/combos/', {
      combo_id,
      quantity,
      note
    }),
  updateCombo: (comboId, { combo_id, quantity, note }) =>
    api.put(`/cart/combos/${comboId}/`, {
      combo_id,
      quantity,
      note
    }),
  patchCombo: (comboId, data) => api.patch(`/cart/combos/${comboId}/`, data),
  removeCombo: (comboId) => api.delete(`/cart/combos/${comboId}/`),
  clear: () => api.delete('/cart/clear/')
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
      return api.get(`/orders/work/?${searchParams.toString()}`)
    },
    updateStatus: (orderId, newStatus) =>
      api.patch(`/orders/work/${orderId}/update_status/`, {
        status: newStatus
      }),
    getStats: (date = null) => {
      const params = date ? `?date=${date}` : ''
      return api.get(`/orders/admin/stats/${params}`)
    }
  },
  my: {
    list: async (page = 1, status = null) => {
      const searchParams = new URLSearchParams()
      if (page) searchParams.append('page', page.toString())
      if (status) searchParams.append('status', status)
      return api.get(`/orders/my/?${searchParams.toString()}`)
    },
    cancel: (orderId) => api.patch(`/orders/my/${orderId}/cancel/`)
  },
  checkout: (data) => api.post('/orders/checkout/', data),

  // Statistics APIs
  stats: {
    getRevenue: (params) => api.get('/orders/stats/revenue/', { params }),
    getOrderStats: (params) => api.get('/orders/stats/orders/', { params }),
    getTopItems: (params) => api.get('/orders/stats/top-items/', { params }),
    getTopCombos: (params) => api.get('/orders/stats/top-combos/', { params }),
    exportReport: (params, format = 'pdf') =>
      api.get(`/orders/stats/export/${format}/`, {
        params,
        responseType: 'blob'
      })
  }
}

export default api
