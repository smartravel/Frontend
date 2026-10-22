import { api } from '../../../shared/api'
import type { LoginRequest, RegisterRequest, UpdateProfileRequest, User } from '../model/types'

export const authApi = {
  register: (data: RegisterRequest) => api.post<User>('/auth/register', data),
  login: (data: LoginRequest) => api.post<User>('/auth/login', data),
  logout: () => api.post<{ status: string }>('/auth/logout'),
  getMe: () => api.get<User>('/users/me'),
  updateMe: (data: UpdateProfileRequest) => api.patch<User>('/users/me', data),
}
