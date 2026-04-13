import { motion } from 'framer-motion'
import { MapPin, IndianRupee, Clock, Wifi } from 'lucide-react'
import { Link } from 'react-router-dom'

export interface JobCardData {
  id: number
  title: string
  company: string
  ctc: string | null
  location: string | null
  deadline?: string
  employmentType?: string
  status: 'open' | 'applied' | 'closed'
}

interface JobOpportunityCardProps {
  job: JobCardData
  onApply?: (jobId: number) => void
}

function statusBadge(status: string) {
  switch (status) {
    case 'applied':
      return { label: 'Applied', className: 'job-badge job-badge-applied' }
    case 'closed':
      return { label: 'Closed', className: 'job-badge job-badge-closed' }
    default:
      return { label: 'Open', className: 'job-badge job-badge-open' }
  }
}

function companyInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

const LOGO_COLORS = [
  '#1f4b9c',
  '#059669',
  '#d97706',
  '#7c3aed',
  '#dc2626',
  '#0891b2',
  '#be185d',
  '#4f46e5',
]

function logoColor(company: string) {
  let hash = 0
  for (let i = 0; i < company.length; i++) hash = company.charCodeAt(i) + ((hash << 5) - hash)
  return LOGO_COLORS[Math.abs(hash) % LOGO_COLORS.length]
}

function formatDeadline(deadline?: string) {
  if (!deadline) return null
  const d = new Date(deadline)
  const now = new Date()
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'Expired'
  if (diff === 0) return 'Today'
  if (diff <= 7) return `${diff}d left`
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

const JobOpportunityCard = ({ job, onApply }: JobOpportunityCardProps) => {
  const badge = statusBadge(job.status)
  const color = logoColor(job.company)
  const deadlineText = formatDeadline(job.deadline)

  return (
    <motion.article
      className="job-opp-card"
      whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(15, 32, 62, 0.14)' }}
      transition={{ duration: 0.2 }}
    >
      {/* Header: Logo + Badge */}
      <div className="job-opp-header">
        <span className="job-opp-logo" style={{ background: color }}>
          {companyInitials(job.company)}
        </span>
        <span className={badge.className}>
          {badge.label === 'Applied' && <span className="job-badge-check">&#10003;</span>}
          {badge.label}
        </span>
      </div>

      {/* Info */}
      <div className="job-opp-body">
        <h3 className="job-opp-title">{job.title}</h3>
        <p className="job-opp-company">{job.company}</p>

        <div className="job-opp-tags">
          {job.ctc && (
            <span className="job-opp-tag">
              <IndianRupee size={12} /> {job.ctc} LPA
            </span>
          )}
          {job.location && (
            <span className="job-opp-tag">
              <MapPin size={12} /> {job.location}
            </span>
          )}
          {job.employmentType?.toLowerCase().includes('remote') && (
            <span className="job-opp-tag job-opp-tag-remote">
              <Wifi size={12} /> Remote
            </span>
          )}
          {deadlineText && (
            <span className="job-opp-tag">
              <Clock size={12} /> {deadlineText}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="job-opp-actions">
        <Link to={`/student/jobs/${job.id}`} className="job-opp-btn job-opp-btn-secondary">
          Open
        </Link>
        {job.status === 'applied' ? (
          <span className="job-opp-btn job-opp-btn-applied">&#10003; Applied</span>
        ) : job.status === 'closed' ? (
          <span className="job-opp-btn job-opp-btn-disabled">Closed</span>
        ) : (
          <button
            type="button"
            className="job-opp-btn job-opp-btn-primary"
            onClick={() => onApply?.(job.id)}
          >
            Apply
          </button>
        )}
      </div>
    </motion.article>
  )
}

export default JobOpportunityCard
