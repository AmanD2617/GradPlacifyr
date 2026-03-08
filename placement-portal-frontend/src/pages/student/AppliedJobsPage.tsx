import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyApplications, type StudentApplication } from '../../api/applications'
import '../shared/PanelPage.css'

const AppliedJobsPage = () => {
  const [applications, setApplications] = useState<StudentApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed'>('all')

  useEffect(() => {
    getMyApplications()
      .then((data) => setApplications(data))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load applications'
        setError(message)
      })
      .finally(() => setLoading(false))
  }, [])

  const inProgressStatuses = ['applied', 'shortlisted', 'test_scheduled', 'interview_scheduled']
  const completedStatuses = ['selected', 'rejected']

  const formatStatus = (status: string) => {
    switch (status) {
      case 'applied':
        return 'Applied'
      case 'shortlisted':
        return 'Shortlisted'
      case 'test_scheduled':
        return 'Test scheduled'
      case 'interview_scheduled':
        return 'Interview scheduled'
      case 'selected':
        return 'Offer'
      case 'rejected':
        return 'Not selected'
      default:
        return status
    }
  }

  const nextStepHint = (status: string) => {
    switch (status) {
      case 'applied':
        return 'Awaiting shortlisting from the company or placement cell.'
      case 'shortlisted':
        return 'You have been shortlisted. Watch for test or interview scheduling.'
      case 'test_scheduled':
        return 'A test has been scheduled. Check the Interview Schedule page for exact time.'
      case 'interview_scheduled':
        return 'Interview scheduled. Prepare and check Interview Schedule for joining details.'
      case 'selected':
        return 'You have an offer for this role. Coordinate with the placement cell for next steps.'
      case 'rejected':
        return 'This application was not selected. Consider applying to similar roles.'
      default:
        return 'Status updated by the placement cell.'
    }
  }

  const sections = useMemo(() => {
    const inProgress = applications.filter((a) => inProgressStatuses.includes(a.status))
    const completed = applications.filter((a) => completedStatuses.includes(a.status))
    const other = applications.filter(
      (a) => !inProgressStatuses.includes(a.status) && !completedStatuses.includes(a.status)
    )

    if (statusFilter === 'in_progress') {
      return [{ key: 'in-progress', title: 'In progress', items: inProgress }]
    }

    if (statusFilter === 'completed') {
      return [{ key: 'completed', title: 'Completed', items: completed }]
    }

    return [
      { key: 'in-progress', title: 'In progress', items: inProgress },
      { key: 'completed', title: 'Completed', items: completed },
      { key: 'other', title: 'Other updates', items: other },
    ].filter((section) => section.items.length > 0)
  }, [applications, statusFilter])

  return (
    <section className="panel-page">
      <div className="panel-header">
        <h1>Applied Jobs</h1>
        <p>Track your application statuses in one place.</p>
      </div>

      <div className="panel-card">
        {loading ? (
          <p>Loading applications...</p>
        ) : error ? (
          <p style={{ color: '#b91c1c' }}>{error}</p>
        ) : applications.length === 0 ? (
          <p>
            You haven&apos;t applied to any jobs yet.{' '}
            <Link to="/student/jobs" style={{ color: '#1d4ed8' }}>
              Browse available jobs
            </Link>{' '}
            to get started.
          </p>
        ) : (
          <>
            <div
              style={{
                display: 'inline-flex',
                gap: '0.4rem',
                paddingBottom: '0.6rem',
                borderBottom: '1px solid #e5e7eb',
                marginBottom: '0.75rem',
              }}
            >
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                style={{
                  padding: '0.25rem 0.7rem',
                  borderRadius: '999px',
                  border: 0,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  background: statusFilter === 'all' ? '#111827' : '#e5e7eb',
                  color: statusFilter === 'all' ? '#ffffff' : '#111827',
                }}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('in_progress')}
                style={{
                  padding: '0.25rem 0.7rem',
                  borderRadius: '999px',
                  border: 0,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  background: statusFilter === 'in_progress' ? '#0f766e' : '#e5e7eb',
                  color: statusFilter === 'in_progress' ? '#ffffff' : '#111827',
                }}
              >
                In progress
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                style={{
                  padding: '0.25rem 0.7rem',
                  borderRadius: '999px',
                  border: 0,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  background: statusFilter === 'completed' ? '#4b5563' : '#e5e7eb',
                  color: statusFilter === 'completed' ? '#ffffff' : '#111827',
                }}
              >
                Completed
              </button>
            </div>

            {sections.length === 0 ? (
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                No applications match this filter.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '0.9rem' }}>
                {sections.map((section) => (
                  <div key={section.key}>
                    {statusFilter === 'all' && (
                      <h2
                        style={{
                          margin: '0 0 0.4rem',
                          fontSize: '0.95rem',
                          color: '#111827',
                        }}
                      >
                        {section.title}
                      </h2>
                    )}
                    <div style={{ display: 'grid', gap: '0.65rem' }}>
                      {section.items.map((item) => (
                        <article
                          key={item.id}
                          style={{
                            border: '1px solid #dbeafe',
                            borderRadius: '0.75rem',
                            padding: '0.7rem',
                            background: '#f9fafb',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: '0.75rem',
                              alignItems: 'flex-start',
                            }}
                          >
                            <div>
                              <h3 style={{ margin: 0 }}>{item.jobTitle}</h3>
                              <p style={{ margin: '0.2rem 0', color: '#4b5563' }}>
                                {item.company}
                              </p>
                            </div>
                            <span
                              style={{
                                fontSize: '0.8rem',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '999px',
                                background: inProgressStatuses.includes(item.status)
                                  ? '#ecfdf3'
                                  : completedStatuses.includes(item.status)
                                  ? '#eff6ff'
                                  : '#f3f4f6',
                                color: inProgressStatuses.includes(item.status)
                                  ? '#166534'
                                  : completedStatuses.includes(item.status)
                                  ? '#1d4ed8'
                                  : '#374151',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {formatStatus(item.status)}
                            </span>
                          </div>

                          <p
                            style={{
                              margin: '0.1rem 0 0',
                              color: '#6b7280',
                              fontSize: '0.85rem',
                            }}
                          >
                            Applied on {new Date(item.appliedAt).toLocaleDateString()}
                          </p>
                          <p
                            style={{
                              margin: '0.35rem 0 0',
                              color: '#6b7280',
                              fontSize: '0.85rem',
                            }}
                          >
                            {nextStepHint(item.status)}
                          </p>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default AppliedJobsPage
