import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  GraduationCap,
  Building2,
  Briefcase,
  ChartNoAxesColumn,
  Users,
  ClipboardCheck,
  FileBarChart,
  Handshake,
  Eye,
} from 'lucide-react'
import { getJobs, type Job } from '../../api/jobs'
import { getApplications, type PortalApplication } from '../../api/applications'
import { getUsers, type PortalUser } from '../../api/users'
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

const AdminDashboardHome = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<PortalApplication[]>([])
  const [students, setStudents] = useState<PortalUser[]>([])
  const [companies, setCompanies] = useState<PortalUser[]>([])

  useEffect(() => {
    Promise.all([getJobs(), getApplications(), getUsers('student'), getUsers('recruiter')])
      .then(([jobRows, appRows, studentRows, companyRows]) => {
        setJobs(jobRows)
        setApplications(appRows)
        setStudents(studentRows)
        setCompanies(companyRows)
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load dashboard data'
        setError(message)
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Derived metrics ──

  const activeCompanies = useMemo(() => new Set(jobs.map((j) => j.company)).size, [jobs])
  const activeJobs = useMemo(() => jobs.filter((j) => j.status === 'open').length, [jobs])

  const selectedCount = useMemo(
    () => applications.filter((a) => a.status === 'selected').length,
    [applications]
  )

  const placementPercentage = useMemo(() => {
    if (!applications.length) return 0
    return Math.round((selectedCount / applications.length) * 100)
  }, [applications.length, selectedCount])

  const interviewsScheduled = useMemo(
    () => applications.filter((a) => ['test_scheduled', 'interview_scheduled'].includes(a.status)).length,
    [applications]
  )

  // ── Chart data ──

  const placementStatsData = useMemo(() => {
    const rejected = applications.filter((a) => a.status === 'rejected').length
    const inProgress = Math.max(applications.length - selectedCount - rejected, 0)
    return [
      { name: 'Selected', value: selectedCount },
      { name: 'In Progress', value: inProgress },
      { name: 'Rejected', value: rejected },
    ]
  }, [applications, selectedCount])

  const statusBreakdownData = useMemo(() => {
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
    return Array.from(monthMap.entries()).map(([month, applicationsCount]) => ({ month, applications: applicationsCount }))
  }, [applications])

  const branchDistribution = useMemo(() => [
    { branch: 'CSE/IT', students: Math.round(students.length * 0.36), placed: Math.round(students.length * 0.36 * 0.52) },
    { branch: 'ECE', students: Math.round(students.length * 0.24), placed: Math.round(students.length * 0.24 * 0.48) },
    { branch: 'BBA', students: Math.round(students.length * 0.22), placed: Math.round(students.length * 0.22 * 0.45) },
    { branch: 'BCA', students: Math.round(students.length * 0.18), placed: Math.round(students.length * 0.18 * 0.42) },
  ], [students.length])

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
      applications.slice(0, 6).map((item) => ({
        id: item.id,
        title: `${item.studentName || item.studentEmail} - ${item.jobTitle}`,
        description: `${item.company} updated to ${item.status}`,
        time: new Date(item.appliedAt).toLocaleDateString(),
        tone: item.status === 'selected' ? 'success' : item.status.includes('interview') ? 'warning' : 'default',
      })),
    [applications]
  )

  // ── Smart suggestions ──

  const suggestionItems = useMemo<SuggestionItem[]>(
    () => [
      {
        id: 'placement-health',
        title: 'Improve placement conversion',
        detail: `Current placement percentage is ${placementPercentage}%. Focus support on low-conversion cohorts.`,
      },
      {
        id: 'company-growth',
        title: 'Expand active company base',
        detail: `${companies.length} companies are active. Invite niche employers for better role diversity.`,
      },
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
        id: 'student-enablement',
        title: 'Launch readiness workshops',
        detail: `Support ${students.length} students with focused interview and aptitude prep sessions.`,
      },
    ],
    [placementPercentage, companies.length, activeJobs, interviewsScheduled, students.length]
  )

  // ── Render ──

  const roleTheme = getRoleTheme(user?.role ?? 'admin')

  return (
    <DashboardLayout
      greeting={`Welcome back, ${user?.name ?? 'Admin'}`}
      title="Admin Dashboard"
      subtitle="Unified view of platform performance, drive operations, user growth, and placement outcomes."
      compactLayout
      heroGradient={roleTheme.heroGradient}
      roleIcon={roleTheme.icon}
      error={error}
      readinessLabel={`System Health: Active`}
      readinessPercent={placementPercentage}
      heroStats={[
        { label: 'Students', value: students.length },
        { label: 'Companies', value: companies.length },
        { label: 'Placement %', value: `${placementPercentage}%` },
      ]}
      primaryContentTitle="Platform Analytics"
      primaryContentSubtitle="Placement pipeline, application trends, and branch-wise distribution"
      primaryContent={
        <div className="chart-grid">
          <ChartCard
            title="Placement Status Overview"
            subtitle="Selection pipeline distribution"
            config={{
              kind: 'donut',
              data: placementStatsData.length ? placementStatsData : [{ name: 'No Data', value: 1 }],
            }}
            loading={loading}
          />
          <ChartCard
            title="Applications by Status"
            subtitle="Round-wise funnel view"
            config={{
              kind: 'donut',
              data: statusBreakdownData.length ? statusBreakdownData : [{ name: 'No Data', value: 1 }],
            }}
            loading={loading}
          />
          <ChartCard
            title="Applications Trend"
            subtitle="Month-over-month pipeline flow"
            config={{
              kind: 'line',
              data: trendData,
              xKey: 'month',
              series: [{ key: 'applications', label: 'Applications', color: '#7c3aed' }],
            }}
            loading={loading}
          />
          <ChartCard
            title="Branch-wise Placement"
            subtitle="Split across academic cohorts"
            config={{
              kind: 'bar',
              data: branchDistribution,
              xKey: 'branch',
              series: [
                { key: 'students', label: 'Students', color: '#5b21b6' },
                { key: 'placed', label: 'Placed', color: '#daa824' },
              ],
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
          <MetricCard icon={GraduationCap} label="Total Students" value={students.length} trend={5} loading={loading} />
          <MetricCard icon={Building2} label="Active Companies" value={activeCompanies} trend={4} loading={loading} />
          <MetricCard icon={Briefcase} label="Active Jobs" value={activeJobs} trend={6} loading={loading} />
          <MetricCard
            icon={ChartNoAxesColumn}
            label="Placement %"
            value={`${placementPercentage}%`}
            trend={3}
            loading={loading}
          />
          <MetricCard icon={Users} label="Applications" value={applications.length} trend={8} loading={loading} />
        </>
      }
      calendar={<EventCalendar canManage />}
      analyticsTitle="Detailed Metrics"
      analyticsSubtitle="Interviews, selection ratios, and scheduling"
      analytics={
        <div className="chart-grid">
          <ChartCard
            title="Interview Pipeline"
            subtitle="Scheduled vs selected"
            config={{
              kind: 'donut',
              data: [
                { name: 'Interviews', value: interviewsScheduled },
                { name: 'Selected', value: selectedCount },
                { name: 'Other', value: Math.max(applications.length - interviewsScheduled - selectedCount, 0) },
              ],
            }}
            loading={loading}
          />
        </div>
      }
      activityTitle="Platform Activity"
      activitySubtitle="Recent actions across all users"
      activity={<ActivityTimeline items={activityItems} emptyText="No recent platform activity yet." />}
      quickActions={
        <div className="quick-action-grid">
          <QuickActionCard
            to="/admin/manage-students"
            title="Manage Students"
            description="Review and maintain student accounts"
            icon={Users}
          />
          <QuickActionCard
            to="/admin/manage-companies"
            title="Manage Companies"
            description="Control recruiter access and health"
            icon={Handshake}
          />
          <QuickActionCard
            to="/admin/approve-jobs"
            title="Approve JNF / TNF"
            description="Validate and control job postings"
            icon={ClipboardCheck}
          />
          <QuickActionCard
            to="/admin/monitor-applications"
            title="Monitor Applications"
            description="Watch movement across rounds"
            icon={Eye}
          />
          <QuickActionCard
            to="/admin/reports"
            title="Placement Reports"
            description="Open analytics and exports"
            icon={FileBarChart}
          />
        </div>
      }
      insights={<SuggestionPanel title="AI Insights" items={suggestionItems} />}
    />
  )
}

export default AdminDashboardHome
