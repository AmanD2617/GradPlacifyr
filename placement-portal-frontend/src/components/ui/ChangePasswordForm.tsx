import { useState } from 'react'
import { changePassword } from '../../api/auth'
import { useAuth } from '../../context/AuthContext'

const ChangePasswordForm = () => {
  const { logout } = useAuth()
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handle = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (form.next !== form.confirm) {
      setStatus('error')
      setMessage('New passwords do not match.')
      return
    }

    if (form.next.length < 8) {
      setStatus('error')
      setMessage('New password must be at least 8 characters.')
      return
    }

    setStatus('loading')
    try {
      const res = await changePassword(form.current, form.next)
      setStatus('success')
      setMessage(res.message + ' You will be logged out now.')
      setForm({ current: '', next: '', confirm: '' })
      // Password change invalidates the session — force re-login after short delay
      setTimeout(() => logout(), 2500)
    } catch (err: unknown) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Failed to change password.')
    }
  }

  return (
    <div className="profile-root">
      <main className="profile-main">
        <h1>Change Password</h1>
        <p className="profile-placeholder">
          Update your account password. You will be logged out after a successful change.
        </p>

        {status === 'success' && (
          <div style={{ padding: '0.75rem 1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, marginBottom: '1rem', color: '#15803d' }}>
            {message}
          </div>
        )}
        {status === 'error' && (
          <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: '1rem', color: '#dc2626' }}>
            {message}
          </div>
        )}

        <form className="password-form" onSubmit={submit}>
          <label>
            Current Password
            <input
              type="password"
              value={form.current}
              onChange={handle('current')}
              required
              autoComplete="current-password"
              disabled={status === 'loading' || status === 'success'}
            />
          </label>
          <label>
            New Password
            <input
              type="password"
              value={form.next}
              onChange={handle('next')}
              required
              autoComplete="new-password"
              minLength={8}
              disabled={status === 'loading' || status === 'success'}
            />
          </label>
          <label>
            Confirm New Password
            <input
              type="password"
              value={form.confirm}
              onChange={handle('confirm')}
              required
              autoComplete="new-password"
              minLength={8}
              disabled={status === 'loading' || status === 'success'}
            />
          </label>
          <button
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            style={{ opacity: status === 'loading' ? 0.7 : 1 }}
          >
            {status === 'loading' ? 'Saving…' : 'Save Password'}
          </button>
        </form>
      </main>
    </div>
  )
}

export default ChangePasswordForm
