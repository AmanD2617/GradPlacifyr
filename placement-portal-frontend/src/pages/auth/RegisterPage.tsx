import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import './Auth.css'
import { useAuth, type Role } from '../../context/AuthContext'
import { register as apiRegister } from '../../api/auth'
import { PasswordInput } from '../../components/ui/PasswordInput'

// ═══════════ Validation Rules (mirrored from backend) ═══════════

const COLLEGE_EMAIL_REGEX = /^[a-z]+_[a-z]+_mca\d{2}@(jimsipu\.org|jimsindia\.org)$/
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,}$/
const PHONE_REGEX = /^\d{10}$/
const ENROLLMENT_REGEX = /^\d{11}$/

function validateField(field: string, value: string, role: string): string | null {
  switch (field) {
    case 'name':
      if (!value.trim()) return 'Full name is required'
      if (value.trim().length < 3) return 'Name must be at least 3 characters'
      return null

    case 'email':
      if (!value.trim()) return 'Email is required'
      if (role === 'student') {
        if (!COLLEGE_EMAIL_REGEX.test(value.trim().toLowerCase()))
          return 'Must follow: firstname_lastname_mcaYY@jimsipu.org'
      } else {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
          return 'Enter a valid email address'
      }
      return null

    case 'phone':
      if (!value.trim()) return 'Phone number is required'
      if (!PHONE_REGEX.test(value.replace(/\D/g, '')))
        return 'Must be exactly 10 digits'
      return null

    case 'password':
      if (!value) return 'Password is required'
      if (!STRONG_PASSWORD_REGEX.test(value))
        return 'Min 8 chars with uppercase, lowercase, number & special character'
      return null

    case 'enrollmentNumber':
      if (role !== 'student') return null
      if (!value.trim()) return 'Enrollment number is required for students'
      if (!ENROLLMENT_REGEX.test(value.trim()))
        return 'Enrollment number must be exactly 11 digits'
      return null

    default:
      return null
  }
}

const RegisterPage = () => {
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [enrollmentNumber, setEnrollmentNumber] = useState('')
  const [role, setRole] = useState<Role>('student')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Track which fields the user has interacted with (for showing inline errors)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  // Get error for a specific field (only if touched)
  const fieldError = (field: string, value: string): string | null => {
    if (!touched[field]) return null
    return validateField(field, value, role)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Mark all fields as touched to show any remaining errors
    setTouched({ name: true, email: true, phone: true, password: true, enrollmentNumber: true })

    // Run all validations
    const fields = [
      validateField('name', name, role),
      validateField('email', email, role),
      validateField('phone', phone, role),
      validateField('password', password, role),
      validateField('enrollmentNumber', enrollmentNumber, role),
    ]

    const firstError = fields.find((e) => e !== null)
    if (firstError) {
      setError(firstError)
      return
    }

    try {
      setLoading(true)
      const result = await apiRegister(
        email.trim().toLowerCase(),
        password,
        role,
        name.trim(),
        phone.replace(/\D/g, ''),
        role === 'student' ? enrollmentNumber.trim() : undefined
      )

      // Company/recruiter accounts need admin approval
      if (result.pending) {
        setSuccess(result.message || 'Your account has been submitted for admin approval. You will be notified once approved.')
        return
      }

      // Students and admins get immediate login
      await login(email.trim().toLowerCase(), password, role)
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
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {/* Role selector — placed first so conditional fields update immediately */}
              <label className="auth-label">
                Role
                <select
                  className="auth-input"
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value as Role)
                    // Clear enrollment when switching away from student
                    if (e.target.value !== 'student') setEnrollmentNumber('')
                  }}
                >
                  <option value="student">Student</option>
                  <option value="recruiter">Recruiter</option>
                </select>
              </label>

              <label className="auth-label">
                <span>Full name <span className="auth-required">*</span></span>
                <input
                  type="text"
                  className={`auth-input ${fieldError('name', name) ? 'auth-input-error' : ''}`}
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => markTouched('name')}
                />
                {fieldError('name', name) && <span className="auth-field-error">{fieldError('name', name)}</span>}
              </label>

              <label className="auth-label">
                <span>Email <span className="auth-required">*</span></span>
                <input
                  type="email"
                  className={`auth-input ${fieldError('email', email) ? 'auth-input-error' : ''}`}
                  placeholder={role === 'student' ? 'firstname_lastname_mca25@jimsipu.org' : 'you@company.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => markTouched('email')}
                />
                {fieldError('email', email) && <span className="auth-field-error">{fieldError('email', email)}</span>}
              </label>

              {/* Enrollment Number — Students only */}
              {role === 'student' && (
                <label className="auth-label">
                  <span>Enrollment Number <span className="auth-required">*</span></span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={`auth-input ${fieldError('enrollmentNumber', enrollmentNumber) ? 'auth-input-error' : ''}`}
                    placeholder="e.g. 00114004425"
                    value={enrollmentNumber}
                    onChange={(e) => setEnrollmentNumber(e.target.value.replace(/\D/g, ''))}
                    onBlur={() => markTouched('enrollmentNumber')}
                    maxLength={11}
                  />
                  {fieldError('enrollmentNumber', enrollmentNumber) && (
                    <span className="auth-field-error">{fieldError('enrollmentNumber', enrollmentNumber)}</span>
                  )}
                </label>
              )}

              <label className="auth-label">
                <span>Phone Number <span className="auth-required">*</span></span>
                <input
                  type="tel"
                  className={`auth-input ${fieldError('phone', phone) ? 'auth-input-error' : ''}`}
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => markTouched('phone')}
                  maxLength={10}
                />
                {fieldError('phone', phone) && <span className="auth-field-error">{fieldError('phone', phone)}</span>}
              </label>

              <label className="auth-label">
                <span>Password <span className="auth-required">*</span></span>
                <PasswordInput
                  className={`auth-input ${fieldError('password', password) ? 'auth-input-error' : ''}`}
                  placeholder="Min 8 chars, Aa1@"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => markTouched('password')}
                />
                {fieldError('password', password) && (
                  <span className="auth-field-error">{fieldError('password', password)}</span>
                )}
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
