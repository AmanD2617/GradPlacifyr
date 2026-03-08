import { useEffect, useMemo, useState } from 'react'
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
import {
  ActivityTimeline,
  ChartCard,
  DashboardLayout,
  MetricCard,
  QuickActionCard,
  SuggestionPanel,
  type SuggestionItem,
  type TimelineItem,
} from '../../components/dashboard'

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const CompanyDashboardHome = () => {
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

  return (
    <DashboardLayout
      title="Company Dashboard"
      subtitle="Monitor job performance, track applicants, and accelerate hiring outcomes with live analytics."
      error={error}
      kpis={
        <>
          <MetricCard icon={BriefcaseBusiness} label="Total Jobs Posted" value={jobs.length} trend={7} loading={loading} />
          <MetricCard icon={Users} label="Total Applicants" value={applications.length} trend={10} loading={loading} />
          <MetricCard icon={UserCheck} label="Shortlisted Candidates" value={shortlistedCount} trend={5} loading={loading} />
          <MetricCard icon={CalendarCheck} label="Interview Scheduled" value={interviewsCount} trend={4} loading={loading} />
          <MetricCard
            icon={ClipboardPen}
            label="Open Jobs"
            value={jobs.filter((job) => job.status === 'open').length}
            trend={3}
            loading={loading}
          />
        </>
      }
      analytics={
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
              series: [{ key: 'applicants', label: 'Applicants', color: '#1f4b9c' }],
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
      insights={<SuggestionPanel items={insightItems} />}
    />
  )
}

export default CompanyDashboardHome
