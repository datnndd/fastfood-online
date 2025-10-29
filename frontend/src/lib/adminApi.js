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
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                window.location.href = '/login'
            }
            return Promise.reject(error)
        }
    )

    return instance
}

const api = createApiInstance()

export const AdminAPI = {
    // Dashboard Stats
    dashboard: {
        getStats: () => api.get('/admin/dashboard/stats/'),
        getRecentOrders: (limit = 5) => api.get(`/orders/?limit=${limit}&ordering=-created_at`),
    },

    // Menu Items (Products) - Cập nhật đúng endpoint
    menuItems: {
        list: (params = {}) => api.get('/catalog/items/', { params }),
        get: (id) => api.get(`/catalog/items/${id}/`),
        create: (data) => {
            const formData = new FormData()
            Object.keys(data).forEach(key => {
                if (data[key] !== null && data[key] !== undefined) {
                    formData.append(key, data[key])
                }
            })
            return api.post('/catalog/items/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
        },
        update: (id, data) => {
            const formData = new FormData()
            Object.keys(data).forEach(key => {
                if (data[key] !== null && data[key] !== undefined) {
                    formData.append(key, data[key])
                }
            })
            return api.patch(`/catalog/items/${id}/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
        },
        delete: (id) => api.delete(`/catalog/items/${id}/`),
    },

    // Categories - Cập nhật đúng endpoint
    categories: {
        list: () => api.get('/catalog/categories/'),
        create: (data) => api.post('/catalog/categories/', data),
        update: (id, data) => api.patch(`/catalog/categories/${id}/`, data),
        delete: (id) => api.delete(`/catalog/categories/${id}/`),
    },

    // Combos - Cập nhật đúng endpoint
    combos: {
        list: (params = {}) => api.get('/catalog/combos/', { params }),
        get: (id) => api.get(`/catalog/combos/${id}/`),
        create: (data) => api.post('/catalog/combos/', data),
        update: (id, data) => api.patch(`/catalog/combos/${id}/`, data),
        delete: (id) => api.delete(`/catalog/combos/${id}/`),
    },

    // Orders Management
    orders: {
        list: (params = {}) => api.get('/orders/', { params }),
        get: (id) => api.get(`/orders/${id}/`),
        updateStatus: (id, status) => api.patch(`/orders/${id}/`, { status }),
    },

    // Users Management
    users: {
        list: (params = {}) => api.get('/admin/users/', { params }),
        get: (id) => api.get(`/admin/users/${id}/`),
        update: (id, data) => api.patch(`/admin/users/${id}/`, data),
    },
}
