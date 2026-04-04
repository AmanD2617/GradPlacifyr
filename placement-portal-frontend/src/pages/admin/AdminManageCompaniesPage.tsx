import { useEffect, useState } from 'react'
import { getUsers, type PortalUser } from '../../api/users'
import {
  getPendingCompanies,
  approveCompany,
  rejectCompany,
  type PendingCompany,
} from '../../api/auth'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import '../shared/WorkPages.css'

const AdminManageCompaniesPage = () => {
  const [query, setQuery] = useState('')
  const [companies, setCompanies] = useState<PortalUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pending companies state
  const [pending, setPending] = useState<PendingCompany[]>([])
  const [pendingLoading, setPendingLoading] = useState(true)
  const [pendingError, setPendingError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const load = (search?: string) => {
    setLoading(true)
    getUsers('recruiter', search)
      .then((data) => setCompanies(data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load recruiters'))
      .finally(() => setLoading(false))
  }

  const loadPending = () => {
    setPendingLoading(true)
    getPendingCompanies()
      .then((data) => setPending(data))
      .catch((err: unknown) => setPendingError(err instanceof Error ? err.message : 'Failed to load pending companies'))
      .finally(() => setPendingLoading(false))
  }

  useEffect(() => {
    load()
    loadPending()
  }, [])

  const handleApprove = async (userId: number) => {
    setActionMessage(null)
    try {
      setActionLoading(userId)
      await approveCompany(userId)
      setPending((prev) => prev.filter((c) => c.id !== userId))
      setActionMessage('Company approved successfully')
      // Refresh the all-companies list too
      load(query.trim() || undefined)
    } catch (err: unknown) {
      setActionMessage(err instanceof Error ? err.message : 'Failed to approve')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (userId: number) => {
    setActionMessage(null)
    try {
      setActionLoading(userId)
      await rejectCompany(userId)
      setPending((prev) => prev.filter((c) => c.id !== userId))
      setActionMessage('Company rejected')
    } catch (err: unknown) {
      setActionMessage(err instanceof Error ? err.message : 'Failed to reject')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <section className="work-page">
      <article className="work-card">
        <h1>Manage Companies</h1>
        <p>Review pending registrations and manage recruiter/company accounts.</p>
      </article>

      {/* ── Pending Approvals ── */}
      <article className="work-card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Clock size={20} />
          Pending Approvals
          {pending.length > 0 && (
            <span className="pending-badge">{pending.length}</span>
          )}
        </h2>

        {actionMessage && <p className="work-success">{actionMessage}</p>}
        {pendingError && <p className="work-error">{pendingError}</p>}

        {pendingLoading ? (
          <p className="work-muted">Loading pending companies...</p>
        ) : pending.length === 0 ? (
          <p className="work-muted">No pending company registrations.</p>
        ) : (
          <ul className="work-list">
            {pending.map((company) => (
              <li key={company.id} className="pending-company-item">
                <div className="pending-company-info">
                  <h3 style={{ margin: 0 }}>{company.name || 'Recruiter'}</h3>
                  <p className="work-muted" style={{ margin: '0.15rem 0 0' }}>
                    {company.email}
                    {company.phone && ` \u2022 ${company.phone}`}
                  </p>
                  <p className="work-muted" style={{ margin: '0.1rem 0 0', fontSize: '0.8rem' }}>
                    Registered: {new Date(company.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="pending-company-actions">
                  <button
                    className="work-btn approve-btn"
                    onClick={() => handleApprove(company.id)}
                    disabled={actionLoading === company.id}
                  >
                    <CheckCircle2 size={15} />
                    {actionLoading === company.id ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    className="work-btn danger reject-btn"
                    onClick={() => handleReject(company.id)}
                    disabled={actionLoading === company.id}
                  >
                    <XCircle size={15} />
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </article>

      {/* ── All Companies ── */}
      <article className="work-card">
        <h2>All Companies</h2>
        <div className="work-row">
          <input
            placeholder="Search company/recruiter email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="work-btn secondary" onClick={() => load(query.trim() || undefined)}>
            Search
          </button>
        </div>
      </article>
      <article className="work-card">
        {error && <p className="work-error">{error}</p>}
        {loading ? (
          <p className="work-muted">Loading companies...</p>
        ) : companies.length === 0 ? (
          <p className="work-muted">No recruiters found.</p>
        ) : (
          <ul className="work-list">
            {companies.map((company) => (
              <li key={company.id}>
                <h3 style={{ margin: 0 }}>{company.name || 'Recruiter'}</h3>
                <p className="work-muted">{company.email}</p>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  )
}

export default AdminManageCompaniesPage
