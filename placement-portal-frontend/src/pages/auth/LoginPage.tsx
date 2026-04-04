import { useState, useCallback, type FormEvent } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth, type Role } from '../../context/AuthContext'
import {
  googleAuth as apiGoogleAuth,
  completeGoogleRegistration,
  sendOtp as apiSendOtp,
  verifyOtp as apiVerifyOtp,
  type GoogleAuthResponse,
} from '../../api/auth'
import './Auth.css'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

interface GoogleUser {
  googleId: string
  email: string
  name: string
}

const LoginPage = () => {
  const [searchParams] = useSearchParams()
  const roleFromQuery = searchParams.get('role')
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<Role>(
    roleFromQuery === 'student' || roleFromQuery === 'admin' || roleFromQuery === 'recruiter'
      ? roleFromQuery
      : 'student'
  )

  // OTP modal state
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpEmail, setOtpEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [otpPhone, setOtpPhone] = useState('')
  const [googleUserInfo, setGoogleUserInfo] = useState<GoogleUser | null>(null)

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

  // ═══════════ Google Sign-In ═══════════

  const handleGoogleResponse = useCallback(
    async (credentialResponse: { credential?: string }) => {
      setError(null)
      if (!credentialResponse.credential) {
        setError('Google sign-in failed. No credential received.')
        return
      }

      try {
        setLoading(true)

        // Send raw credential to backend for secure server-side verification
        const result: GoogleAuthResponse = await apiGoogleAuth(credentialResponse.credential)

        if (result.exists && result.token && result.user) {
          // Existing user — log in directly
          localStorage.setItem('placement_token', result.token)
          localStorage.setItem(
            'placement_user',
            JSON.stringify({
              id: String(result.user.id),
              email: result.user.email,
              name: result.user.name,
              role: result.user.role,
              profileImage: result.user.profileImage || null,
            })
          )
          navigate('/student/dashboard', { replace: true })
          window.location.reload()
        } else {
          // New user — need OTP verification + phone
          setGoogleUserInfo({
            googleId: result.googleId || '',
            email: result.email || '',
            name: result.name || '',
          })
          setOtpEmail(result.email || '')
          setShowOtpModal(true)
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Google auth failed'
        setError(message)
      } finally {
        setLoading(false)
      }
    },
    [navigate]
  )

  const handleGoogleClick = () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Sign-In is not available right now. Please use email/password login.')
      return
    }

    // Use Google Identity Services
    const google = (window as any).google
    if (!google?.accounts?.id) {
      setError('Google Sign-In is loading. Please try again in a moment.')
      return
    }

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
    })
    google.accounts.id.prompt((notification: any) => {
      // If One Tap is suppressed (e.g. user dismissed it before), fall back to button flow
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        google.accounts.id.renderButton(
          document.getElementById('google-signin-fallback'),
          { theme: 'outline', size: 'large', width: '100%' }
        )
        const fallbackBtn = document.getElementById('google-signin-fallback')
        if (fallbackBtn) fallbackBtn.querySelector('div[role="button"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      }
    })
  }

  // ═══════════ OTP Flow ═══════════

  const handleSendOtp = async () => {
    setOtpError(null)
    try {
      setOtpSending(true)
      await apiSendOtp(otpEmail)
      setOtpSent(true)
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setOtpSending(false)
    }
  }

  const handleVerifyAndComplete = async () => {
    setOtpError(null)
    if (!otpCode.trim()) {
      setOtpError('Please enter the OTP code')
      return
    }

    try {
      setOtpVerifying(true)

      // Verify OTP
      await apiVerifyOtp(otpEmail, otpCode.trim())

      // Complete registration
      if (!googleUserInfo) {
        setOtpError('Missing Google user info')
        return
      }

      const result = await completeGoogleRegistration(
        googleUserInfo.googleId,
        googleUserInfo.email,
        googleUserInfo.name,
        otpPhone.trim() || undefined
      )

      // Log in with the new account
      localStorage.setItem('placement_token', result.token)
      localStorage.setItem(
        'placement_user',
        JSON.stringify({
          id: String(result.user.id),
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          profileImage: result.user.profileImage || null,
        })
      )
      setShowOtpModal(false)
      navigate('/student/dashboard', { replace: true })
      window.location.reload()
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setOtpVerifying(false)
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

        {/* Google Sign-In — only for students */}
        {role === 'student' && (
          <>
            <div className="auth-divider">
              <span>or</span>
            </div>
            <button
              type="button"
              className="auth-google-btn"
              onClick={handleGoogleClick}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.1 24.1 0 0 0 0 21.56l7.98-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>
            <div id="google-signin-fallback" style={{ display: 'none' }}></div>
          </>
        )}

        <p className="auth-footer-text">
          New user? <Link to="/register">Create an account</Link>
        </p>
        <p className="auth-footer-text auth-footer-forgot">
          <Link to="/forgot-password">Forgot Password?</Link>
        </p>
      </div>

      {/* ═══════════ OTP Verification Modal ═══════════ */}
      {showOtpModal && (
        <div className="otp-modal-overlay" onClick={() => setShowOtpModal(false)}>
          <div className="otp-modal" onClick={(e) => e.stopPropagation()}>
            <button className="otp-modal-close" onClick={() => setShowOtpModal(false)}>
              &times;
            </button>
            <h2 className="otp-modal-title">Verify Your Email</h2>
            <p className="otp-modal-subtitle">
              We need to verify <strong>{otpEmail}</strong> before creating your account.
            </p>

            {!otpSent ? (
              <>
                <label className="auth-label">
                  Phone Number (optional)
                  <input
                    type="tel"
                    className="auth-input"
                    placeholder="10-digit mobile number"
                    value={otpPhone}
                    onChange={(e) => setOtpPhone(e.target.value)}
                    maxLength={10}
                  />
                </label>
                <button
                  className="auth-button primary"
                  style={{ width: '100%', marginTop: '0.75rem' }}
                  onClick={handleSendOtp}
                  disabled={otpSending}
                >
                  {otpSending ? 'Sending OTP...' : 'Send OTP to Email'}
                </button>
              </>
            ) : (
              <>
                <label className="auth-label">
                  Enter 6-digit OTP
                  <input
                    type="text"
                    className="auth-input otp-code-input"
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    autoFocus
                  />
                </label>
                <button
                  className="auth-button primary"
                  style={{ width: '100%', marginTop: '0.75rem' }}
                  onClick={handleVerifyAndComplete}
                  disabled={otpVerifying}
                >
                  {otpVerifying ? 'Verifying...' : 'Verify & Create Account'}
                </button>
                <button
                  className="auth-button otp-resend-btn"
                  style={{ width: '100%', marginTop: '0.5rem' }}
                  onClick={handleSendOtp}
                  disabled={otpSending}
                >
                  {otpSending ? 'Resending...' : 'Resend OTP'}
                </button>
              </>
            )}

            {otpError && <p className="auth-error">{otpError}</p>}
          </div>
        </div>
      )}
    </div>
  )
}

export default LoginPage
