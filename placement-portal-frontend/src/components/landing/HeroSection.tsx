import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart3, BriefcaseBusiness, GraduationCap, ShieldCheck } from 'lucide-react'

const floatingCards = [
  { title: 'Students', value: '500+', icon: GraduationCap },
  { title: 'Companies', value: '120+', icon: BriefcaseBusiness },
  { title: 'Offers', value: '300+', icon: BarChart3 },
  { title: 'Placement Rate', value: '95%', icon: ShieldCheck },
]

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#e9f1ff] via-[#eef4ff] to-[#f4e9cc]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-14 top-16 h-44 w-44 rounded-full bg-blue-300/25 blur-2xl animate-drift" />
        <div className="absolute right-10 top-24 h-36 w-36 rounded-full bg-amber-300/25 blur-2xl animate-drift" />
        <div className="absolute bottom-10 right-1/3 h-24 w-24 rounded-full bg-blue-400/20 blur-xl animate-pulse" />
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl gap-14 px-4 pb-20 pt-16 md:px-8 md:pb-24 lg:grid-cols-2 lg:items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-4 inline-flex rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-jimsBlue">
            JIMS Placement Platform
          </p>
          <h1 className="text-4xl font-extrabold leading-tight text-slate-900 md:text-5xl lg:text-6xl">
            JIMS Rohini Sector-5 Placement & Internship Management System
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            A centralized platform for students, recruiters, and TPOs to manage campus placements efficiently.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/register"
                className="inline-flex items-center rounded-full bg-gradient-to-r from-jimsBlue to-jimsGold px-7 py-3 text-sm font-semibold text-white shadow-glow"
              >
                Get Started
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/login"
                className="inline-flex items-center rounded-full border border-blue-200 bg-white px-7 py-3 text-sm font-semibold text-jimsBlue transition hover:border-blue-300"
              >
                Sign In
              </Link>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative"
        >
          <div className="rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-xl backdrop-blur md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-jimsBlue">Live Dashboard Snapshot</p>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Online</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {floatingCards.map((card) => (
                <div key={card.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <card.icon className="mb-2 h-5 w-5 text-jimsBlue" />
                  <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                  <p className="text-sm text-slate-500">{card.title}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute -bottom-5 -right-4 hidden rounded-2xl border border-amber-100 bg-white p-3 shadow-lg md:block animate-float">
            <p className="text-xs font-semibold uppercase tracking-wide text-jimsBlue">Next Drive</p>
            <p className="text-sm font-medium text-slate-700">12 Companies this month</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default HeroSection
