import { Link } from 'react-router-dom'
import { Linkedin, Instagram, Youtube, Phone, Mail, Globe, MapPin } from 'lucide-react'
import jimsLogo from '../../assets/jims-logo.png'

const usefulLinks = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Process', to: '/recruitment-process' },
  { label: 'Statistics', to: '/placement-statistics' },
  { label: 'Contact', to: '/contact' },
]

const directLinks = [
  { label: 'Student Login', to: '/login?role=student' },
  { label: 'Recruiter Login', to: '/login?role=recruiter' },
  { label: 'Admin Login', to: '/login?role=admin' },
  { label: 'Role Selection', to: '/role-selection' },
]

const socialLinks = [
  { icon: Linkedin, href: 'https://www.linkedin.com/school/jagan-institute-of-management-studies/', label: 'LinkedIn' },
  { icon: Instagram, href: 'https://www.instagram.com/jimsrohinisector5/', label: 'Instagram' },
  { icon: Youtube, href: 'https://www.youtube.com/@JIMSRohiniSector5', label: 'YouTube' },
]

const LandingFooter = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-gray-400">
      {/* ── Main grid ── */}
      <div className="mx-auto w-full max-w-[1440px] px-6 py-14 md:px-12 md:py-16 lg:px-16 xl:px-20">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Column 1 — Organization */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={jimsLogo} alt="JIMS Rohini" className="h-12 w-auto rounded-lg bg-white p-1.5" />
              <span className="text-lg font-bold text-white">JIMS Rohini</span>
            </div>
            <p className="text-sm leading-relaxed">
              Jagan Institute of Management Studies
              <br />
              3, Near Rithala Metro Station
              <br />
              Rohini Sector 5, Institutional Area
              <br />
              New Delhi, Delhi 110085, India
            </p>
            <div className="flex gap-3 pt-1">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-gray-400 transition-all duration-300 hover:bg-white/20 hover:text-white"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2 — Useful Links */}
          <div>
            <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">
              Useful Links
            </h4>
            <ul className="space-y-3">
              {usefulLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-400 transition-colors duration-200 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Direct Links */}
          <div>
            <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">
              Direct Links
            </h4>
            <ul className="space-y-3">
              {directLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-400 transition-colors duration-200 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Contact & Map */}
          <div className="space-y-5">
            <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-white">
              Contact Us
            </h4>
            <ul className="space-y-3.5 text-sm">
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                <a href="tel:+911145184100" className="transition-colors duration-200 hover:text-white">
                  +91-11-45184100
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                <a href="mailto:placement@jimsindia.org" className="transition-colors duration-200 hover:text-white">
                  placement@jimsindia.org
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                <a href="https://www.jimsindia.org" target="_blank" rel="noopener noreferrer" className="transition-colors duration-200 hover:text-white">
                  www.jimsindia.org
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                <span>3, Institutional Area, Sector-5, Rohini, New Delhi</span>
              </li>
            </ul>

            {/* Map */}
            <div className="group relative w-full overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <iframe
                title="JIMS Rohini Sector-5 Location"
                src="https://www.google.com/maps?q=Jagan+Institute+of+Management+Studies+JIMS+Rohini+Sector+5&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen={false}
                className="block h-40 w-full border-0 grayscale transition-all duration-500 group-hover:grayscale-0"
              />
              <a
                href="https://www.google.com/maps/search/?api=1&query=Jagan+Institute+of+Management+Studies+JIMS+Rohini+Sector+5"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gray-900/80 py-1.5 text-[11px] font-medium text-gray-200 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100"
              >
                <MapPin className="h-3 w-3" />
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-gray-500 md:flex-row md:px-12 lg:px-16 xl:px-20">
          <span>&copy; {currentYear} JIMS Rohini Sector-5. All rights reserved.</span>
          <span>Placement &amp; Internship Management System — GradPlacifyr</span>
        </div>
      </div>
    </footer>
  )
}

export default LandingFooter
