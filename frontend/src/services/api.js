import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL
});

// Interceptor to inject Bearer token into all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle global 401 unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on expired or invalid session
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/verify-otp')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resendOtp: (data) => api.post('/auth/resend-otp', data),
  getMe: () => api.get('/auth/me')
};

export const userAPI = {
  getUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`),
  updateWallet: (walletAddress) => api.put('/users/wallet', { walletAddress }),
  updateUserRole: (id, role) => api.put(`/users/${id}/role`, { role })
};

export const fileAPI = {
  uploadFile: (formData, onProgress) => api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
  }),
  getFiles: () => api.get('/files'),
  getSharedFiles: () => api.get('/files/shared'),
  getFileById: (id) => api.get(`/files/${id}`),
  downloadFile: (id) => api.get(`/files/${id}/download`, { responseType: 'blob' }),
  shareFile: (id, data) => api.post(`/files/${id}/share`, data),
  revokeAccess: (id, walletAddress) => api.delete(`/files/${id}/share/${walletAddress}`),
  deleteFile: (id) => api.delete(`/files/${id}`)
};

export const walletAPI = {
  getNonce: (walletAddress) => api.post('/wallet/nonce', { walletAddress }),
  verifySignature: (walletAddress, signature) => api.post('/wallet/verify', { walletAddress, signature })
};

export const activityAPI = {
  getActivityLogs: () => api.get('/activity')
};

export default api;
