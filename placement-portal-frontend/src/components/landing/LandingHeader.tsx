import { Link } from 'react-router-dom'
import jimsLogo from '../../assets/jims-logo.png'

const navItems = [
  { label: 'About', to: '/about' },
  { label: 'Process', to: '/recruitment-process' },
  { label: 'Statistics', to: '/placement-statistics' },
  { label: 'Contact', to: '/contact' },
  { label: 'Role Selection', to: '/role-selection' },
]

const LandingHeader = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        <Link to="/" className="shrink-0">
          <img src={jimsLogo} alt="JIMS Rohini Sector-5" className="h-12 w-auto md:h-14" />
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-jimsBlue"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <Link to="/role-selection" className="rounded-full border border-blue-200 px-3 py-1.5 text-sm font-medium text-jimsBlue">
            Roles
          </Link>
        </div>
      </div>
    </header>
  )
}

export default LandingHeader
