import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth, type Role } from '../../context/AuthContext'
import './Auth.css'

const LoginPage = () => {
  const [searchParams] = useSearchParams()
  const roleFromQuery = searchParams.get('role')
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<Role>(
    roleFromQuery === 'student' || roleFromQuery === 'admin' || roleFromQuery === 'recruiter'
      ? roleFromQuery
      : 'student'
  )

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
        <h2 className="auth-title">Sign in</h2>
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
            <input
              type="password"
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
              <option value="admin">TPO / Admin</option>
              <option value="recruiter">Recruiter</option>
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
