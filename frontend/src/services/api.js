// src/services/api.js
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-refresh on 401 TOKEN_EXPIRED
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        isRefreshing = false
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken })
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        api.defaults.headers.Authorization = `Bearer ${data.accessToken}`
        processQueue(null, data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
}

// ─── Documents ────────────────────────────────────────────────────────────────
export const documentsApi = {
  getAll: (params) => api.get('/documents', { params }),
  getById: (id) => api.get(`/documents/${id}`),
  getDownloadUrl: (id) => api.get(`/documents/${id}/download`),
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  myUploads: () => api.get('/documents/my/uploads'),
}

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  me: () => api.get('/users/me'),
  updateProfile: (data) => api.patch('/users/me', data),
  changePassword: (data) => api.patch('/users/me/password', data),
  myDownloads: () => api.get('/users/me/downloads'),
  uploadAvatar: (formData) => api.post('/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteAvatar: () => api.delete('/users/me/avatar'),
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  stats: () => api.get('/admin/stats'),
  getDocuments: (params) => api.get('/admin/documents', { params }),
  updateDocumentStatus: (id, status) => api.patch(`/admin/documents/${id}/status`, { status }),
  deleteDocument: (id) => api.delete(`/admin/documents/${id}`),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.patch('/admin/settings', data),
  broadcast: (data) => api.post('/admin/broadcast', data),
}

export default api