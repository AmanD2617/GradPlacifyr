import { motion } from 'framer-motion'
import { BarChart3, BriefcaseBusiness, CalendarClock, LayoutDashboard, Sparkles } from 'lucide-react'
import SectionHeading from './SectionHeading'

const features = [
  {
    title: 'Student Dashboard',
    description: 'Track applications, shortlist status, interview timelines, and profile readiness in one place.',
    icon: LayoutDashboard,
  },
  {
    title: 'Recruiter Management',
    description: 'Post openings, review applicants, and shortlist candidates with structured workflows.',
    icon: BriefcaseBusiness,
  },
  {
    title: 'AI Resume Builder',
    description: 'Generate better profile drafts and extract structured resume insights using AI.',
    icon: Sparkles,
  },
  {
    title: 'Interview Scheduling',
    description: 'Organize assessment and interview rounds with clear status updates for all stakeholders.',
    icon: CalendarClock,
  },
  {
    title: 'Placement Analytics',
    description: 'View role-based dashboards with KPI cards, trends, and placement funnel analytics.',
    icon: BarChart3,
  },
]

const FeaturesSection = () => {
  return (
    <section className="bg-gradient-to-b from-[#f8fbff] to-[#edf2ff] py-16 md:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
        <SectionHeading
          eyebrow="Features"
          title="Built for students, recruiters, and placement teams"
          subtitle="A modern SaaS-style platform tailored for university placement operations."
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.04 }}
              whileHover={{ y: -6 }}
              className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg"
            >
              <div className="mb-4 inline-flex rounded-xl bg-blue-50 p-2.5 text-jimsBlue">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection
