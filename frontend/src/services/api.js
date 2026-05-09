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

// Intercepteur pour gérer le rafraîchissement du token
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

// ─── Services pour les paiements mobiles ─────────────────────────────────────
export const paymentService = {
  processMobilePayment: async (paymentData) => {
    const response = await api.post('/payments/mobile', paymentData)
    return response.data
  },
  
  verifyPayment: async (transactionId) => {
    const response = await api.get(`/payments/verify/${transactionId}`)
    return response.data
  }
}

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
  upload: (formData, onProgress) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded * 100) / (e.total || 1)))
      : undefined,
  }),
  myUploads: () => api.get('/documents/my/uploads'),
  getRecommended: (classe, matiere) => 
    api.get(`/documents/recommended`, { params: { classe, matiere, limit: 4 } }),
}

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  me: () => api.get('/users/me'),
  updateProfile: (data) => api.patch('/users/me', data),
  changePassword: (data) => api.patch('/users/me/password', data),
  myDownloads: () => api.get('/users/me/downloads'),
  uploadAvatar: (formData) => api.post('/users/me/avatar', formData, { 
    headers: { 'Content-Type': 'multipart/form-data' } 
  }),
  deleteAvatar: () => api.delete('/users/me/avatar'),
  quota: () => api.get('/users/me/quota'),
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
  getSubscriptions: () => api.get('/admin/subscriptions'),
  getBroadcastStats: () => api.get('/admin/broadcast/stats'),
  createSubscription: (data) => api.post('/admin/subscriptions', data),
  revokeSubscription: (userId) => api.delete(`/admin/subscriptions/${userId}`),
  sendExpiryReminder: (userId) => api.post(`/admin/subscriptions/${userId}/remind`),
  cleanupOrphans: () => api.post('/admin/cleanup-orphans'),
}

// ─── Forum ────────────────────────────────────────────────────────────────────
export const forumApi = {
  getPosts: (params) => api.get('/forum', { params }),
  getPost: (id) => api.get(`/forum/${id}`),
  createPost: (data) => api.post('/forum', data),
  deletePost: (id) => api.delete(`/forum/${id}`),
  likePost: (id) => api.post(`/forum/${id}/like`),
  pinPost: (id, pinned) => api.patch(`/forum/${id}/pin`, { pinned }),
  createReply: (postId, data) => api.post(`/forum/${postId}/replies`, data),
  deleteReply: (replyId) => api.delete(`/forum/replies/${replyId}`),
}

export default api