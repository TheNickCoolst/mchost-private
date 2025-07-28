import axios, { AxiosError } from 'axios'
import { User, LoginRequest, RegisterRequest, AuthResponse, RefreshRequest, RefreshResponse } from '../types/auth'
import { ServerInstance, CreateServerRequest, UpdateServerRequest, ServerActionRequest, LogEntry } from '../types/server'

// Backend runs on port 3000, frontend on 3001
const API_BASE_URL = 'http://31.220.85.204:3000'

// Helper function for exponential backoff retry
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Debouncing utility for API calls
const debounceMap = new Map<string, NodeJS.Timeout>()

const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  key: string
): T => {
  return ((...args: any[]) => {
    return new Promise((resolve, reject) => {
      // Clear existing timeout for this key
      if (debounceMap.has(key)) {
        clearTimeout(debounceMap.get(key)!)
      }

      // Set new timeout
      const timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args)
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          debounceMap.delete(key)
        }
      }, delay)

      debounceMap.set(key, timeoutId)
    })
  }) as T
}

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000, // Increased timeout to 30 seconds
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any

    // Handle 401 unauthorized errors (token refresh)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken
          })
          
          const { accessToken, refreshToken: newRefreshToken } = response.data
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', newRefreshToken)
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
    }

    // Handle rate limiting (429) and server errors (5xx) with retry
    if ((error.response?.status === 429 || (error.response?.status && error.response.status >= 500 && error.response.status < 600)) && !originalRequest._retryCount) {
      originalRequest._retryCount = 0
    }

    if (originalRequest._retryCount !== undefined && originalRequest._retryCount < 3) {
      originalRequest._retryCount++
      const delay = Math.min(1000 * Math.pow(2, originalRequest._retryCount), 10000) // Max 10 seconds
      
      console.log(`Retrying request (attempt ${originalRequest._retryCount}) after ${delay}ms...`)
      await sleep(delay)
      
      return api(originalRequest)
    }

    return Promise.reject(error)
  }
)

export const authApi = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterRequest) => api.post<AuthResponse>('/auth/register', data),
  refresh: (data: RefreshRequest) => api.post<RefreshResponse>('/auth/refresh', data),
  getCurrentUser: () => api.get<User>('/users/me'),
}

export const serverApi = {
  getServers: debounce(() => api.get<ServerInstance[]>('/servers'), 300, 'getServers'),
  getServer: (id: string) => debounce(() => api.get<ServerInstance>(`/servers/${id}`), 300, `getServer-${id}`)(),
  createServer: (data: CreateServerRequest) => api.post<ServerInstance>('/servers', data),
  updateServer: (id: string, data: UpdateServerRequest) => api.put<ServerInstance>(`/servers/${id}`, data),
  deleteServer: (id: string) => api.delete(`/servers/${id}`),
  performAction: (id: string, data: ServerActionRequest) => api.post(`/servers/${id}/action`, data),
  getLogs: (id: string, limit?: number) => debounce(() => api.get<LogEntry[]>(`/servers/${id}/logs?limit=${limit || 100}`), 500, `getLogs-${id}`)(),
  getConsole: (id: string) => debounce(() => api.get<string[]>(`/servers/${id}/console`), 500, `getConsole-${id}`)(),
  getServerProperties: (id: string) => api.get(`/servers/${id}/properties`),
  updateServerProperties: (id: string, properties: any) => api.put(`/servers/${id}/properties`, properties),
}

export const userApi = {
  getUsers: debounce(() => api.get<User[]>('/users'), 300, 'getUsers'),
  getUser: (id: string) => debounce(() => api.get<User>(`/users/${id}`), 300, `getUser-${id}`)(),
  createUser: (data: any) => api.post<User>('/users', data),
  updateUser: (id: string, data: Partial<User>) => api.put<User>(`/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
}

export default api