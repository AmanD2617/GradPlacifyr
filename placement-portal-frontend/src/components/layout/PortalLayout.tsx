import { useMemo, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth, type Role } from '../../context/AuthContext'
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
    { label: 'Edit Profile', to: '/student/edit-profile' },
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
    { label: 'TPO Dashboard', to: '/tpo/dashboard' },
    { label: 'Approve JNF / TNF', to: '/tpo/approve-jobs' },
    { label: 'Monitor Applications', to: '/tpo/monitor-applications' },
    { label: 'Placement Reports', to: '/tpo/reports' },
    { label: 'Admin Dashboard', to: '/admin/dashboard' },
    { label: 'Manage Students', to: '/admin/manage-students' },
    { label: 'Manage Companies', to: '/admin/manage-companies' },
  ],
  hod: [
    { label: 'Placement Reports', to: '/tpo/reports' },
    { label: 'Admin Dashboard', to: '/admin/dashboard' },
  ],
}

const PortalLayout = () => {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const navItems = useMemo(() => {
    if (!user) return []
    return navByRole[user.role]
  }, [user])

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

  return (
    <div className="portal-shell">
      <aside className={`portal-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="portal-brand">
          <img className="portal-logo-image" src={jimsLogo} alt="JIMS Rohini Sector-5" />
          <div>
            <p className="portal-brand-title">JIMS Rohini Sector-5</p>
            <p className="portal-brand-subtitle">{user?.role?.toUpperCase()} PLACEMENT PORTAL</p>
          </div>
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

      <div
        className={`portal-overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className="portal-main-wrap">
        <header className="portal-topbar">
          <button
            type="button"
            className="portal-menu-btn"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            ☰
          </button>
          <div className="portal-topbar-right">
            <p className="portal-welcome">Hi, {user?.name ?? 'User'}</p>
            <div className="portal-profile-wrap">
              <button
                type="button"
                className="portal-profile-btn"
                onClick={() => setProfileOpen((v) => !v)}
              >
                Profile
              </button>
              {profileOpen && user && (
                <div className="portal-profile-dropdown">
                  <Link to={profilePathByRole[user.role]} onClick={() => setProfileOpen(false)}>
                    My Profile
                  </Link>
                  <Link to={changePasswordPathByRole[user.role]} onClick={() => setProfileOpen(false)}>
                    Change Password
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false)
                      logout()
                    }}
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
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

