import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { resolveFileUrl, API_BASE } from '../../config'
import {
  getCompanyProfile,
  updateCompanyProfile,
  type CompanyUserData,
} from '../../api/companyProfile'
import {
  Shield,
  Pencil,
  Save,
  X,
  Camera,
  Loader2,
  Check,
  Mail,
  Phone,
  User,
} from 'lucide-react'
import '../shared/WorkPages.css'

const AdminProfile = () => {
  const { user: authUser, updateProfileImage } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [editing, setEditing] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [userData, setUserData] = useState<CompanyUserData | null>(null)
  const [form, setForm] = useState({ name: '', phone: '' })

  const avatarInputRef = useRef<HTMLInputElement>(null)

  // ── Load profile ──
  useEffect(() => {
    getCompanyProfile()
      .then((res) => {
        setUserData(res.user)
        setForm({ name: res.user.name, phone: res.user.phone })
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load profile')
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Auto-dismiss toasts ──
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 3500)
      return () => clearTimeout(t)
    }
  }, [success])

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(t)
    }
  }, [error])

  const handleEdit = () => {
    setForm({ name: userData?.name || '', phone: userData?.phone || '' })
    setEditing(true)
  }

  const handleCancel = () => {
    setEditing(false)
    setError(null)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Name is required.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await updateCompanyProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
      })
      setUserData(res.user)
      setEditing(false)
      setSuccess('Profile updated successfully!')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB')
      return
    }

    setUploadingAvatar(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const res = await fetch(`${API_BASE}/upload/avatar`, {
        method: 'POST',
        credentials: 'include', // HttpOnly cookie auth
        body: formData,
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((data as any)?.error?.message || (data as any)?.error || 'Upload failed')

      setUserData((prev) => prev ? { ...prev, profileImage: data.profileImage } : prev)
      updateProfileImage(data.profileImage)
      setSuccess('Profile image updated!')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Avatar upload failed')
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const avatarSrc = userData?.profileImage ? resolveFileUrl(userData.profileImage) : null
  const initials = userData?.name
    ? userData.name.trim().split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  if (loading) {
    return (
      <section className="work-page">
        <article className="work-card" style={{ textAlign: 'center', padding: '2rem' }}>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#6b7280' }} />
          <p className="work-muted" style={{ marginTop: '0.5rem' }}>Loading profile...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </article>
      </section>
    )
  }

  return (
    <section className="work-page">
      {/* ── Header ── */}
      <article className="work-card">
        <h1>Admin Profile</h1>
        <p>Manage your admin details for portal governance and communications.</p>
      </article>

      {/* ── Toast messages ── */}
      {success && (
        <article
          className="work-card"
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Check size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
          <p className="work-success" style={{ margin: 0 }}>{success}</p>
        </article>
      )}
      {error && (
        <article
          className="work-card"
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            cursor: 'pointer',
          }}
          onClick={() => setError(null)}
        >
          <p className="work-error" style={{ margin: 0 }}>{error}</p>
        </article>
      )}

      {/* ── Avatar & Identity ── */}
      <article className="work-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '3px solid #e5e7eb',
                background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={userData?.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.5rem', letterSpacing: '0.05em' }}>
                  {initials}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: '2px solid #fff',
                background: '#7c3aed',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
              }}
              title="Upload profile image"
            >
              {uploadingAvatar ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Camera size={13} />}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
            />
          </div>

          {/* Identity */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: '0 0 0.2rem', fontSize: '1.15rem' }}>
              {userData?.name || 'Administrator'}
            </h2>
            <p className="work-muted" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Shield size={14} style={{ color: '#7c3aed' }} />
              <span style={{ textTransform: 'capitalize' }}>{userData?.role || 'admin'}</span>
              &middot; {userData?.email}
            </p>
          </div>

          {/* Edit button */}
          {!editing && (
            <button className="work-btn" onClick={handleEdit} style={{ flexShrink: 0 }}>
              <Pencil size={14} /> Edit Profile
            </button>
          )}
        </div>
      </article>

      {/* ── Edit / View mode ── */}
      {editing ? (
        <article className="work-card">
          <h2 style={{ margin: '0 0 0.75rem' }}>Edit Profile</h2>
          <div className="work-form">
            <div className="work-grid-2">
              <label>
                Full Name *
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                />
              </label>
              <label>
                Phone
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </label>
            </div>

            <div className="work-row" style={{ marginTop: '0.25rem' }}>
              <button className="work-btn" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                ) : (
                  <><Save size={14} /> Save Changes</>
                )}
              </button>
              <button className="work-btn secondary" onClick={handleCancel} disabled={saving}>
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        </article>
      ) : (
        <article className="work-card">
          <h2 style={{ margin: '0 0 0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <User size={18} /> Contact Details
          </h2>
          <div className="work-grid-2">
            <div>
              <p className="work-muted" style={{ fontSize: '0.78rem', marginBottom: '0.15rem' }}>Full Name</p>
              <p style={{ fontWeight: 600 }}>{userData?.name || '—'}</p>
            </div>
            <div>
              <p className="work-muted" style={{ fontSize: '0.78rem', marginBottom: '0.15rem' }}>Email</p>
              <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Mail size={13} style={{ color: '#6b7280' }} /> {userData?.email || '—'}
              </p>
            </div>
            <div>
              <p className="work-muted" style={{ fontSize: '0.78rem', marginBottom: '0.15rem' }}>Phone</p>
              <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Phone size={13} style={{ color: '#6b7280' }} /> {userData?.phone || '—'}
              </p>
            </div>
            <div>
              <p className="work-muted" style={{ fontSize: '0.78rem', marginBottom: '0.15rem' }}>Role</p>
              <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', textTransform: 'capitalize' }}>
                <Shield size={13} style={{ color: '#7c3aed' }} /> {userData?.role || '—'}
              </p>
            </div>
          </div>
        </article>
      )}
    </section>
  )
}

export default AdminProfile
