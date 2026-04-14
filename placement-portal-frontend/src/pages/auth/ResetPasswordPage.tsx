import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { resetPassword as resetPasswordApi } from '../../api/auth'
import { PasswordInput } from '../../components/ui/PasswordInput'
import './Auth.css'

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,}$/

const ResetPasswordPage = () => {
  const { token = '' } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    // Remove the token from browser history so it isn't retained in the URL bar
    window.history.replaceState(null, '', '/reset-password')
  }, [])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!password.trim()) {
      setError('Please enter a new password')
      return
    }

    if (!STRONG_PASSWORD_REGEX.test(password)) {
      setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      setLoading(true)
      const result = await resetPasswordApi(token, password)
      setSuccess(result.message || 'Password reset successful. You can now sign in.')
      setTimeout(() => navigate('/login', { replace: true }), 1500)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid or expired reset token'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-root">
      <div className="auth-card">
        <h2 className="auth-title">Reset Password</h2>
        <p className="auth-subtitle">Set your new password to continue.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">
            New Password
            <PasswordInput
              className="auth-input"
              placeholder="Min 8 chars, Aa1@"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <label className="auth-label">
            Confirm Password
            <PasswordInput
              className="auth-input"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </label>

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <button type="submit" className="auth-button primary" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className="auth-footer-text">
          Back to <Link to="/login">sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default ResetPasswordPage
