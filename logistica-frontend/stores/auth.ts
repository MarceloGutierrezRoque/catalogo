import { create } from "zustand"
import api from "@/lib/axios"

interface UserInfo {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_superuser: boolean
  is_staff: boolean
  permissions: string[]
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  user: UserInfo | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  initialize: () => void
  can: (permission: string) => boolean
  updateProfile: (data: Partial<UserInfo>) => void
}

const USER_STORAGE_KEY = "auth_user"

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  user: null,

  can: (permission: string) => {
    const user = get().user
    if (!user) return false
    if (user.is_superuser) return true
    return user.permissions.includes(permission)
  },

  login: async (username, password) => {
    const { data } = await api.post("/auth/login/", { username, password })
    localStorage.setItem("access_token", data.access)
    localStorage.setItem("refresh_token", data.refresh)
    const user = data.user as UserInfo
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    set({ accessToken: data.access, refreshToken: data.refresh, isAuthenticated: true, user })
  },

  updateProfile: (data: Partial<UserInfo>) => {
    const current = get().user
    if (!current) return
    const updated = { ...current, ...data }
    set({ user: updated })
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated))
  },

  logout: () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem(USER_STORAGE_KEY)
    set({ accessToken: null, refreshToken: null, isAuthenticated: false, user: null })
  },

  initialize: () => {
    const accessToken = localStorage.getItem("access_token")
    const refreshToken = localStorage.getItem("refresh_token")
    const storedUser = localStorage.getItem(USER_STORAGE_KEY)
    let user: UserInfo | null = null
    if (storedUser) {
      try {
        user = JSON.parse(storedUser)
      } catch {
        user = null
      }
    }
    if (!user && accessToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split(".")[1]))
        user = {
          id: payload.user_id ?? 0,
          username: payload.username ?? "Usuario",
          email: payload.email ?? "",
          first_name: payload.first_name ?? "",
          last_name: payload.last_name ?? "",
          is_superuser: payload.is_superuser ?? false,
          is_staff: payload.is_staff ?? false,
          permissions: [],
        }
      } catch {
        user = { id: 0, username: "Usuario", email: "", first_name: "", last_name: "", is_superuser: false, is_staff: false, permissions: [] }
      }
    }
    if (accessToken) {
      set({ accessToken, refreshToken, isAuthenticated: true, user })
    }
  },
}))
