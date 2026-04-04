import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import './Auth.css'
import { useAuth, type Role } from '../../context/AuthContext'
import { register as apiRegister } from '../../api/auth'

const RegisterPage = () => {
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<Role>('student')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required')
      return
    }

    // Validate phone if provided
    if (phone.trim()) {
      const digits = phone.replace(/\D/g, '')
      if (digits.length !== 10) {
        setError('Phone number must be 10 digits')
        return
      }
    }

    try {
      setLoading(true)
      const result = await apiRegister(
        email.trim(),
        password,
        role,
        name.trim() || undefined,
        phone.trim() || undefined
      )

      // Company/recruiter accounts need admin approval
      if (result.pending) {
        setSuccess(result.message || 'Your account has been submitted for admin approval. You will be notified once approved.')
        return
      }

      // Students and admins get immediate login
      await login(email.trim(), password, role)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-root">
      <div className="auth-card">
        <h2 className="auth-title">Register</h2>
        <p className="auth-subtitle">Create your placement portal account</p>

        {success ? (
          <div className="auth-pending-box">
            <div className="auth-pending-icon">&#9201;</div>
            <h3>Account Submitted</h3>
            <p>{success}</p>
            <Link to="/login" className="auth-button primary" style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none', marginTop: '0.75rem' }}>
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="auth-label">
                Full name
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Student / TPO / Recruiter name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

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
                Phone Number
                <input
                  type="tel"
                  className="auth-input"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={10}
                />
              </label>

              <label className="auth-label">
                Password
                <input
                  type="password"
                  className="auth-input"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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

              {role === 'recruiter' && (
                <p className="auth-info-note">
                  Company/recruiter accounts require admin approval. You will be notified once your account is activated.
                </p>
              )}

              {error && <p className="auth-error">{error}</p>}

              <button type="submit" className="auth-button primary" disabled={loading}>
                {loading ? 'Creating account...' : 'Register'}
              </button>
            </form>

            <p className="auth-footer-text">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default RegisterPage
