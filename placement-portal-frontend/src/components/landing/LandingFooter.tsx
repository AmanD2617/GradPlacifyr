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
    <footer className="bg-slate-900 text-slate-300">
      {/* Main grid */}
      <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 md:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Column 1 — Organization */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={jimsLogo} alt="JIMS Rohini" className="h-12 w-auto rounded bg-white p-1" />
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
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition hover:bg-jimsBlue hover:text-white"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2 — Useful Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Useful Links
            </h4>
            <ul className="space-y-2.5">
              {usefulLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm transition hover:text-white hover:underline hover:underline-offset-4"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Direct Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Direct Links
            </h4>
            <ul className="space-y-2.5">
              {directLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm transition hover:text-white hover:underline hover:underline-offset-4"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Contact & Map */}
          <div className="space-y-4">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Contact Us
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-jimsBlue" />
                <a href="tel:+911145184100" className="transition hover:text-white hover:underline hover:underline-offset-4">
                  +91-11-45184100
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-jimsBlue" />
                <a href="mailto:placement@jimsindia.org" className="transition hover:text-white hover:underline hover:underline-offset-4">
                  placement@jimsindia.org
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-jimsBlue" />
                <a href="https://www.jimsindia.org" target="_blank" rel="noopener noreferrer" className="transition hover:text-white hover:underline hover:underline-offset-4">
                  www.jimsindia.org
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-jimsBlue" />
                <span>3, Institutional Area, Sector-5, Rohini, New Delhi</span>
              </li>
            </ul>

            {/* Embedded Map — JIMS Rohini Sector 5, Near Rithala Metro Station */}
            <div className="overflow-hidden rounded-lg border border-slate-700">
              <iframe
                title="JIMS Rohini Sector-5 Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3499.0179253573906!2d77.1087901!3d28.719010299999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d014e7953d073%3A0xa1df99c8551f3812!2sJagan%20Institute%20of%20Management%20Studies%20-%20JIMS%20Rohini!5e0!3m2!1sen!2sin!4v1774938761292!5m2!1sen!2sin"
                width="100%"
                height="140"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale transition hover:grayscale-0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-slate-500 md:flex-row md:px-8">
          <span>&copy; {currentYear} JIMS Rohini Sector-5. All rights reserved.</span>
          <span>
            Placement &amp; Internship Management System — GradPlacifyr
          </span>
        </div>
      </div>
    </footer>
  )
}

export default LandingFooter
