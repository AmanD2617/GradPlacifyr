import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as apiLogin, logout as apiLogout, type User as ApiUser, type Role } from '../api/auth'
import { apiFetch } from '../api/client'

export type { Role }

interface User {
  id: string
  email: string
  name: string
  role: Role
  profileImage?: string | null
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, role: Role) => Promise<void>
  logout: () => void
  updateProfileImage: (imageUrl: string | null) => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const routes: Record<Role, string> = {
  student: '/student/dashboard',
  admin: '/admin/dashboard',
  recruiter: '/company/dashboard',
  hod: '/tpo/dashboard',
  tpo: '/tpo/dashboard',
}

function toUser(u: ApiUser): User {
  return {
    id: String(u.id),
    email: u.email,
    name: u.name || u.email.split('@')[0],
    role: u.role,
    profileImage: u.profileImage || null,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize from cached user metadata for fast display (non-sensitive — no token stored)
  const [user, setUser] = useState<User | null>(() => {
    // Only non-sensitive user metadata (id, name, email, role) is kept in
    // localStorage for UI state persistence. The JWT is stored exclusively
    // in an HttpOnly cookie managed by the backend — never in localStorage.
    const stored = localStorage.getItem('placement_user')
    return stored ? JSON.parse(stored) : null
  })

  const navigate = useNavigate()

  // On mount, verify the session cookie is still valid via /api/auth/me
  useEffect(() => {
    apiFetch<ApiUser>('/auth/me')
      .then((apiUser) => {
        const u = toUser(apiUser)
        setUser(u)
        localStorage.setItem('placement_user', JSON.stringify(u))
      })
      .catch(() => {
        // Cookie expired or absent — clear stale user cache
        setUser(null)
        localStorage.removeItem('placement_user')
      })
  }, [])

  const login = useCallback(
    async (email: string, password: string, selectedRole: Role): Promise<void> => {
      const res = await apiLogin(email, password, selectedRole)
      const u = toUser(res.user)
      setUser(u)
      // Store only non-sensitive display data — NOT the token
      localStorage.setItem('placement_user', JSON.stringify(u))
      // The HttpOnly cookie is set automatically by the backend's Set-Cookie header
      window.dispatchEvent(new CustomEvent('placement:login', { detail: { role: u.role } }))
      navigate(routes[u.role], { replace: true })
    },
    [navigate]
  )

  const logout = useCallback(async () => {
    // Call backend logout to clear the HttpOnly cookie server-side
    try {
      await apiLogout()
    } catch {
      // Continue with client-side cleanup even if the request fails
    }
    setUser(null)
    localStorage.removeItem('placement_user')
    navigate('/', { replace: true })
  }, [navigate])

  const updateProfileImage = useCallback((imageUrl: string | null) => {
    setUser((prev) => {
      if (!prev) return prev
      const updated = { ...prev, profileImage: imageUrl }
      localStorage.setItem('placement_user', JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateProfileImage,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
