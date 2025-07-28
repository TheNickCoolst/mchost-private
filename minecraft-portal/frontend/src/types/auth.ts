export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'moderator' | 'user'
  isActive: boolean
  createdAt: string
  memoryLimitMB: number
  cpuCores: number
  diskLimitMB: number
  maxServers: number
}

export interface LoginRequest {
  emailOrUsername: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface RefreshRequest {
  refreshToken: string
}

export interface RefreshResponse {
  accessToken: string
  refreshToken: string
}