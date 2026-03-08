import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const CTASection = () => {
  return (
    <section className="bg-gradient-to-r from-jimsBlue via-jimsBlueDark to-[#957a2a] py-16 text-white">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-white/20 bg-white/10 p-8 text-center backdrop-blur"
        >
          <h2 className="text-3xl font-bold md:text-4xl">Start your placement journey today.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-blue-100">
            Join the platform to streamline registration, job applications, shortlisting, and placement operations.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/register" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-jimsBlue">
              Register as Student
            </Link>
            <Link to="/login" className="rounded-full border border-white/70 px-6 py-3 text-sm font-semibold text-white">
              Recruiter Login
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default CTASection
