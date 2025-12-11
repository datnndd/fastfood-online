// frontend/src/lib/contentApi.js
import api from './api'

export const ContentAPI = {
    // Pages
    async getPages() {
        const response = await api.get('/content/pages/')
        const data = response.data
        return Array.isArray(data) ? data : data.results || []
    },

    async getPageContent(slug) {
        const response = await api.get(`/content/pages/${slug}/content/`)
        return response.data
    },

    // Content Items
    async getContentItems(pageSlug = null) {
        const params = pageSlug ? { page_slug: pageSlug } : {}
        const response = await api.get('/content/items/', { params })
        const data = response.data
        return Array.isArray(data) ? data : data.results || []
    },

    async createContentItem(data) {
        const response = await api.post('/content/items/', data)
        return response.data
    },

    async updateContentItem(id, data) {
        const response = await api.put(`/content/items/${id}/`, data)
        return response.data
    },

    async deleteContentItem(id) {
        const response = await api.delete(`/content/items/${id}/`)
        return response.data
    },

    // Stores
    async getStores() {
        const response = await api.get('/content/stores/')
        const data = response.data
        return Array.isArray(data) ? data : data.results || []
    },

    async createStore(data) {
        const response = await api.post('/content/stores/', data)
        return response.data
    },

    async updateStore(id, data) {
        const response = await api.put(`/content/stores/${id}/`, data)
        return response.data
    },

    async deleteStore(id) {
        const response = await api.delete(`/content/stores/${id}/`)
        return response.data
    },

    // Image Upload
    async uploadImage(file) {
        const formData = new FormData()
        formData.append('image', file)

        // Don't set Content-Type manually - axios will auto-set it with correct boundary for FormData
        const response = await api.post('/content/upload-image/', formData)
        return response.data
    }
}
