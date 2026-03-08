import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { resetPassword as resetPasswordApi } from '../../api/auth'
import './Auth.css'

const ResetPasswordPage = () => {
  const { token = '' } = useParams()
  const navigate = useNavigate()
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

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      setLoading(true)
      const result = await resetPasswordApi(token, password)
      setSuccess(result.message || 'Password reset successful. You can now sign in.')
      setTimeout(() => navigate('/login'), 1500)
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
            <input
              type="password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <label className="auth-label">
            Confirm Password
            <input
              type="password"
              className="auth-input"
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
