import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import './DashboardLayout.css'

interface DashboardLayoutProps {
  title: string
  subtitle: string
  greeting?: string
  kpis: ReactNode
  analytics: ReactNode
  calendar?: ReactNode
  activity: ReactNode
  quickActions: ReactNode
  insights: ReactNode
  error?: string | null
  /** When true, analytics/quick-actions/activity/insights stack beside calendar
   *  instead of below it. Best for student dashboards with compact analytics. */
  compactLayout?: boolean
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
  greeting,
  kpis,
  analytics,
  calendar,
  activity,
  quickActions,
  insights,
  error,
  compactLayout = false,
}: DashboardLayoutProps) => {
  // ── Compact mode: Calendar left, everything else stacked right ──
  if (calendar && compactLayout) {
    return (
      <div className="dashboard-shell">
        <motion.header
          className="dashboard-hero"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h1>{greeting || title}</h1>
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

        {/* ── Row 1: Calendar left · Quick Actions right (height-matched) ── */}
        <div className="dashboard-split-row">
          <section className="dashboard-calendar-slot">{calendar}</section>
          <SectionCard title="Quick Actions" subtitle="Common tasks to keep workflows moving">
            {quickActions}
          </SectionCard>
        </div>

        {/* ── Row 2: Remaining sections in standard two-column grid ── */}
        <div className="dashboard-grid">
          <div className="dashboard-col-main">
            <SectionCard title="Analytics" subtitle="Performance and trend insights" collapsible={false}>
              {analytics}
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

  // ── Default mode: Calendar full-width above, then two-column grid ──
  return (
    <div className="dashboard-shell">
      <motion.header
        className="dashboard-hero"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1>{greeting || title}</h1>
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

      {/* Calendar renders its own premium wrapper — no SectionCard needed */}
      {calendar && (
        <section className="dashboard-calendar-slot">
          {calendar}
        </section>
      )}

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
