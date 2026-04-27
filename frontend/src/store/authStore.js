import { create } from 'zustand'
import { jwtDecode } from 'jwt-decode'

const TOKEN_KEY = 'evenzo_token'

function loadFromStorage() {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return { token: null, user: null }
    const decoded = jwtDecode(token)
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem(TOKEN_KEY)
      return { token: null, user: null }
    }
    return { token, user: decoded }
  } catch {
    return { token: null, user: null }
  }
}

const { token: initToken, user: initUser } = loadFromStorage()

export const useAuthStore = create((set) => ({
  token: initToken,
  user:  initUser,

  setAuth: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token)
    set({ token, user })
  },

  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY)
    set({ token: null, user: null })
  },
}))
