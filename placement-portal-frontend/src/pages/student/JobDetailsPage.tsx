import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiFetch } from '../../api/client'
import type { Job } from '../../api/jobs'
import { applyToJob, getMyApplications, type StudentApplication } from '../../api/applications'
import '../shared/PanelPage.css'

const JobDetailsPage = () => {
  const { id } = useParams()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [applications, setApplications] = useState<StudentApplication[]>([])
  const [applyLoading, setApplyLoading] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [applyMessage, setApplyMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const jobId = Number(id)
    setLoading(true)
    Promise.all([apiFetch<Job>(`/jobs/${id}`), getMyApplications()])
      .then(([jobData, myApps]) => {
        setJob(jobData)
        setApplications(myApps.filter((app) => app.jobId === jobId))
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load job details'
        setError(message)
      })
      .finally(() => setLoading(false))
  }, [id])

  const existingApplication = applications[0] ?? null

  const handleApply = async () => {
    if (!job) return
    setApplyError(null)
    setApplyMessage(null)
    try {
      setApplyLoading(true)
      const result = await applyToJob(job.id)
      setApplications((prev) => [
        {
          id: result.id,
          jobId: result.jobId,
          status: result.status,
          appliedAt: new Date().toISOString(),
          jobTitle: job.title,
          company: job.company,
        },
        ...prev,
      ])
      setApplyMessage('Application submitted successfully.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to apply'
      setApplyError(message)
    } finally {
      setApplyLoading(false)
    }
  }

  return (
    <section className="panel-page">
      <div className="panel-header">
        <h1>Job Details</h1>
        <p>Detailed opportunity information.</p>
      </div>

      <div className="panel-card">
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p style={{ color: '#b91c1c' }}>{error}</p>
        ) : !job ? (
          <p>Job not found.</p>
        ) : (
          <div className="job-details-layout">
            <div>
              <h2 style={{ margin: 0 }}>{job.title}</h2>
              <p style={{ margin: '0.2rem 0', color: '#475569' }}>{job.company}</p>

              <p style={{ margin: '0.4rem 0 0', color: '#475569', fontSize: '0.9rem' }}>
                <span>{job.location ?? 'Location TBC'}</span> •{' '}
                <span>{job.ctc ?? 'CTC not shared'}</span> •{' '}
                <span>Status: {job.status}</span>
              </p>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Posted on {new Date(job.created_at).toLocaleDateString()}
              </p>

              <div style={{ marginTop: '0.9rem', display: 'grid', gap: '0.75rem' }}>
                <section>
                  <h3 style={{ margin: '0 0 0.4rem', fontSize: '1rem', color: '#0f172a' }}>
                    Role description
                  </h3>
                  <p style={{ margin: 0, color: '#475569', whiteSpace: 'pre-line' }}>
                    {job.description || 'No detailed description has been added for this job yet.'}
                  </p>
                </section>

                <section>
                  <h3 style={{ margin: '0 0 0.4rem', fontSize: '1rem', color: '#0f172a' }}>
                    Requirements
                  </h3>
                  <p style={{ margin: 0, color: '#475569', whiteSpace: 'pre-line' }}>
                    {job.requirements || 'Requirements will be communicated by the placement cell.'}
                  </p>
                </section>

                <Link to="/student/jobs" style={{ marginTop: '0.6rem', color: '#1d4ed8' }}>
                  Back to available jobs
                </Link>
              </div>
            </div>

            <aside className="job-details-sidebar">
              <h2>Application summary</h2>
              <p style={{ margin: '0 0 0.4rem', fontSize: '0.9rem', color: '#475569' }}>
                {existingApplication
                  ? `You applied on ${new Date(
                      existingApplication.appliedAt
                    ).toLocaleDateString()}`
                  : 'You have not applied to this job yet.'}
              </p>

              {job.deadline && (
                <p style={{ margin: '0 0 0.4rem', fontSize: '0.85rem', color: '#b91c1c' }}>
                  Application deadline: {new Date(job.deadline).toLocaleDateString()}
                </p>
              )}

              {job.employmentType && (
                <p style={{ margin: '0 0 0.4rem', fontSize: '0.85rem', color: '#475569' }}>
                  Type: {job.employmentType}
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.6rem' }}>
                {applyError && (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#b91c1c' }}>{applyError}</p>
                )}
                {applyMessage && (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#16a34a' }}>{applyMessage}</p>
                )}

                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!!existingApplication || applyLoading}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: 0,
                    background: existingApplication ? '#9ca3af' : 'var(--jims-success)',
                    color: '#fff',
                    cursor: existingApplication ? 'not-allowed' : 'pointer',
                  }}
                >
                  {existingApplication
                    ? 'Already applied'
                    : applyLoading
                    ? 'Applying...'
                    : 'Apply for this job'}
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </section>
  )
}

export default JobDetailsPage
