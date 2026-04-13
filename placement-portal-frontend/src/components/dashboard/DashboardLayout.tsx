import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import './DashboardLayout.css'

interface HeroMiniStat {
  label: string
  value: string | number
}

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
  /** When true, uses the premium command-center layout (70/30 grid) */
  compactLayout?: boolean
  /** CSS gradient string to override the hero banner colour per role */
  heroGradient?: string
  /** lucide-react icon component to show beside the title in the hero */
  roleIcon?: LucideIcon
  /** Primary content section above the main grid (e.g. Job Opportunities, Charts) */
  primaryContent?: ReactNode
  /** Title for the primary content section */
  primaryContentTitle?: string
  /** Subtitle for the primary content section */
  primaryContentSubtitle?: string
  /** Header-right element for primary content (e.g. "View All" link) */
  primaryContentHeaderRight?: ReactNode
  /** Readiness / status label shown in the hero badge */
  readinessLabel?: string
  /** Progress percentage shown in the hero (0-100) */
  readinessPercent?: number
  /** Right-side glassmorphism stat cards in the hero */
  heroStats?: HeroMiniStat[]
  /** @deprecated Use primaryContent + primaryContentTitle instead */
  jobOpportunities?: ReactNode
  /** @deprecated Use primaryContentHeaderRight instead */
  viewAllJobsLink?: string
  /** Custom title for the analytics section (default: "Analytics") */
  analyticsTitle?: string
  /** Custom subtitle for the analytics section */
  analyticsSubtitle?: string
  /** Custom title for the activity section (default: "Recent Activity") */
  activityTitle?: string
  /** Custom subtitle for the activity section */
  activitySubtitle?: string
}

interface SectionCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  collapsible?: boolean
  headerRight?: ReactNode
  className?: string
}

const SectionCard = ({
  title,
  subtitle,
  children,
  collapsible = true,
  headerRight,
  className = '',
}: SectionCardProps) => {
  if (!collapsible) {
    return (
      <section className={`dashboard-section ${className}`}>
        <div className="dashboard-section-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {headerRight}
        </div>
        <div>{children}</div>
      </section>
    )
  }

  return (
    <details className={`dashboard-section dashboard-section-collapsible ${className}`} open>
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
  heroGradient,
  roleIcon: RoleIcon,
  primaryContent,
  primaryContentTitle,
  primaryContentSubtitle,
  primaryContentHeaderRight,
  readinessLabel,
  readinessPercent,
  heroStats,
  // deprecated compat
  jobOpportunities,
  viewAllJobsLink,
  // configurable section titles
  analyticsTitle = 'Analytics',
  analyticsSubtitle = 'Performance and trend insights',
  activityTitle = 'Recent Activity',
  activitySubtitle = 'Latest actions and updates',
}: DashboardLayoutProps) => {
  // Resolve primary content — prefer new prop, fall back to deprecated jobOpportunities
  const resolvedPrimary = primaryContent ?? jobOpportunities
  const resolvedPrimaryTitle = primaryContentTitle ?? 'Job Opportunities'
  const resolvedPrimarySubtitle = primaryContentSubtitle ?? 'Top picks based on your profile'
  const resolvedPrimaryHeaderRight =
    primaryContentHeaderRight ??
    (viewAllJobsLink ? (
      <Link to={viewAllJobsLink} className="section-view-all">
        View All Jobs <ChevronRight size={14} />
      </Link>
    ) : undefined)

  // ── Premium command-center layout (used by ALL role dashboards) ──
  if (compactLayout) {
    return (
      <div className="dashboard-shell">
        {/* ═══ HERO SECTION ═══ */}
        <motion.header
          className="dashboard-hero dashboard-hero-premium"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={heroGradient ? { background: heroGradient } : undefined}
        >
          <div className="dashboard-hero-left">
            <div className="dashboard-hero-content">
              {RoleIcon && (
                <RoleIcon size={26} strokeWidth={2} className="dashboard-hero-icon" />
              )}
              <h1>{greeting || title}</h1>
            </div>
            <p className="dashboard-hero-subtitle">{subtitle}</p>

            {readinessLabel && (
              <div className="dashboard-hero-readiness">
                <span className="readiness-badge">
                  <span className="readiness-dot" />
                  {readinessLabel}
                </span>
              </div>
            )}

            {typeof readinessPercent === 'number' && (
              <div className="dashboard-hero-progress">
                <div className="hero-progress-bar">
                  <div
                    className="hero-progress-fill"
                    style={{ width: `${readinessPercent}%` }}
                  />
                </div>
                <span className="hero-progress-label">{readinessPercent}%</span>
              </div>
            )}
          </div>

          {heroStats && heroStats.length > 0 && (
            <div className="dashboard-hero-stats">
              {heroStats.map((stat) => (
                <div key={stat.label} className="hero-stat-card">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          )}
        </motion.header>

        {/* ═══ ERROR ═══ */}
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

        {/* ═══ KPI STRIP ═══ */}
        <section className="dashboard-kpi-grid">{kpis}</section>

        {/* ═══ PRIMARY CONTENT (Job Opportunities / Charts / Tables) ═══ */}
        {resolvedPrimary && (
          <SectionCard
            title={resolvedPrimaryTitle}
            subtitle={resolvedPrimarySubtitle}
            collapsible={false}
            className="dashboard-section-primary"
            headerRight={resolvedPrimaryHeaderRight}
          >
            {resolvedPrimary}
          </SectionCard>
        )}

        {/* ═══ MAIN 70/30 GRID ═══ */}
        <div className="dashboard-grid dashboard-grid-premium">
          {/* LEFT COLUMN (70%) */}
          <div className="dashboard-col-main">
            <SectionCard
              title="Quick Actions"
              subtitle="Common tasks to keep workflows moving"
              collapsible={false}
            >
              {quickActions}
            </SectionCard>
            <SectionCard
              title={activityTitle}
              subtitle={activitySubtitle}
              collapsible={false}
            >
              {activity}
            </SectionCard>
            <SectionCard
              title={analyticsTitle}
              subtitle={analyticsSubtitle}
              collapsible={false}
            >
              {analytics}
            </SectionCard>
          </div>

          {/* RIGHT COLUMN (30%) */}
          <div className="dashboard-col-side">
            {calendar && (
              <section className="dashboard-calendar-slot">{calendar}</section>
            )}
            <SectionCard
              title="AI Insights"
              subtitle="Smart suggestions to improve outcomes"
              collapsible={false}
              className="dashboard-section-insights"
            >
              {insights}
            </SectionCard>
          </div>
        </div>
      </div>
    )
  }

  // ── Default mode (fallback — not used by any current role) ──
  return (
    <div className="dashboard-shell">
      <motion.header
        className="dashboard-hero"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={heroGradient ? { background: heroGradient } : undefined}
      >
        <div className="dashboard-hero-content">
          {RoleIcon && (
            <RoleIcon size={26} strokeWidth={2} className="dashboard-hero-icon" />
          )}
          <h1>{greeting || title}</h1>
        </div>
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

      {calendar && (
        <section className="dashboard-calendar-slot">{calendar}</section>
      )}

      <div className="dashboard-grid">
        <div className="dashboard-col-main">
          <SectionCard
            title={analyticsTitle}
            subtitle={analyticsSubtitle}
            collapsible={false}
          >
            {analytics}
          </SectionCard>
          <SectionCard title="Quick Actions" subtitle="Common tasks to keep workflows moving">
            {quickActions}
          </SectionCard>
        </div>
        <div className="dashboard-col-side">
          <SectionCard title={activityTitle} subtitle={activitySubtitle}>
            {activity}
          </SectionCard>
          <SectionCard
            title="Recommendations"
            subtitle="Smart suggestions to improve outcomes"
          >
            {insights}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
