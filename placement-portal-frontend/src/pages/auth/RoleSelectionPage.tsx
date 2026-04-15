import { Link } from 'react-router-dom'
import { GraduationCap, Briefcase, ClipboardList, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import './Auth.css'

interface RoleOption {
  key: string
  label: string
  subtitle: string
  accent: string
  icon: LucideIcon
  /** Hex color for the icon circle background */
  iconBg: string
  /** Hex color for the top border */
  borderColor: string
}

const roles: RoleOption[] = [
  {
    key: 'student',
    label: 'Student',
    subtitle: 'Placements, internships and career services',
    accent: 'student',
    icon: GraduationCap,
    iconBg: '#2563eb',
    borderColor: '#2563eb',
  },
  {
    key: 'recruiter',
    label: 'Company / Recruiter',
    subtitle: 'Job postings and campus hiring',
    accent: 'recruiter',
    icon: Briefcase,
    iconBg: '#059669',
    borderColor: '#059669',
  },
  {
    key: 'tpo',
    label: 'TPO',
    subtitle: 'Training & placement coordination',
    accent: 'tpo',
    icon: ClipboardList,
    iconBg: '#0369a1',
    borderColor: '#0369a1',
  },
  {
    key: 'admin',
    label: 'Admin',
    subtitle: 'System management and oversight',
    accent: 'admin',
    icon: ShieldCheck,
    iconBg: '#7c3aed',
    borderColor: '#7c3aed',
  },
]

const RoleSelectionPage = () => {
  return (
    <div className="role-selection-root">
      <div className="role-selection-backdrop" />
      <section className="role-selection-modal" aria-label="Select login type">
        <Link to="/" className="role-close-btn" aria-label="Close">
          x
        </Link>
        <h2 className="role-selection-title">Select Login Type</h2>
        <p className="role-selection-subtitle">Select your portal to continue</p>

        <div className="role-grid">
          {roles.map((role) => {
            const Icon = role.icon
            return (
              <Link
                key={role.key}
                to={`/login?role=${role.key}`}
                className={`role-card ${role.accent}`}
              >
                <span
                  className="role-icon"
                  aria-hidden="true"
                  style={{ background: role.iconBg }}
                >
                  <Icon size={24} strokeWidth={2} color="#ffffff" />
                </span>
                <span className="role-label">{role.label}</span>
                <span className="role-text">{role.subtitle}</span>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default RoleSelectionPage
