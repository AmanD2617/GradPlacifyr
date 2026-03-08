import { motion } from 'framer-motion'
import { BadgeCheck, Briefcase, CalendarClock, FileText, ListChecks, UserPlus } from 'lucide-react'
import SectionHeading from './SectionHeading'

const steps = [
  { title: 'Student Registration', icon: UserPlus },
  { title: 'Profile & Resume Upload', icon: FileText },
  { title: 'Company Job Posting', icon: Briefcase },
  { title: 'Applications & Shortlisting', icon: ListChecks },
  { title: 'Interview Scheduling', icon: CalendarClock },
  { title: 'Final Placement', icon: BadgeCheck },
]

const ProcessSection = () => {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
        <SectionHeading
          eyebrow="Placement Process"
          title="A structured pathway from registration to final placement"
          subtitle="Transparent, stage-driven workflow for all stakeholders."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              className="relative rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <span className="absolute right-4 top-4 text-xs font-bold text-jimsGold">Step {index + 1}</span>
              <step.icon className="mb-3 h-6 w-6 text-jimsBlue" />
              <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ProcessSection
