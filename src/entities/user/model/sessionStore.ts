import { create } from 'zustand'
import { authApi } from '../api/authApi'
import type { LoginRequest, RegisterRequest, User } from './types'

type SessionStatus = 'idle' | 'loading' | 'authenticated' | 'guest'

type SessionState = {
  user: User | null
  status: SessionStatus
  init: () => Promise<void>
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User) => void
  reset: () => void
}

export const useSession = create<SessionState>()((set, get) => ({
  user: null,
  status: 'idle',

  init: async () => {
    if (get().status !== 'idle') return
    set({ status: 'loading' })
    try {
      const user = await authApi.getMe()
      set({ user, status: 'authenticated' })
    } catch {
      set({ user: null, status: 'guest' })
    }
  },

  login: async (data) => {
    const user = await authApi.login(data)
    set({ user, status: 'authenticated' })
  },

  register: async (data) => {
    const user = await authApi.register(data)
    set({ user, status: 'authenticated' })
  },

  logout: async () => {
    try {
      await authApi.logout()
    } finally {
      get().reset()
    }
  },

  setUser: (user) => set({ user }),

  reset: () => set({ user: null, status: 'guest' }),
}))
