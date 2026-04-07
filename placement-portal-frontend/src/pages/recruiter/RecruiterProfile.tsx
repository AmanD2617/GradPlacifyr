import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { resolveFileUrl } from '../../config'
import {
  getCompanyProfile,
  updateCompanyProfile,
  uploadCompanyLogo,
  type CompanyProfileData,
  type CompanyUserData,
} from '../../api/companyProfile'
import {
  Building2,
  Globe,
  MapPin,
  Briefcase,
  Pencil,
  Save,
  X,
  Camera,
  Loader2,
  Check,
} from 'lucide-react'
import '../shared/WorkPages.css'

const INDUSTRIES = [
  'Technology',
  'Finance & Banking',
  'Consulting',
  'Healthcare',
  'Education',
  'Manufacturing',
  'E-Commerce',
  'Media & Entertainment',
  'Automotive',
  'Telecom',
  'Energy',
  'Other',
]

const RecruiterProfile = () => {
  const { user: authUser, updateProfileImage } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [editing, setEditing] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Data from server
  const [userData, setUserData] = useState<CompanyUserData | null>(null)
  const [profileData, setProfileData] = useState<CompanyProfileData>({
    companyName: '',
    about: '',
    website: '',
    industry: '',
    location: '',
    logoUrl: null,
  })

  // Edit form state (only used while editing)
  const [form, setForm] = useState({ ...profileData, name: '', phone: '' })

  const logoInputRef = useRef<HTMLInputElement>(null)

  // ── Load profile ──
  useEffect(() => {
    getCompanyProfile()
      .then((res) => {
        setUserData(res.user)
        setProfileData(res.profile)
        setForm({
          ...res.profile,
          name: res.user.name,
          phone: res.user.phone,
        })
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

  // ── Handlers ──
  const handleEdit = () => {
    setForm({
      ...profileData,
      name: userData?.name || '',
      phone: userData?.phone || '',
    })
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
        companyName: form.companyName.trim(),
        about: form.about.trim(),
        website: form.website.trim(),
        industry: form.industry,
        location: form.location.trim(),
      })
      setUserData(res.user)
      setProfileData(res.profile)
      setEditing(false)
      setSuccess('Profile updated successfully!')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Logo must be under 5 MB')
      return
    }

    setUploadingLogo(true)
    setError(null)

    try {
      const res = await uploadCompanyLogo(file)
      setProfileData((prev) => ({ ...prev, logoUrl: res.logoUrl }))
      setSuccess('Company logo uploaded!')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Logo upload failed')
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  const logoSrc = profileData.logoUrl ? resolveFileUrl(profileData.logoUrl) : null
  const avatarSrc = userData?.profileImage ? resolveFileUrl(userData.profileImage) : null

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
        <h1>Company Profile</h1>
        <p>Manage your organization details and recruiter information used for campus communication.</p>
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

      {/* ── Company Logo & Identity Card ── */}
      <article className="work-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          {/* Logo */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '1rem',
                overflow: 'hidden',
                border: '2px solid #e5e7eb',
                background: '#f9fafb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt="Company Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Building2 size={32} style={{ color: '#9ca3af' }} />
              )}
            </div>
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              style={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: '2px solid #fff',
                background: '#1f4b9c',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
              }}
              title="Upload company logo"
            >
              {uploadingLogo ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Camera size={13} />}
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              style={{ display: 'none' }}
            />
          </div>

          {/* Identity info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: '0 0 0.2rem', fontSize: '1.15rem' }}>
              {profileData.companyName || userData?.name || 'Your Company'}
            </h2>
            <p className="work-muted" style={{ fontSize: '0.85rem' }}>
              {userData?.email}
              {profileData.industry && <> &middot; {profileData.industry}</>}
            </p>
            {profileData.location && (
              <p className="work-muted" style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                <MapPin size={13} /> {profileData.location}
              </p>
            )}
          </div>

          {/* Edit button */}
          {!editing && (
            <button className="work-btn" onClick={handleEdit} style={{ flexShrink: 0 }}>
              <Pencil size={14} /> Edit Profile
            </button>
          )}
        </div>
      </article>

      {/* ── Profile Details (view or edit mode) ── */}
      {editing ? (
        <article className="work-card">
          <h2 style={{ margin: '0 0 0.75rem' }}>Edit Profile</h2>
          <div className="work-form">
            <div className="work-grid-2">
              <label>
                Contact Name *
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

            <label>
              Company Name
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="e.g. Acme Technologies Pvt. Ltd."
              />
            </label>

            <label>
              About Company
              <textarea
                value={form.about}
                onChange={(e) => setForm({ ...form, about: e.target.value })}
                placeholder="Brief description of your organization, mission, and what makes it a great place to work..."
                rows={4}
              />
            </label>

            <div className="work-grid-2">
              <label>
                Website
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://www.company.com"
                />
              </label>
              <label>
                Industry
                <select
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Location
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Bengaluru, Karnataka"
              />
            </label>

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
        <>
          {/* ── Company Details Card ── */}
          <article className="work-card">
            <h2 style={{ margin: '0 0 0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Building2 size={18} /> Organization Details
            </h2>
            <div className="work-grid-2">
              <div>
                <p className="work-muted" style={{ fontSize: '0.78rem', marginBottom: '0.15rem' }}>Company Name</p>
                <p style={{ fontWeight: 600 }}>{profileData.companyName || '—'}</p>
              </div>
              <div>
                <p className="work-muted" style={{ fontSize: '0.78rem', marginBottom: '0.15rem' }}>Industry</p>
                <p style={{ fontWeight: 600 }}>{profileData.industry || '—'}</p>
              </div>
              <div>
                <p className="work-muted" style={{ fontSize: '0.78rem', marginBottom: '0.15rem' }}>Website</p>
                {profileData.website ? (
                  <a
                    href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontWeight: 600, color: '#1f4b9c', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Globe size={13} /> {profileData.website}
                  </a>
                ) : (
                  <p style={{ fontWeight: 600 }}>—</p>
                )}
              </div>
              <div>
                <p className="work-muted" style={{ fontSize: '0.78rem', marginBottom: '0.15rem' }}>Location</p>
                <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {profileData.location ? <><MapPin size={13} /> {profileData.location}</> : '—'}
                </p>
              </div>
            </div>
            {profileData.about && (
              <div style={{ marginTop: '0.75rem' }}>
                <p className="work-muted" style={{ fontSize: '0.78rem', marginBottom: '0.15rem' }}>About</p>
                <p style={{ lineHeight: 1.6, color: '#374151' }}>{profileData.about}</p>
              </div>
            )}
          </article>

          {/* ── Contact Info Card ── */}
          <article className="work-card">
            <h2 style={{ margin: '0 0 0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Briefcase size={18} /> Primary Contact
            </h2>
            <div className="work-grid-2">
              <div>
                <p className="work-muted" style={{ fontSize: '0.78rem', marginBottom: '0.15rem' }}>Name</p>
                <p style={{ fontWeight: 600 }}>{userData?.name || '—'}</p>
              </div>
              <div>
                <p className="work-muted" style={{ fontSize: '0.78rem', marginBottom: '0.15rem' }}>Email</p>
                <p style={{ fontWeight: 600 }}>{userData?.email || '—'}</p>
              </div>
              <div>
                <p className="work-muted" style={{ fontSize: '0.78rem', marginBottom: '0.15rem' }}>Phone</p>
                <p style={{ fontWeight: 600 }}>{userData?.phone || '—'}</p>
              </div>
              <div>
                <p className="work-muted" style={{ fontSize: '0.78rem', marginBottom: '0.15rem' }}>Role</p>
                <p style={{ fontWeight: 600, textTransform: 'capitalize' }}>{userData?.role || '—'}</p>
              </div>
            </div>
          </article>
        </>
      )}
    </section>
  )
}

export default RecruiterProfile
