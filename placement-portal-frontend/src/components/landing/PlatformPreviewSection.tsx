import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import SectionHeading from './SectionHeading'

const previews = [
  {
    title: 'Student Dashboard',
    detail: 'Applications, profile strength, and interview readiness in one view.',
    accent: 'from-blue-100 to-blue-50',
  },
  {
    title: 'Company Dashboard',
    detail: 'Track applicants, shortlist candidates, and monitor recruitment pipeline.',
    accent: 'from-amber-100 to-amber-50',
  },
  {
    title: 'Admin Dashboard',
    detail: 'Institution-level analytics for students, companies, and placements.',
    accent: 'from-indigo-100 to-slate-100',
  },
]

const PlatformPreviewSection = () => {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % previews.length)
    }, 2800)

    return () => clearInterval(timer)
  }, [])

  return (
    <section className="bg-gradient-to-b from-[#edf2ff] to-[#f8fbff] py-16 md:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
        <SectionHeading
          eyebrow="Platform Preview"
          title="Role-specific dashboards designed for clarity and speed"
          subtitle="Preview the key interfaces used during the placement lifecycle."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {previews.map((preview, index) => (
            <motion.button
              key={preview.title}
              type="button"
              onClick={() => setActive(index)}
              className={`rounded-3xl border p-5 text-left transition ${
                active === index
                  ? 'border-jimsBlue bg-white shadow-lg'
                  : 'border-slate-200 bg-white/75 hover:border-blue-200'
              }`}
              whileHover={{ y: -4 }}
            >
              <div className={`mb-4 h-36 rounded-2xl bg-gradient-to-br ${preview.accent} p-4`}>
                <div className="h-3 w-1/3 rounded-full bg-jimsBlue/60" />
                <div className="mt-3 h-20 rounded-xl border border-white/70 bg-white/70" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{preview.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{preview.detail}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PlatformPreviewSection
