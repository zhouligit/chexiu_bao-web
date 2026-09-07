import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoginResult, UserInfo } from '@/types/api'
import { api, unwrap } from '@/services/api'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: UserInfo | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      login: async (username, password) => {
        const response = await api.post('/api/v1/auth/login', { username, password })
        const data = unwrap<LoginResult>(response)
        set({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          user: data.user,
        })
      },

      logout: () => {
        set({ accessToken: null, refreshToken: null, user: null })
      },

      fetchMe: async () => {
        const response = await api.get('/api/v1/auth/me')
        const user = unwrap<UserInfo>(response)
        set({ user })
      },
    }),
    {
      name: 'chexiu-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
)

export function isAuthenticated() {
  return Boolean(useAuthStore.getState().accessToken)
}
