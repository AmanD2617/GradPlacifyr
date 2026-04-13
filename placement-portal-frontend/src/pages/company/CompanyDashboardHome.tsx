import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  BriefcaseBusiness,
  Users,
  UserCheck,
  CalendarCheck,
  PlusCircle,
  ClipboardPen,
  FileUser,
  ListChecks,
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

const CompanyDashboardHome = () => {
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
        const message = err instanceof Error ? err.message : 'Failed to load recruiter dashboard data'
        setError(message)
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Derived metrics ──

  const openJobs = useMemo(() => jobs.filter((j) => j.status === 'open').length, [jobs])
  const shortlistedCount = useMemo(
    () =>
      applications.filter((item) =>
        ['shortlisted', 'test_scheduled', 'interview_scheduled', 'selected'].includes(item.status)
      ).length,
    [applications]
  )
  const interviewsCount = useMemo(
    () => applications.filter((item) => item.status === 'interview_scheduled').length,
    [applications]
  )
  const selectedCount = useMemo(
    () => applications.filter((a) => a.status === 'selected').length,
    [applications]
  )
  const conversionRate = applications.length
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

  const trendData = useMemo(() => {
    const monthMap = new Map<string, number>()
    for (const app of applications) {
      const dt = new Date(app.appliedAt)
      const key = `${MONTH_SHORT[dt.getMonth()]} ${String(dt.getFullYear()).slice(2)}`
      monthMap.set(key, (monthMap.get(key) || 0) + 1)
    }
    return Array.from(monthMap.entries()).map(([month, applicants]) => ({ month, applicants }))
  }, [applications])

  const topJobsData = useMemo(() => {
    const byJob = new Map<string, number>()
    for (const app of applications) {
      byJob.set(app.jobTitle, (byJob.get(app.jobTitle) || 0) + 1)
    }
    return Array.from(byJob.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([job, count]) => ({ job, count }))
  }, [applications])

  // ── Activity timeline ──

  const activityItems = useMemo<TimelineItem[]>(
    () =>
      applications.slice(0, 5).map((item) => ({
        id: item.id,
        title: `${item.studentName || item.studentEmail} applied`,
        description: `${item.jobTitle} | ${item.status}`,
        time: new Date(item.appliedAt).toLocaleDateString(),
        tone: item.status === 'selected' ? 'success' : item.status.includes('interview') ? 'warning' : 'default',
      })),
    [applications]
  )

  // ── Suggestions ──

  const insightItems = useMemo<SuggestionItem[]>(
    () => [
      {
        id: 'post-more',
        title: 'Post at least one fresh role',
        detail: 'New listings improve talent mix and increase high-quality applicant flow.',
      },
      {
        id: 'shortlist-faster',
        title: 'Accelerate shortlisting',
        detail: `${applications.length - shortlistedCount} candidates are still pending progression.`,
      },
      {
        id: 'interview-plan',
        title: 'Expand interview slots',
        detail: `${interviewsCount} interviews are scheduled. Add backup slots to avoid bottlenecks.`,
      },
    ],
    [applications.length, shortlistedCount, interviewsCount]
  )

  const roleTheme = getRoleTheme('recruiter')

  return (
    <DashboardLayout
      greeting={`Welcome back, ${user?.name ?? 'Recruiter'}`}
      title="Recruiter Dashboard"
      subtitle="Monitor job performance, track applicants, and accelerate hiring outcomes with live analytics."
      compactLayout
      heroGradient={roleTheme.heroGradient}
      roleIcon={roleTheme.icon}
      error={error}
      readinessLabel={`Hiring Pipeline: ${conversionRate}% Conversion`}
      readinessPercent={conversionRate}
      heroStats={[
        { label: 'Jobs Posted', value: jobs.length },
        { label: 'Applicants', value: applications.length },
        { label: 'Selected', value: selectedCount },
      ]}
      primaryContentTitle="Hiring Analytics"
      primaryContentSubtitle="Application funnel, applicant trends, and top-performing roles"
      primaryContent={
        <div className="chart-grid">
          <ChartCard
            title="Applications by Status"
            subtitle="Pipeline visibility by round"
            config={{
              kind: 'donut',
              data: statusChartData.length ? statusChartData : [{ name: 'No Data', value: 1 }],
            }}
            loading={loading}
          />
          <ChartCard
            title="Applicant Trend"
            subtitle="Monthly incoming applications"
            config={{
              kind: 'line',
              data: trendData,
              xKey: 'month',
              series: [{ key: 'applicants', label: 'Applicants', color: '#059669' }],
            }}
            loading={loading}
          />
          <ChartCard
            title="Top Jobs by Applications"
            subtitle="Roles attracting the most candidates"
            config={{
              kind: 'bar',
              data: topJobsData,
              xKey: 'job',
              series: [{ key: 'count', label: 'Applicants', color: '#daa824' }],
            }}
            loading={loading}
          />
        </div>
      }
      kpis={
        <>
          <MetricCard icon={BriefcaseBusiness} label="Total Jobs Posted" value={jobs.length} trend={7} loading={loading} />
          <MetricCard icon={Users} label="Total Applicants" value={applications.length} trend={10} loading={loading} />
          <MetricCard icon={UserCheck} label="Shortlisted Candidates" value={shortlistedCount} trend={5} loading={loading} />
          <MetricCard icon={CalendarCheck} label="Interviews Scheduled" value={interviewsCount} trend={4} loading={loading} />
          <MetricCard
            icon={ClipboardPen}
            label="Open Jobs"
            value={openJobs}
            trend={3}
            loading={loading}
          />
        </>
      }
      calendar={<EventCalendar canManage />}
      analyticsTitle="Conversion Metrics"
      analyticsSubtitle="Shortlist and selection breakdown"
      analytics={
        <div className="chart-grid">
          <ChartCard
            title="Selection Funnel"
            subtitle="Shortlisted vs selected"
            config={{
              kind: 'donut',
              data: [
                { name: 'Selected', value: selectedCount },
                { name: 'Shortlisted', value: Math.max(shortlistedCount - selectedCount, 0) },
                { name: 'Pending', value: Math.max(applications.length - shortlistedCount, 0) },
              ],
            }}
            loading={loading}
          />
        </div>
      }
      activityTitle="Hiring Activity"
      activitySubtitle="Recent applicant actions and updates"
      activity={<ActivityTimeline items={activityItems} emptyText="No recent applicant activity yet." />}
      quickActions={
        <div className="quick-action-grid">
          <QuickActionCard
            to="/company/post-job"
            title="Post New Job"
            description="Publish a job or internship opening"
            icon={PlusCircle}
          />
          <QuickActionCard
            to="/company/manage-jobs"
            title="Manage Jobs"
            description="Update statuses and close roles"
            icon={ClipboardPen}
          />
          <QuickActionCard
            to="/company/applicants"
            title="View Applicants"
            description="Review incoming candidate profiles"
            icon={FileUser}
          />
          <QuickActionCard
            to="/company/shortlist"
            title="Shortlist Candidates"
            description="Move candidates to next round"
            icon={ListChecks}
          />
        </div>
      }
      insights={<SuggestionPanel title="AI Insights" items={insightItems} />}
    />
  )
}

export default CompanyDashboardHome
