import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('attendance_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authService = {
  async login(credentials) {
    const { data } = await api.post('/auth/login', credentials)
    localStorage.setItem('attendance_token', data.token)
    return data
  },
  me: () => api.get('/auth/me').then((response) => response.data),
  logout: () => api.post('/auth/logout').finally(() => localStorage.removeItem('attendance_token')),
}

export const attendanceService = {
  today: () => api.get('/attendance/today').then((response) => response.data),
  checkIn: (formData) => api.post('/attendance/check-in', formData),
  checkOut: (formData) => api.post('/attendance/check-out', formData),
  history: (params) => api.get('/attendance', { params }).then((response) => response.data),
}

export const dashboardService = {
  overview: () => api.get('/dashboard').then((response) => response.data),
}
