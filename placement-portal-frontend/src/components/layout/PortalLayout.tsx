import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth, type Role } from '../../context/AuthContext'
import { getMyProfile, type StudentProfile } from '../../api/profile'
import jimsLogo from '../../assets/jims-logo.png'
import './PortalLayout.css'

interface NavItem {
  label: string
  to: string
}

const navByRole: Record<Role, NavItem[]> = {
  student: [
    { label: 'Dashboard', to: '/student/dashboard' },
    { label: 'My Profile', to: '/student/profile' },
    { label: 'Upload Resume', to: '/student/upload-resume' },
    { label: 'Available Opportunities', to: '/student/jobs' },
    { label: 'Applied Jobs', to: '/student/applied-jobs' },
    { label: 'Interview Schedule', to: '/student/interview-schedule' },
  ],
  recruiter: [
    { label: 'Ongoing Sessions', to: '/company/dashboard' },
    { label: 'Company Profile', to: '/company/profile' },
    { label: 'Create JNF / TNF', to: '/company/post-job' },
    { label: 'Manage Openings', to: '/company/manage-jobs' },
    { label: 'View Applicants', to: '/company/applicants' },
    { label: 'Shortlist Candidates', to: '/company/shortlist' },
    { label: 'Upload Final Results', to: '/company/upload-results' },
  ],
  admin: [
    { label: 'Admin Dashboard', to: '/admin/dashboard' },
    { label: 'Manage Students', to: '/admin/manage-students' },
    { label: 'Manage Companies', to: '/admin/manage-companies' },
    { label: 'Approve JNF / TNF', to: '/admin/approve-jobs' },
    { label: 'Monitor Applications', to: '/admin/monitor-applications' },
    { label: 'Placement Reports', to: '/admin/reports' },
  ],
  hod: [
    { label: 'Admin Dashboard', to: '/admin/dashboard' },
    { label: 'Placement Reports', to: '/admin/reports' },
  ],
}

/* ── Compute profile completion % from filled fields ── */
function computeCompletion(p: StudentProfile | null): number {
  if (!p) return 0
  const fields: Array<string | number | null | undefined> = [
    p.tenthPercentage,
    p.twelfthPercentage,
    p.backlogs != null ? String(p.backlogs) : null,
    p.graduationYear,
    p.programmingLanguages,
    p.frameworks,
    p.tools,
    p.certifications,
    p.internshipExperience,
    p.achievements,
    p.githubUrl,
    p.linkedinUrl,
    p.portfolioUrl,
  ]
  const filled = fields.filter((v) => v != null && String(v).trim() !== '').length
  return Math.round((filled / fields.length) * 100)
}

/* ── SVG completion ring ── */
const CompletionRing = ({ percent, size = 44 }: { percent: number; size?: number }) => {
  const stroke = 3
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <svg
      className="avatar-ring"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
    >
      {/* background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={stroke}
      />
      {/* progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#22c55e"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

const API_ORIGIN = 'http://localhost:3000'

const PortalLayout = () => {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [completion, setCompletion] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const navItems = useMemo(() => {
    if (!user) return []
    return navByRole[user.role]
  }, [user])

  /* ── Fetch profile completion (students only) ── */
  useEffect(() => {
    if (user?.role === 'student') {
      getMyProfile()
        .then((p) => setCompletion(computeCompletion(p)))
        .catch(() => setCompletion(0))
    }
  }, [user])

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    if (profileOpen) {
      document.addEventListener('mousedown', handler)
    }
    return () => document.removeEventListener('mousedown', handler)
  }, [profileOpen])

  const profilePathByRole: Record<Role, string> = {
    student: '/student/profile',
    recruiter: '/company/profile',
    admin: '/admin/profile',
    hod: '/admin/profile',
  }

  const changePasswordPathByRole: Record<Role, string> = {
    student: '/student/change-password',
    recruiter: '/company/change-password',
    admin: '/admin/change-password',
    hod: '/admin/change-password',
  }

  /* ── Initials from user name ── */
  const initials = useMemo(() => {
    if (!user?.name) return '?'
    const parts = user.name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }, [user])

  const toggleDropdown = useCallback(() => setProfileOpen((v) => !v), [])

  return (
    <div className="portal-shell">
      {/* ── Dark overlay ── */}
      <div
        className={`portal-overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Right-side drawer ── */}
      <aside className={`portal-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="portal-drawer-header">
          <button
            type="button"
            className="portal-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="portal-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `portal-nav-link ${isActive ? 'active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="portal-sidebar-footer">
          <button className="portal-logout-btn" onClick={logout} type="button">
            Log Out
          </button>
        </div>
      </aside>

      {/* ── Main content area (full-width) ── */}
      <div className="portal-main-wrap">
        <header className="portal-topbar">
          <img src={jimsLogo} alt="JIMS Rohini Sector-5" className="portal-topbar-logo" />
          <div className="portal-topbar-right">
            {/* ── Avatar + Dropdown ── */}
            <div className="portal-profile-wrap" ref={dropdownRef}>
              <button
                type="button"
                className="portal-avatar-btn"
                onClick={toggleDropdown}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                aria-label="Profile menu"
              >
                <CompletionRing percent={completion} size={44} />
                {user?.profileImage ? (
                  <img
                    src={`${API_ORIGIN}${user.profileImage}`}
                    alt={user.name}
                    className="portal-avatar-img"
                  />
                ) : (
                  <span className="portal-avatar-initials">{initials}</span>
                )}

                {/* ── Hover tooltip ── */}
                {hovered && !profileOpen && (
                  <span className="portal-avatar-tooltip">
                    Profile Completion: {completion}%
                  </span>
                )}
              </button>

              {/* ── Dropdown menu ── */}
              {profileOpen && user && (
                <div className="portal-profile-dropdown">
                  {/* user info header */}
                  <div className="portal-dropdown-header">
                    <span className="portal-dropdown-name">{user.name}</span>
                    <span className="portal-dropdown-email">{user.email}</span>
                    {user.role === 'student' && (
                      <div className="portal-dropdown-bar-wrap">
                        <div className="portal-dropdown-bar">
                          <div
                            className="portal-dropdown-bar-fill"
                            style={{ width: `${completion}%` }}
                          />
                        </div>
                        <span className="portal-dropdown-bar-label">{completion}% complete</span>
                      </div>
                    )}
                  </div>

                  <div className="portal-dropdown-divider" />

                  <Link
                    to={profilePathByRole[user.role]}
                    className="portal-dropdown-item"
                    onClick={() => setProfileOpen(false)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    My Profile
                  </Link>
                  <Link
                    to={changePasswordPathByRole[user.role]}
                    className="portal-dropdown-item"
                    onClick={() => setProfileOpen(false)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Change Password
                  </Link>

                  <div className="portal-dropdown-divider" />

                  <button
                    type="button"
                    className="portal-dropdown-item portal-dropdown-logout"
                    onClick={() => {
                      setProfileOpen(false)
                      logout()
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Log Out
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              className="portal-menu-btn"
              onClick={() => setSidebarOpen((v) => !v)}
            >
              ☰
            </button>
          </div>
        </header>

        <main className="portal-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default PortalLayout
