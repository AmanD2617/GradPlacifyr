import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getJobs, type Job } from '../../api/jobs'
import {
  getRounds,
  createRound,
  deleteRound,
  getRoundCandidates,
  seedRound,
  updateCandidateStatus,
  type Round,
  type RoundCandidate,
} from '../../api/rounds'
import { resolveFileUrl } from '../../config'
import ApplicantProfileModal from '../../components/applicants/ApplicantProfileModal'
import type { PortalApplication } from '../../api/applications'
import {
  Plus,
  Trash2,
  Users,
  UserCheck,
  XCircle,
  FileText,
  User,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import '../shared/WorkPages.css'

const CompanyRoundsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedJobId = searchParams.get('jobId') ? Number(searchParams.get('jobId')) : null

  // Job list
  const [jobs, setJobs] = useState<Job[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)

  // Rounds for selected job
  const [rounds, setRounds] = useState<Round[]>([])
  const [roundsLoading, setRoundsLoading] = useState(false)

  // Candidate view for selected round
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null)
  const [candidates, setCandidates] = useState<RoundCandidate[]>([])
  const [candidatesLoading, setCandidatesLoading] = useState(false)
  const [roundInfo, setRoundInfo] = useState<{ title: string } | null>(null)

  // New round form
  const [showAddRound, setShowAddRound] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newDesc, setNewDesc] = useState('')

  // Profile modal
  const [profileApp, setProfileApp] = useState<PortalApplication | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  // Load jobs
  useEffect(() => {
    getJobs()
      .then((data) => setJobs(data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load jobs'))
      .finally(() => setJobsLoading(false))
  }, [])

  // Load rounds when job selected
  useEffect(() => {
    if (!selectedJobId) {
      setRounds([])
      return
    }
    setRoundsLoading(true)
    setSelectedRoundId(null)
    setCandidates([])
    getRounds(selectedJobId)
      .then((data) => setRounds(data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load rounds'))
      .finally(() => setRoundsLoading(false))
  }, [selectedJobId])

  const selectJob = (jobId: number) => {
    setSearchParams({ jobId: String(jobId) })
  }

  const loadRounds = () => {
    if (!selectedJobId) return
    getRounds(selectedJobId)
      .then((data) => setRounds(data))
      .catch(() => {})
  }

  const [creating, setCreating] = useState(false)

  const handleCreateRound = async () => {
    // Validate inputs
    if (!selectedJobId) {
      setError('Job ID is missing. Please select a job first.')
      return
    }
    if (!newTitle.trim()) {
      setError('Round title is required.')
      return
    }

    setError(null)
    setCreating(true)

    try {
      await createRound({
        jobId: selectedJobId,
        title: newTitle.trim(),
        date: newDate || undefined,
        description: newDesc.trim() || undefined,
      })
      setNewTitle('')
      setNewDate('')
      setNewDesc('')
      setShowAddRound(false)
      loadRounds()
    } catch (err: unknown) {
      console.error('Create round error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create round')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteRound = async (roundId: number) => {
    try {
      await deleteRound(roundId)
      if (selectedRoundId === roundId) {
        setSelectedRoundId(null)
        setCandidates([])
      }
      loadRounds()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete round')
    }
  }

  const handleSeedRound = async (roundId: number) => {
    try {
      const res = await seedRound(roundId)
      loadCandidates(roundId)
      loadRounds()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to seed round')
    }
  }

  const loadCandidates = (roundId: number) => {
    setCandidatesLoading(true)
    setSelectedRoundId(roundId)
    getRoundCandidates(roundId)
      .then((data) => {
        setCandidates(data.candidates)
        setRoundInfo({ title: data.round.title })
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load candidates'))
      .finally(() => setCandidatesLoading(false))
  }

  const handleCandidateAction = async (
    roundId: number,
    candidateId: number,
    status: 'cleared' | 'rejected'
  ) => {
    try {
      setUpdatingId(candidateId)
      await updateCandidateStatus(roundId, candidateId, status)
      loadCandidates(roundId)
      loadRounds() // refresh counts
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Status update failed')
    } finally {
      setUpdatingId(null)
    }
  }

  const selectedJob = jobs.find((j) => j.id === selectedJobId)

  return (
    <section className="work-page">
      <article className="work-card">
        <h1>Interview Rounds</h1>
        <p>Create rounds for your jobs, manage candidates through each stage, and advance or reject applicants.</p>
      </article>

      {error && (
        <article className="work-card" style={{ cursor: 'pointer' }} onClick={() => setError(null)}>
          <p className="work-error">{error} <span style={{ fontSize: '0.78rem', opacity: 0.7 }}>(click to dismiss)</span></p>
        </article>
      )}

      {/* Job Selector */}
      {!selectedJobId ? (
        <article className="work-card">
          <h2 style={{ margin: '0 0 0.5rem' }}>Select a Job</h2>
          {jobsLoading ? (
            <p className="work-muted">Loading jobs...</p>
          ) : jobs.length === 0 ? (
            <p className="work-muted">No jobs posted yet.</p>
          ) : (
            <ul className="work-list">
              {jobs.map((job) => (
                <li
                  key={job.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => selectJob(job.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.15rem' }}>{job.title}</h3>
                      <p className="work-muted" style={{ fontSize: '0.82rem' }}>
                        {job.company} &middot; {job.location || 'Remote'} &middot;{' '}
                        <span style={{ textTransform: 'capitalize' }}>{job.status}</span>
                      </p>
                    </div>
                    <ChevronRight size={18} style={{ color: '#9ca3af' }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      ) : (
        <>
          {/* Back + Job Title */}
          <article className="work-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className="work-btn secondary"
                onClick={() => {
                  setSearchParams({})
                  setSelectedRoundId(null)
                  setCandidates([])
                }}
                style={{ fontSize: '0.82rem' }}
              >
                &larr; All Jobs
              </button>
              <h2 style={{ margin: 0 }}>
                {selectedJob?.title || 'Job'} — {selectedJob?.company || ''}
              </h2>
            </div>
          </article>

          {/* Rounds List */}
          <article className="work-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.4rem' }}>
              <h2 style={{ margin: 0 }}>Rounds</h2>
              <button className="work-btn" onClick={() => setShowAddRound(!showAddRound)}>
                <Plus size={14} /> Add Round
              </button>
            </div>

            {/* Add Round Form */}
            {showAddRound && (
              <div
                style={{
                  border: '1px solid var(--jims-border, #e5e7eb)',
                  borderRadius: '0.6rem',
                  padding: '0.75rem',
                  marginBottom: '0.75rem',
                  background: '#fafbfc',
                }}
              >
                <div className="work-form" style={{ gap: '0.5rem' }}>
                  <label style={{ display: 'grid', gap: '0.2rem', fontWeight: 600, color: 'var(--jims-ink-soft)' }}>
                    Round Title *
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Aptitude Test, Technical Interview"
                      style={{
                        padding: '0.45rem 0.6rem',
                        border: '1px solid var(--jims-border, #e5e7eb)',
                        borderRadius: '0.5rem',
                        fontSize: '0.85rem',
                      }}
                    />
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <label style={{ display: 'grid', gap: '0.2rem', fontWeight: 600, color: 'var(--jims-ink-soft)' }}>
                      Date (optional)
                      <input
                        type="datetime-local"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        style={{
                          padding: '0.45rem 0.6rem',
                          border: '1px solid var(--jims-border, #e5e7eb)',
                          borderRadius: '0.5rem',
                          fontSize: '0.85rem',
                        }}
                      />
                    </label>
                    <label style={{ display: 'grid', gap: '0.2rem', fontWeight: 600, color: 'var(--jims-ink-soft)' }}>
                      Description (optional)
                      <input
                        type="text"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        placeholder="Brief description"
                        style={{
                          padding: '0.45rem 0.6rem',
                          border: '1px solid var(--jims-border, #e5e7eb)',
                          borderRadius: '0.5rem',
                          fontSize: '0.85rem',
                        }}
                      />
                    </label>
                  </div>
                  <div className="work-row">
                    <button className="work-btn" onClick={handleCreateRound} disabled={!newTitle.trim() || creating}>
                      {creating ? 'Creating...' : 'Create Round'}
                    </button>
                    <button className="work-btn secondary" onClick={() => setShowAddRound(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {roundsLoading ? (
              <p className="work-muted">Loading rounds...</p>
            ) : rounds.length === 0 ? (
              <p className="work-muted">No rounds created yet. Add a round to start the selection process.</p>
            ) : (
              <ul className="work-list">
                {rounds.map((round, idx) => (
                  <li
                    key={round.id}
                    style={{
                      background: selectedRoundId === round.id ? '#f0f7ff' : undefined,
                      borderColor: selectedRoundId === round.id ? '#3b82f6' : undefined,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ margin: '0 0 0.15rem' }}>
                          <span style={{ color: '#6b7280', fontWeight: 400, fontSize: '0.82rem' }}>
                            Round {round.order}:
                          </span>{' '}
                          {round.title}
                        </h3>
                        <p className="work-muted" style={{ fontSize: '0.82rem' }}>
                          {round.candidateCount ?? 0} candidate{(round.candidateCount ?? 0) !== 1 ? 's' : ''}
                          {round.date && (
                            <>
                              {' '}&middot; {new Date(round.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </>
                          )}
                          {round.description && <> &middot; {round.description}</>}
                        </p>
                      </div>
                      <div className="work-row" style={{ flexShrink: 0 }}>
                        <button
                          className="work-btn secondary"
                          onClick={() => loadCandidates(round.id)}
                          title="View candidates"
                        >
                          <Users size={14} /> View
                        </button>
                        {idx === 0 && (
                          <button
                            className="work-btn secondary"
                            onClick={() => handleSeedRound(round.id)}
                            title="Add all applicants to this round"
                          >
                            <RefreshCw size={14} /> Seed
                          </button>
                        )}
                        <button
                          className="work-btn danger"
                          onClick={() => handleDeleteRound(round.id)}
                          title="Delete round"
                          style={{ padding: '0.4rem 0.55rem' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>

          {/* Candidates Panel */}
          {selectedRoundId && (
            <article className="work-card">
              <h2 style={{ margin: '0 0 0.5rem' }}>
                {roundInfo?.title || 'Round'} — Candidates
              </h2>
              {candidatesLoading ? (
                <p className="work-muted">Loading candidates...</p>
              ) : candidates.length === 0 ? (
                <p className="work-muted">
                  No candidates in this round yet.
                  {rounds[0]?.id === selectedRoundId && (
                    <> Click <strong>Seed</strong> on Round 1 to pull in all applicants.</>
                  )}
                </p>
              ) : (
                <ul className="work-list">
                  {candidates.map((c) => {
                    const resumeUrl = c.resumeUrl ? resolveFileUrl(c.resumeUrl) : null
                    const statusColor =
                      c.status === 'cleared' ? '#16a34a' : c.status === 'rejected' ? '#dc2626' : '#d97706'

                    return (
                      <li key={c.id}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{ margin: '0 0 0.15rem' }}>
                              {c.studentName || c.studentEmail}
                            </h3>
                            <p className="work-muted" style={{ fontSize: '0.82rem' }}>
                              {c.studentEmail}
                              {c.enrollmentNumber && <> &middot; #{c.enrollmentNumber}</>}
                            </p>
                            {c.skills && (
                              <p className="work-muted" style={{ fontSize: '0.78rem', marginTop: '0.15rem' }}>
                                Skills: {c.skills.length > 80 ? c.skills.slice(0, 80) + '...' : c.skills}
                              </p>
                            )}
                            <span
                              style={{
                                display: 'inline-block',
                                marginTop: '0.3rem',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: statusColor,
                                background: `${statusColor}12`,
                                border: `1px solid ${statusColor}30`,
                                borderRadius: '999px',
                                padding: '0.1rem 0.55rem',
                                textTransform: 'capitalize',
                              }}
                            >
                              {c.status}
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center', flexShrink: 0 }}>
                            <button
                              className="work-btn secondary"
                              onClick={() => {
                                // Build a minimal PortalApplication for the modal
                                setProfileApp({
                                  id: 0,
                                  jobId: selectedJobId!,
                                  studentId: c.studentId,
                                  status: c.status,
                                  appliedAt: '',
                                  jobTitle: selectedJob?.title || '',
                                  company: selectedJob?.company || '',
                                  studentName: c.studentName || '',
                                  studentEmail: c.studentEmail,
                                  studentPhone: c.studentPhone || undefined,
                                  enrollmentNumber: c.enrollmentNumber || undefined,
                                  profileImage: c.profileImage || undefined,
                                  profile: null, // profile will show contact info at minimum
                                })
                              }}
                            >
                              <User size={14} /> Profile
                            </button>

                            {resumeUrl && (
                              <a
                                href={resumeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="work-btn secondary"
                                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                              >
                                <FileText size={14} /> Resume
                              </a>
                            )}

                            {c.status === 'pending' && (
                              <>
                                <button
                                  className="work-btn"
                                  style={{ background: '#16a34a' }}
                                  onClick={() => handleCandidateAction(selectedRoundId!, c.id, 'cleared')}
                                  disabled={updatingId === c.id}
                                >
                                  <UserCheck size={14} /> {updatingId === c.id ? '...' : 'Clear'}
                                </button>
                                <button
                                  className="work-btn danger"
                                  onClick={() => handleCandidateAction(selectedRoundId!, c.id, 'rejected')}
                                  disabled={updatingId === c.id}
                                >
                                  <XCircle size={14} /> {updatingId === c.id ? '...' : 'Reject'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </article>
          )}
        </>
      )}

      {/* Profile Modal */}
      {profileApp && (
        <ApplicantProfileModal
          application={profileApp}
          onClose={() => setProfileApp(null)}
        />
      )}
    </section>
  )
}

export default CompanyRoundsPage
