import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  Building2,
  Briefcase,
  Inbox,
  CalendarCheck,
  Activity,
  ClipboardCheck,
  FileBarChart,
  Users,
} from 'lucide-react'
import { getJobs, type Job } from '../../api/jobs'
import { getApplications, type PortalApplication } from '../../api/applications'
import { getRoleTheme } from '../../utils/roleConfig'
import {
  ActivityTimeline,
  ChartCard,
  DashboardLayout,
  EventCalendar,
  MetricCard,
  QuickActionCard,
  SuggestionPanel,
  type SuggestionItem,
  type TimelineItem,
} from '../../components/dashboard'

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const TpoDashboardHome = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<PortalApplication[]>([])

  useEffect(() => {
    Promise.all([getJobs(), getApplications()])
      .then(([jobRows, appRows]) => {
        setJobs(jobRows)
        setApplications(appRows)
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load TPO dashboard data'
        setError(message)
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Derived metrics ──

  const activeCompanies = useMemo(() => new Set(jobs.map((job) => job.company)).size, [jobs])
  const activeJobs = useMemo(() => jobs.filter((job) => job.status === 'open').length, [jobs])
  const interviewsScheduled = useMemo(
    () => applications.filter((item) => ['test_scheduled', 'interview_scheduled'].includes(item.status)).length,
    [applications]
  )
  const selectedCount = useMemo(
    () => applications.filter((a) => a.status === 'selected').length,
    [applications]
  )
  const selectionRatio = applications.length
    ? Math.round((selectedCount / applications.length) * 100)
    : 0

  // ── Chart data ──

  const statusChartData = useMemo(() => {
    const base = new Map<string, number>()
    for (const app of applications) {
      base.set(app.status, (base.get(app.status) || 0) + 1)
    }
    return Array.from(base.entries()).map(([name, value]) => ({ name, value }))
  }, [applications])

  const appTrendData = useMemo(() => {
    const monthMap = new Map<string, number>()
    for (const app of applications) {
      const dt = new Date(app.appliedAt)
      const key = `${MONTH_SHORT[dt.getMonth()]} ${String(dt.getFullYear()).slice(2)}`
      monthMap.set(key, (monthMap.get(key) || 0) + 1)
    }
    return Array.from(monthMap.entries()).map(([month, applicationsCount]) => ({ month, applications: applicationsCount }))
  }, [applications])

  const companyDistribution = useMemo(() => {
    const byCompany = new Map<string, number>()
    for (const app of applications) {
      byCompany.set(app.company, (byCompany.get(app.company) || 0) + 1)
    }
    return Array.from(byCompany.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([company, count]) => ({ company, count }))
  }, [applications])

  // ── Activity timeline ──

  const activityItems = useMemo<TimelineItem[]>(
    () =>
      applications.slice(0, 5).map((item) => ({
        id: item.id,
        title: `${item.jobTitle} - ${item.company}`,
        description: `${item.studentName || item.studentEmail} moved to ${item.status}`,
        time: new Date(item.appliedAt).toLocaleDateString(),
        tone: item.status === 'selected' ? 'success' : item.status.includes('interview') ? 'warning' : 'default',
      })),
    [applications]
  )

  // ── Suggestions ──

  const suggestionItems = useMemo<SuggestionItem[]>(
    () => [
      {
        id: 'drives',
        title: 'Prioritize high-volume drives',
        detail: `There are ${activeJobs} active jobs. Review SLA adherence for each company.`,
      },
      {
        id: 'interview',
        title: 'Balance interview load',
        detail: `${interviewsScheduled} interview/test rounds are in progress. Coordinate scheduling early.`,
      },
      {
        id: 'followup',
        title: 'Follow up with low-activity companies',
        detail: 'Send nudges to companies with low conversion from applicants to interviews.',
      },
    ],
    [activeJobs, interviewsScheduled]
  )

  const roleTheme = getRoleTheme('tpo')

  return (
    <DashboardLayout
      greeting={`Welcome back, ${user?.name ?? 'TPO'}`}
      title="TPO Dashboard"
      subtitle="Oversee drive operations, maintain pipeline movement, and keep placement performance on track."
      compactLayout
      heroGradient={roleTheme.heroGradient}
      roleIcon={roleTheme.icon}
      error={error}
      readinessLabel={`Placement Rate: ${selectionRatio}%`}
      readinessPercent={selectionRatio}
      heroStats={[
        { label: 'Active Drives', value: activeJobs },
        { label: 'Companies', value: activeCompanies },
        { label: 'Selected', value: selectedCount },
      ]}
      primaryContentTitle="Drive Analytics"
      primaryContentSubtitle="Application funnel and company-wise distribution"
      primaryContent={
        <div className="chart-grid">
          <ChartCard
            title="Applications by Status"
            subtitle="Round-wise funnel view"
            config={{
              kind: 'donut',
              data: statusChartData.length ? statusChartData : [{ name: 'No Data', value: 1 }],
            }}
            loading={loading}
          />
          <ChartCard
            title="Applications Trend"
            subtitle="Month-over-month pipeline flow"
            config={{
              kind: 'line',
              data: appTrendData,
              xKey: 'month',
              series: [{ key: 'applications', label: 'Applications', color: '#0369a1' }],
            }}
            loading={loading}
          />
          <ChartCard
            title="Company-wise Distribution"
            subtitle="Applications by active companies"
            config={{
              kind: 'bar',
              data: companyDistribution,
              xKey: 'company',
              series: [{ key: 'count', label: 'Applications', color: '#daa824' }],
            }}
            loading={loading}
          />
        </div>
      }
      kpis={
        <>
          <MetricCard icon={Building2} label="Active Companies" value={activeCompanies} trend={4} loading={loading} />
          <MetricCard icon={Briefcase} label="Active Jobs" value={activeJobs} trend={6} loading={loading} />
          <MetricCard icon={Inbox} label="Applications Received" value={applications.length} trend={9} loading={loading} />
          <MetricCard
            icon={CalendarCheck}
            label="Interviews Scheduled"
            value={interviewsScheduled}
            trend={5}
            loading={loading}
          />
          <MetricCard
            icon={Activity}
            label="Selection Ratio"
            value={`${selectionRatio}%`}
            trend={3}
            loading={loading}
          />
        </>
      }
      calendar={<EventCalendar canManage />}
      analyticsTitle="Placement Health"
      analyticsSubtitle="Key indicators and coverage metrics"
      analytics={
        <div className="chart-grid">
          {/* empty placeholder — all charts are in primaryContent */}
        </div>
      }
      activityTitle="Drive Activity"
      activitySubtitle="Recent student movements across rounds"
      activity={<ActivityTimeline items={activityItems} emptyText="No active notifications in the queue." />}
      quickActions={
        <div className="quick-action-grid">
          <QuickActionCard
            to="/tpo/approve-jobs"
            title="Approve Jobs"
            description="Validate JNF/TNF submissions"
            icon={ClipboardCheck}
          />
          <QuickActionCard
            to="/tpo/monitor-applications"
            title="Monitor Applications"
            description="Watch movement across rounds"
            icon={Activity}
          />
          <QuickActionCard
            to="/tpo/reports"
            title="Generate Reports"
            description="Export placement analytics"
            icon={FileBarChart}
          />
          <QuickActionCard
            to="/tpo/manage-companies"
            title="Coordinate Companies"
            description="Handle company-level follow ups"
            icon={Users}
          />
        </div>
      }
      insights={<SuggestionPanel title="AI Insights" items={suggestionItems} />}
    />
  )
}

export default TpoDashboardHome
