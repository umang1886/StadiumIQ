import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('stadiumiq_user') || 'null'),
  token: localStorage.getItem('stadiumiq_token'),
  isAuthenticated: !!localStorage.getItem('stadiumiq_token'),

  login: (user, token) => {
    localStorage.setItem('stadiumiq_token', token)
    localStorage.setItem('stadiumiq_user', JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('stadiumiq_token')
    localStorage.removeItem('stadiumiq_user')
    supabase.auth.signOut()
    set({ user: null, token: null, isAuthenticated: false })
  },

  setUser: (user) => {
    localStorage.setItem('stadiumiq_user', JSON.stringify(user))
    set({ user })
  }
}))
