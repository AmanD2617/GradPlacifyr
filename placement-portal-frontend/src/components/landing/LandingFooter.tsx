import { Link } from 'react-router-dom'
import jimsLogo from '../../assets/jims-logo.png'

const footerLinks = [
  { label: 'About', to: '/about' },
  { label: 'Process', to: '/recruitment-process' },
  { label: 'Statistics', to: '/placement-statistics' },
  { label: 'Contact', to: '/contact' },
  { label: 'Privacy Policy', to: '/contact' },
]

const LandingFooter = () => {
  return (
    <footer className="border-t border-slate-200 bg-white py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 md:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <img src={jimsLogo} alt="JIMS Rohini Sector-5" className="h-12 w-auto" />
          <p className="text-sm text-slate-600">
            JIMS Rohini Sector-5 Placement Portal
            <br />
            Modernized campus placement operations
          </p>
        </div>
        <nav className="flex flex-wrap gap-3 text-sm text-slate-600">
          {footerLinks.map((item) => (
            <Link key={item.label} to={item.to} className="rounded-full px-3 py-1 transition hover:bg-blue-50 hover:text-jimsBlue">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}

export default LandingFooter
