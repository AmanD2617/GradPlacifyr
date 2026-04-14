import { useEffect, useState, type FormEvent } from 'react'
import { getTpoAccounts, createTpoAccount, type PortalUser } from '../../api/users'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { UserPlus, Users } from 'lucide-react'
import '../shared/WorkPages.css'

const AdminManageTPOPage = () => {
  // ── Existing TPO accounts ──
  const [tpoList, setTpoList] = useState<PortalUser[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  // ── Create TPO form ──
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  const loadTpo = () => {
    setListLoading(true)
    getTpoAccounts()
      .then((data) => setTpoList(data))
      .catch((err: unknown) => setListError(err instanceof Error ? err.message : 'Failed to load TPO accounts'))
      .finally(() => setListLoading(false))
  }

  useEffect(() => { loadTpo() }, [])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      setFormError('All fields are required')
      return
    }

    try {
      setFormLoading(true)
      const result = await createTpoAccount({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.replace(/\D/g, ''),
        password,
      })
      setFormSuccess(result.message || 'TPO account created successfully')
      setName('')
      setEmail('')
      setPhone('')
      setPassword('')
      loadTpo()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create TPO account')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <section className="work-page">
      <article className="work-card">
        <h1>Manage TPO Accounts</h1>
        <p>Create and view Training &amp; Placement Officer accounts. TPO accounts can only be created by the admin.</p>
      </article>

      {/* ── Create New TPO ── */}
      <article className="work-card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <UserPlus size={20} />
          Create New TPO Account
        </h2>

        <form className="work-form" onSubmit={handleCreate} noValidate>
          <label>
            Full Name
            <input
              type="text"
              placeholder="e.g. Dr. Priya Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
            />
          </label>

          <label>
            Email Address
            <input
              type="email"
              placeholder="tpo@jimsipu.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Phone Number
            <input
              type="tel"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              maxLength={10}
              required
            />
          </label>

          <label>
            Password
            <PasswordInput
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {formError && <p className="work-error">{formError}</p>}
          {formSuccess && <p className="work-success">{formSuccess}</p>}

          <button className="work-btn" type="submit" disabled={formLoading}>
            {formLoading ? 'Creating...' : 'Create TPO Account'}
          </button>
        </form>
      </article>

      {/* ── Existing TPO Accounts ── */}
      <article className="work-card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Users size={20} />
          Existing TPO Accounts
        </h2>

        {listError && <p className="work-error">{listError}</p>}

        {listLoading ? (
          <p className="work-muted">Loading TPO accounts...</p>
        ) : tpoList.length === 0 ? (
          <p className="work-muted">No TPO accounts found. Create one above.</p>
        ) : (
          <ul className="work-list">
            {tpoList.map((tpo) => (
              <li key={tpo.id}>
                <h3 style={{ margin: 0 }}>{tpo.name || 'TPO'}</h3>
                <p className="work-muted" style={{ margin: '0.15rem 0 0' }}>{tpo.email}</p>
                <p className="work-muted" style={{ margin: '0.1rem 0 0', fontSize: '0.8rem' }}>
                  Created: {new Date(tpo.createdAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  )
}

export default AdminManageTPOPage
