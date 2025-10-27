// api.js
import axios from 'axios'
import { subscribeToSession, getCurrentSession } from './supabaseClient'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:8000/api',
  timeout: 20000,
  withCredentials: false,
})

let accessToken = null

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
  config.headers['X-Client'] = 'web'
  return config
})

// Small helper
const toFormData = (obj = {}) => {
  const fd = new FormData()
  Object.entries(obj).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach((item) => fd.append(k, item))
    else if (v !== undefined && v !== null) fd.append(k, v)
  })
  return fd
}

// =============================================================================
// AUTH APIs
// =============================================================================
export const AuthAPI = {
  register: async (userData, { dryRun = false } = {}) => {
    const url = dryRun ? '/accounts/register/?dry_run=1' : '/accounts/register/'
    return api.post(url, userData)
  },
  profile: () => api.get('/accounts/me/'),
}

// =============================================================================
// ACCOUNTS APIs (admin/manager)
// =============================================================================
export const AccountsAPI = {
  createStaff: (userData) => api.post('/accounts/staff/create/', userData),
  updateUserRole: (userId, role) => api.put(`/accounts/users/${userId}/role/`, { role }),
  patchUserRole: (userId, role) => api.patch(`/accounts/users/${userId}/role/`, { role }),

  listProvinces: () => api.get('/accounts/locations/provinces/'),
  listDistricts: (provinceId) =>
    api.get('/accounts/locations/districts/', {
      params: provinceId ? { province_id: provinceId } : {},
    }),
  listWards: (provinceId) =>
    api.get('/accounts/locations/wards/', {
      params: provinceId ? { province_id: provinceId } : {},
    }),

  addresses: {
    list: () => api.get('/accounts/addresses/'),
    create: (data) => api.post('/accounts/addresses/', data),
    update: (id, data) => api.put(`/accounts/addresses/${id}/`, data),
    patch: (id, data) => api.patch(`/accounts/addresses/${id}/`, data),
    remove: (id) => api.delete(`/accounts/addresses/${id}/`),
  },
}

// =============================================================================
// CATALOG APIs
// - Bổ sung upload ảnh: /catalog/{type}/{id}/upload-image/ (backend sẽ upload lên Supabase)
// - listCombos hỗ trợ ?available=true để chỉ lấy combo đang mở bán
// =============================================================================
export const CatalogAPI = {
  // Category
  listCategories: (params = {}) => api.get('/catalog/categories/', { params }),
  getCategory: (id) => api.get(`/catalog/categories/${id}/`),
  createCategory: (data) => api.post('/catalog/categories/', data),
  updateCategory: (id, data) => api.put(`/catalog/categories/${id}/`, data),
  patchCategory: (id, data) => api.patch(`/catalog/categories/${id}/`, data),
  deleteCategory: (id) => api.delete(`/catalog/categories/${id}/`),

  // Upload ảnh Category -> backend action "upload-image"
  uploadCategoryImage: (id, file) => {
    const fd = toFormData({ file })
    return api.post(`/catalog/categories/${id}/upload-image/`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // MenuItem
  listItems: (params = {}) => api.get('/catalog/items/', { params }),
  getItem: (id) => api.get(`/catalog/items/${id}/`),
  createItem: (data) => api.post('/catalog/items/', data),
  updateItem: (id, data) => api.put(`/catalog/items/${id}/`, data),
  patchItem: (id, data) => api.patch(`/catalog/items/${id}/`, data),
  deleteItem: (id) => api.delete(`/catalog/items/${id}/`),

  // Upload ảnh MenuItem
  uploadItemImage: (id, file) => {
    const fd = toFormData({ file })
    return api.post(`/catalog/items/${id}/upload-image/`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // Combo
  listCombos: (params = {}) => api.get('/catalog/combos/', { params }), // params may include { available: true }
  getCombo: (id) => api.get(`/catalog/combos/${id}/`),

  // Upload ảnh Combo
  uploadComboImage: (id, file) => {
    const fd = toFormData({ file })
    return api.post(`/catalog/combos/${id}/upload-image/`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

// =============================================================================
/* CART APIs */
// =============================================================================
export const CartAPI = {
  getCart: () => api.get('/cart/'),
  addItem: ({ menu_item_id, quantity = 1, option_ids = [] }) =>
    api.post('/cart/items/', { menu_item_id, quantity, option_ids }),
  updateItem: (itemId, { menu_item_id, quantity, option_ids }) =>
    api.put(`/cart/items/${itemId}/`, { menu_item_id, quantity, option_ids }),
  patchItem: (itemId, data) => api.patch(`/cart/items/${itemId}/`, data),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}/`),

  addCombo: ({ combo_id, quantity = 1, note = '' }) =>
    api.post('/cart/combos/', { combo_id, quantity, note }),
  updateCombo: (comboId, { combo_id, quantity, note }) =>
    api.put(`/cart/combos/${comboId}/`, { combo_id, quantity, note }),
  patchCombo: (comboId, data) => api.patch(`/cart/combos/${comboId}/`, data),
  removeCombo: (comboId) => api.delete(`/cart/combos/${comboId}/`),

  clear: () => api.delete('/cart/clear/'),
}

// =============================================================================
// ORDERS APIs
// =============================================================================
export const OrderAPI = {
  work: {
    list: async (params = {}) => {
      const sp = new URLSearchParams()
      if (params.status) sp.append('status', params.status)
      if (params.page) sp.append('page', String(params.page))
      if (params.limit) sp.append('limit', String(params.limit))
      if (params.date) sp.append('date', params.date)
      if (params.ordering) sp.append('ordering', params.ordering)
      return api.get(`/orders/work/?${sp.toString()}`)
    },
    updateStatus: (orderId, newStatus) =>
      api.patch(`/orders/work/${orderId}/update_status/`, { status: newStatus }),
    getStats: (date = null) => {
      const params = date ? `?date=${date}` : ''
      return api.get(`/orders/admin/stats/${params}`)
    },
  },
  my: {
    list: async (page = 1, status = null) => {
      const sp = new URLSearchParams()
      if (page) sp.append('page', String(page))
      if (status) sp.append('status', status)
      return api.get(`/orders/my/?${sp.toString()}`)
    },
    cancel: (orderId) => api.patch(`/orders/my/${orderId}/cancel/`),
  },
  checkout: (data) => api.post('/orders/checkout/', data),
}

export default api
