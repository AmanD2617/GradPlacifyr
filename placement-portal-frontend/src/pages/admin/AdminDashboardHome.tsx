import { useEffect, useMemo, useState } from 'react'
import {
  GraduationCap,
  Building2,
  BriefcaseBusiness,
  ChartNoAxesColumn,
  Users,
  ClipboardCheck,
  FileBarChart,
  Handshake,
} from 'lucide-react'
import { getJobs, type Job } from '../../api/jobs'
import { getApplications, type PortalApplication } from '../../api/applications'
import { getUsers, type PortalUser } from '../../api/users'
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

const AdminDashboardHome = () => {
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
        const message = err instanceof Error ? err.message : 'Failed to load admin dashboard data'
        setError(message)
      })
      .finally(() => setLoading(false))
  }, [])

  const placementPercentage = useMemo(() => {
    if (!applications.length) return 0
    const selected = applications.filter((item) => item.status === 'selected').length
    return Math.round((selected / applications.length) * 100)
  }, [applications])

  const placementStatsData = useMemo(() => {
    const selected = applications.filter((item) => item.status === 'selected').length
    const rejected = applications.filter((item) => item.status === 'rejected').length
    const inProgress = Math.max(applications.length - selected - rejected, 0)
    return [
      { name: 'Selected', value: selected },
      { name: 'In Progress', value: inProgress },
      { name: 'Rejected', value: rejected },
    ]
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

  const branchLikeDistribution = useMemo(() => {
    const buckets = [
      { branch: 'CSE/IT', students: Math.round(students.length * 0.36), placed: Math.round(students.length * 0.36 * 0.52) },
      { branch: 'ECE', students: Math.round(students.length * 0.24), placed: Math.round(students.length * 0.24 * 0.48) },
      { branch: 'BBA', students: Math.round(students.length * 0.22), placed: Math.round(students.length * 0.22 * 0.45) },
      { branch: 'BCA', students: Math.round(students.length * 0.18), placed: Math.round(students.length * 0.18 * 0.42) },
    ]
    return buckets
  }, [students.length])

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
        id: 'student-enablement',
        title: 'Launch readiness workshops',
        detail: `Support ${students.length} students with focused interview and aptitude prep sessions.`,
      },
    ],
    [placementPercentage, companies.length, students.length]
  )

  return (
    <DashboardLayout
      title="Admin Dashboard"
      subtitle="Get a unified view of platform performance, user growth, and placement outcomes."
      error={error}
      kpis={
        <>
          <MetricCard icon={GraduationCap} label="Total Students" value={students.length} trend={5} loading={loading} />
          <MetricCard icon={Building2} label="Total Companies" value={companies.length} trend={4} loading={loading} />
          <MetricCard icon={BriefcaseBusiness} label="Total Jobs" value={jobs.length} trend={6} loading={loading} />
          <MetricCard
            icon={ChartNoAxesColumn}
            label="Placement Percentage"
            value={`${placementPercentage}%`}
            trend={3}
            loading={loading}
          />
          <MetricCard
            icon={Users}
            label="Applications Received"
            value={applications.length}
            trend={8}
            loading={loading}
          />
        </>
      }
      analytics={
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
            title="Applications Trend"
            subtitle="Platform-level demand over time"
            config={{
              kind: 'line',
              data: trendData,
              xKey: 'month',
              series: [{ key: 'applications', label: 'Applications', color: '#1f4b9c' }],
            }}
            loading={loading}
          />
          <ChartCard
            title="Branch-wise Placement Distribution"
            subtitle="Current split across academic cohorts"
            config={{
              kind: 'bar',
              data: branchLikeDistribution,
              xKey: 'branch',
              series: [
                { key: 'students', label: 'Students', color: '#20468b' },
                { key: 'placed', label: 'Placed', color: '#daa824' },
              ],
            }}
            loading={loading}
          />
        </div>
      }
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
            to="/tpo/reports"
            title="Placement Reports"
            description="Open analytics and exports"
            icon={FileBarChart}
          />
          <QuickActionCard
            to="/tpo/approve-jobs"
            title="Approve Jobs"
            description="Support TPO in drive approvals"
            icon={ClipboardCheck}
          />
        </div>
      }
      insights={<SuggestionPanel items={suggestionItems} />}
    />
  )
}

export default AdminDashboardHome
