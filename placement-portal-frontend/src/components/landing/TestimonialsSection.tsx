import { motion } from 'framer-motion'
import SectionHeading from './SectionHeading'

const testimonials = [
  {
    quote: 'GradPlacifyr simplified our campus hiring process and improved candidate visibility.',
    name: 'Riya Sharma',
    role: 'Talent Acquisition Lead',
  },
  {
    quote: 'The dashboard made tracking applications and interview rounds far easier for our TPO team.',
    name: 'Amit Verma',
    role: 'Placement Coordinator',
  },
  {
    quote: 'I could manage my profile, applications, and interview schedule in one place.',
    name: 'Kunal Mehta',
    role: 'Final Year Student',
  },
]

const TestimonialsSection = () => {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
        <SectionHeading
          eyebrow="Testimonials"
          title="What our users say"
          subtitle="Feedback from students, recruiters, and placement professionals."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <motion.article
              key={item.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <p className="text-sm leading-relaxed text-slate-700">"{item.quote}"</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-jimsBlue to-jimsGold text-sm font-bold text-white">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.role}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TestimonialsSection
