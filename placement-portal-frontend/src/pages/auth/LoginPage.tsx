import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth, type Role } from '../../context/AuthContext'
import { PasswordInput } from '../../components/ui/PasswordInput'
import './Auth.css'

// Allowed roles for the dropdown (kept in sync with the Role type in ../../api/auth)
const VALID_ROLES = ['student', 'recruiter', 'tpo', 'admin'] as const
type LoginRole = (typeof VALID_ROLES)[number]

const ROLE_LABELS: Record<LoginRole, string> = {
  student: 'Student',
  recruiter: 'Company / Recruiter',
  tpo: 'TPO',
  admin: 'Admin',
}

const parseRoleParam = (raw: string | null): LoginRole => {
  if (!raw) return 'student'
  const normalized = raw.toLowerCase() as LoginRole
  // Accept a few friendly aliases, e.g. "company" → "recruiter"
  if ((normalized as string) === 'company') return 'recruiter'
  return (VALID_ROLES as readonly string[]).includes(normalized) ? normalized : 'student'
}

const LoginPage = () => {
  const { login } = useAuth()
  const [searchParams] = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // Initialise role from the ?role= URL param so the dropdown reflects the user's choice
  const [role, setRole] = useState<Role>(() => parseRoleParam(searchParams.get('role')))

  // Keep the dropdown in sync if the URL changes after mount (e.g. browser back/forward)
  useEffect(() => {
    const next = parseRoleParam(searchParams.get('role'))
    setRole((prev) => (prev === next ? prev : next))
  }, [searchParams])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim()) return
    try {
      setLoading(true)
      await login(email.trim(), password, role)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-root">
      <div className="auth-card">
        <div className="auth-title-row">
          <h2 className="auth-title">Sign in</h2>
          <span className={`auth-role-badge auth-role-badge--${role}`}>
            {ROLE_LABELS[role as LoginRole] ?? 'Student'}
          </span>
        </div>
        <p className="auth-subtitle">Access your placement dashboard</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">
            Email
            <input
              type="email"
              className="auth-input"
              placeholder="you@jims.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="auth-label">
            Password
            <PasswordInput
              className="auth-input"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <label className="auth-label">
            Role
            <select
              className="auth-input"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              <option value="student">Student</option>
              <option value="recruiter">Recruiter</option>
              <option value="tpo">TPO</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-button primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer-text">
          New user? <Link to="/register">Create an account</Link>
        </p>
        <p className="auth-footer-text auth-footer-forgot">
          <Link to="/forgot-password">Forgot Password?</Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
