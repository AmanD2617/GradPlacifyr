import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import './DashboardLayout.css'

interface DashboardLayoutProps {
  title: string
  subtitle: string
  kpis: ReactNode
  analytics: ReactNode
  activity: ReactNode
  quickActions: ReactNode
  insights: ReactNode
  error?: string | null
}

interface SectionCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  collapsible?: boolean
}

const SectionCard = ({ title, subtitle, children, collapsible = true }: SectionCardProps) => {
  if (!collapsible) {
    return (
      <section className="dashboard-section">
        <div className="dashboard-section-head">
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div>{children}</div>
      </section>
    )
  }

  return (
    <details className="dashboard-section dashboard-section-collapsible" open>
      <summary>
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </summary>
      <div>{children}</div>
    </details>
  )
}

const DashboardLayout = ({
  title,
  subtitle,
  kpis,
  analytics,
  activity,
  quickActions,
  insights,
  error,
}: DashboardLayoutProps) => {
  return (
    <div className="dashboard-shell">
      <motion.header
        className="dashboard-hero"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </motion.header>

      <AnimatePresence>
        {error && (
          <motion.div
            className="dashboard-error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <section className="dashboard-kpi-grid">{kpis}</section>

      <div className="dashboard-grid">
        <div className="dashboard-col-main">
          <SectionCard title="Analytics" subtitle="Performance and trend insights" collapsible={false}>
            {analytics}
          </SectionCard>
          <SectionCard title="Quick Actions" subtitle="Common tasks to keep workflows moving">
            {quickActions}
          </SectionCard>
        </div>
        <div className="dashboard-col-side">
          <SectionCard title="Activity & Notifications" subtitle="Recent events and updates">
            {activity}
          </SectionCard>
          <SectionCard title="Recommendations" subtitle="Smart suggestions to improve outcomes">
            {insights}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
