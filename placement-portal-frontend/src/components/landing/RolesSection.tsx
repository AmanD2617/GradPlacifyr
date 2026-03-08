import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Building2, GraduationCap, ShieldCheck } from 'lucide-react'
import SectionHeading from './SectionHeading'

const roles = [
  {
    title: 'Student Portal',
    description: 'Apply for opportunities, track status, and manage your placement profile.',
    to: '/login?role=student',
    icon: GraduationCap,
    accent: 'from-blue-50 to-blue-100',
  },
  {
    title: 'Recruiter Portal',
    description: 'Post jobs, shortlist candidates, and manage interview pipeline.',
    to: '/login?role=recruiter',
    icon: Building2,
    accent: 'from-amber-50 to-amber-100',
  },
  {
    title: 'TPO / Admin Portal',
    description: 'Monitor drives, review analytics, and manage institutional operations.',
    to: '/login?role=admin',
    icon: ShieldCheck,
    accent: 'from-indigo-50 to-slate-100',
  },
]

const RolesSection = () => {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
        <SectionHeading
          eyebrow="Role Selection"
          title="Choose your portal to continue"
          subtitle="Role-based access keeps student, recruiter, and placement operations organized and secure."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {roles.map((role, idx) => (
            <motion.article
              key={role.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: idx * 0.05 }}
              whileHover={{ y: -5 }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className={`mb-4 rounded-xl bg-gradient-to-br ${role.accent} p-3 w-fit`}>
                <role.icon className="h-6 w-6 text-jimsBlue" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{role.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{role.description}</p>
              <Link
                to={role.to}
                className="mt-5 inline-flex rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-jimsBlue transition hover:border-blue-300 hover:bg-blue-50"
              >
                Continue as {role.title.replace(' Portal', '')}
              </Link>
            </motion.article>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Link to="/role-selection" className="text-sm font-semibold text-jimsBlue underline-offset-4 hover:underline">
            Open full role selection
          </Link>
        </div>
      </div>
    </section>
  )
}

export default RolesSection
