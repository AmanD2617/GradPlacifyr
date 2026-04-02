import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as apiLogin, type User as ApiUser, type Role } from '../api/auth'

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
  hod: '/admin/dashboard',
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
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('placement_user')
    return stored ? JSON.parse(stored) : null
  })

  const navigate = useNavigate()

  const login = useCallback(
    async (email: string, password: string, selectedRole: Role): Promise<void> => {
      const res = await apiLogin(email, password, selectedRole)
      const u = toUser(res.user)
      setUser(u)
      localStorage.setItem('placement_user', JSON.stringify(u))
      localStorage.setItem('placement_token', res.token)
      navigate(routes[u.role], { replace: true })
    },
    [navigate]
  )

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('placement_user')
    localStorage.removeItem('placement_token')
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
