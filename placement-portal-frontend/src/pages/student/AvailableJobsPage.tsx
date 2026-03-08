import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getJobs, type Job } from '../../api/jobs'
import { applyToJob, getMyApplications } from '../../api/applications'
import '../shared/PanelPage.css'

const AvailableJobsPage = () => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [applyingId, setApplyingId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState('all')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [ctcFilter, setCtcFilter] = useState<'all' | 'lt5' | 'mid' | 'gt10'>('all')
  const [sortBy, setSortBy] = useState<'relevance' | 'latest' | 'ctcHigh' | 'ctcLow'>('relevance')

  useEffect(() => {
    Promise.all([getJobs(), getMyApplications()])
      .then(([jobsData, appData]) => {
        setJobs(jobsData)
        setAppliedJobIds(new Set(appData.map((a) => a.jobId)))
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load jobs'
        setError(message)
      })
      .finally(() => setLoading(false))
  }, [])

  const locationOptions = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.location).filter(Boolean))) as string[],
    [jobs]
  )

  const companyOptions = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.company).filter(Boolean))),
    [jobs]
  )

  const statusOptions = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.status).filter(Boolean))),
    [jobs]
  )

  const parseCtcValue = (ctc: string | null): number | null => {
    if (!ctc) return null
    const match = ctc.match(/(\d+(\.\d+)?)/)
    return match ? parseFloat(match[1]) : null
  }

  const filteredJobs = useMemo(() => {
    let next = jobs

    const q = query.trim().toLowerCase()
    if (q) {
      next = next.filter(
        (job) =>
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          (job.location ?? '').toLowerCase().includes(q)
      )
    }

    if (locationFilter !== 'all') {
      next = next.filter((job) => (job.location ?? '') === locationFilter)
    }

    if (companyFilter !== 'all') {
      next = next.filter((job) => job.company === companyFilter)
    }

    if (statusFilter !== 'all') {
      next = next.filter((job) => job.status === statusFilter)
    }

    if (ctcFilter !== 'all') {
      next = next.filter((job) => {
        const value = parseCtcValue(job.ctc)
        if (value == null) return false
        if (ctcFilter === 'lt5') return value < 5
        if (ctcFilter === 'mid') return value >= 5 && value <= 10
        return value > 10
      })
    }

    if (sortBy === 'latest') {
      return [...next].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }

    if (sortBy === 'ctcHigh' || sortBy === 'ctcLow') {
      return [...next].sort((a, b) => {
        const aVal = parseCtcValue(a.ctc) ?? -1
        const bVal = parseCtcValue(b.ctc) ?? -1
        return sortBy === 'ctcHigh' ? bVal - aVal : aVal - bVal
      })
    }

    return next
  }, [
    jobs,
    query,
    locationFilter,
    companyFilter,
    statusFilter,
    ctcFilter,
    sortBy,
  ])

  const handleApply = async (jobId: number) => {
    try {
      setApplyingId(jobId)
      await applyToJob(jobId)
      setAppliedJobIds((prev) => {
        const next = new Set(prev)
        next.add(jobId)
        return next
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to apply'
      setError(message)
    } finally {
      setApplyingId(null)
    }
  }

  return (
    <section className="panel-page">
      <div className="panel-header">
        <h1>Available Jobs</h1>
        <p>Search and apply for open jobs and internships.</p>
      </div>

      <div className="panel-card">
        <div style={{ display: 'grid', gap: '0.55rem' }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, company, location"
            style={{
              width: '100%',
              padding: '0.65rem',
              borderRadius: '0.6rem',
              border: '1px solid var(--jims-border)',
            }}
          />

          <div
            style={{
              display: 'grid',
              gap: '0.5rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              fontSize: '0.85rem',
            }}
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span style={{ color: 'var(--jims-ink-soft)' }}>Location</span>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                style={{
                  padding: '0.4rem 0.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--jims-border)',
                }}
              >
                <option value="all">All</option>
                {locationOptions.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span style={{ color: 'var(--jims-ink-soft)' }}>Company</span>
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                style={{
                  padding: '0.4rem 0.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--jims-border)',
                }}
              >
                <option value="all">All</option>
                {companyOptions.map((comp) => (
                  <option key={comp} value={comp}>
                    {comp}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span style={{ color: 'var(--jims-ink-soft)' }}>Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '0.4rem 0.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--jims-border)',
                }}
              >
                <option value="all">All</option>
                {statusOptions.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span style={{ color: 'var(--jims-ink-soft)' }}>CTC range (LPA)</span>
              <select
                value={ctcFilter}
                onChange={(e) => setCtcFilter(e.target.value as typeof ctcFilter)}
                style={{
                  padding: '0.4rem 0.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--jims-border)',
                }}
              >
                <option value="all">Any</option>
                <option value="lt5">&lt; 5</option>
                <option value="mid">5 - 10</option>
                <option value="gt10">&gt; 10</option>
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span style={{ color: 'var(--jims-ink-soft)' }}>Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                style={{
                  padding: '0.4rem 0.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--jims-border)',
                }}
              >
                <option value="relevance">Relevance</option>
                <option value="latest">Latest posted</option>
                <option value="ctcHigh">CTC: high to low</option>
                <option value="ctcLow">CTC: low to high</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {error && <div className="panel-card"><p style={{ margin: 0, color: 'var(--jims-danger)' }}>{error}</p></div>}

      <div className="panel-card">
        {loading ? (
          <p>Loading jobs...</p>
        ) : filteredJobs.length === 0 ? (
          <p>No jobs found.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {filteredJobs.map((job) => {
              const applied = appliedJobIds.has(job.id)
              return (
                <article
                  key={job.id}
                  style={{
                    border: '1px solid var(--jims-border)',
                    borderRadius: '0.8rem',
                    padding: '0.75rem',
                    display: 'grid',
                    gap: '0.55rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <h3 style={{ margin: 0 }}>{job.title}</h3>
                      <p style={{ margin: '0.2rem 0 0', color: 'var(--jims-ink-soft)' }}>{job.company}</p>
                    </div>
                    <span style={{ fontSize: '0.8rem', background: '#f6ead5', color: 'var(--jims-maroon)', padding: '0.2rem 0.45rem', borderRadius: '0.45rem' }}>
                      {applied ? 'Applied' : job.status}
                    </span>
                  </div>

                  <p style={{ margin: 0, color: 'var(--jims-ink-soft)', fontSize: '0.9rem' }}>
                    {job.location ?? 'Location TBC'} • {job.ctc ?? 'CTC not shared'}
                  </p>
                  <p style={{ margin: 0, color: 'var(--jims-ink-soft)', fontSize: '0.8rem' }}>
                    Posted on {new Date(job.created_at).toLocaleDateString()}
                  </p>

                  <div style={{ display: 'flex', gap: '0.45rem' }}>
                    <Link
                      to={`/student/jobs/${job.id}`}
                      style={{ padding: '0.4rem 0.7rem', borderRadius: '0.45rem', border: '1px solid var(--jims-maroon)', color: 'var(--jims-maroon)' }}
                    >
                      Job Details
                    </Link>
                    <button
                      type="button"
                      disabled={applied || applyingId === job.id}
                      onClick={() => handleApply(job.id)}
                      style={{
                        padding: '0.45rem 0.75rem',
                        borderRadius: '0.45rem',
                        border: 0,
                        background: applied ? '#9b8f7a' : 'var(--jims-success)',
                        color: '#fff',
                        cursor: applied ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {applied ? 'Applied' : applyingId === job.id ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default AvailableJobsPage
