import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  Briefcase,
  ClipboardList,
  UserCheck,
  UserCircle,
  Target,
  Search,
  FilePenLine,
  Upload,
  CalendarClock,
  Sparkles,
} from 'lucide-react'
import { getJobs } from '../../api/jobs'
import { getMyApplications, type StudentApplication } from '../../api/applications'
import { getMyProfile, type StudentProfile } from '../../api/profile'
import {
  ActivityTimeline,
  DashboardLayout,
  EventCalendar,
  MetricCard,
  QuickActionCard,
  SuggestionPanel,
  type SuggestionItem,
  type TimelineItem,
} from '../../components/dashboard'

function scoreProfile(profile: StudentProfile) {
  const checks = [
    profile.tenthPercentage !== null,
    profile.twelfthPercentage !== null,
    profile.graduationYear !== null,
    Boolean(profile.programmingLanguages.trim()),
    Boolean(profile.frameworks.trim()),
    Boolean(profile.tools.trim()),
    Boolean(profile.certifications.trim()),
    profile.projects.length > 0,
    Boolean(profile.internshipExperience.trim()),
    Boolean(profile.achievements.trim()),
    Boolean(profile.githubUrl.trim() || profile.linkedinUrl.trim() || profile.portfolioUrl.trim()),
  ]
  const completed = checks.filter(Boolean).length
  return Math.round((completed / checks.length) * 100)
}

function readinessLabel(score: number) {
  if (score < 40) return 'Weak'
  if (score < 65) return 'Medium'
  if (score < 85) return 'Strong'
  return 'Placement Ready'
}

const StudentDashboardHome = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openJobsCount, setOpenJobsCount] = useState(0)
  const [applications, setApplications] = useState<StudentApplication[]>([])
  const [profile, setProfile] = useState<StudentProfile | null>(null)

  useEffect(() => {
    Promise.all([getJobs(), getMyApplications(), getMyProfile()])
      .then(([jobs, myApplications, myProfile]) => {
        setOpenJobsCount(jobs.filter((job) => job.status === 'open').length)
        setApplications(myApplications)
        setProfile(myProfile)
      })
      .catch((err: unknown) => {
        const raw = err instanceof Error ? err.message : 'Failed to load dashboard data'
        const friendly =
          raw === 'Failed to fetch'
            ? 'Cannot reach placement API. Please check that the backend server is running on http://localhost:3000.'
            : raw
        setError(friendly)
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

  const interviewCount = useMemo(
    () => applications.filter((item) => ['test_scheduled', 'interview_scheduled'].includes(item.status)).length,
    [applications]
  )

  const profileCompletion = useMemo(() => (profile ? scoreProfile(profile) : 0), [profile])
  const readinessScore = useMemo(() => {
    const appFactor = applications.length ? Math.min(20, applications.length * 2) : 0
    const shortListFactor = applications.length ? Math.round((shortlistedCount / applications.length) * 20) : 0
    return Math.min(100, profileCompletion + appFactor + shortListFactor)
  }, [applications.length, shortlistedCount, profileCompletion])

  const profileSuggestions = useMemo(() => {
    if (!profile) return ['Add more skills', 'Upload resume', 'Add certifications']
    const items: string[] = []
    if (!profile.programmingLanguages.trim()) items.push('Add more skills')
    if (!profile.certifications.trim()) items.push('Add certifications')
    if (!profile.projects.length) items.push('Add projects to strengthen profile')
    if (!profile.linkedinUrl.trim()) items.push('Add LinkedIn profile link')
    return items.length ? items : ['Maintain regular updates before drives']
  }, [profile])

  const activityItems = useMemo<TimelineItem[]>(
    () =>
      applications.slice(0, 5).map((item) => ({
        id: item.id,
        title: `Applied to ${item.jobTitle}`,
        description: `${item.company} | Status: ${item.status}`,
        time: new Date(item.appliedAt).toLocaleDateString(),
        tone: item.status === 'selected' ? 'success' : item.status.includes('interview') ? 'warning' : 'default',
      })),
    [applications]
  )

  const insightSuggestions = useMemo<SuggestionItem[]>(
    () => [
      {
        id: 'new-jobs',
        title: 'Apply to new jobs this week',
        detail: `${openJobsCount} opportunities are currently open. Apply early to improve shortlist chances.`,
      },
      {
        id: 'profile',
        title: 'Improve profile quality',
        detail: `Current completion is ${profileCompletion}%. Complete missing sections for better recruiter visibility.`,
      },
      {
        id: 'interview',
        title: 'Prepare for interviews',
        detail: `${interviewCount} interview/test rounds are in your pipeline. Practice role-specific questions daily.`,
      },
    ],
    [openJobsCount, profileCompletion, interviewCount]
  )

  return (
    <DashboardLayout
      greeting={`Hi, ${user?.name ?? 'Student'}`}
      title="Student Dashboard"
      subtitle="Track opportunities, monitor your funnel, and improve placement readiness with guided insights."
      compactLayout
      error={error}
      kpis={
        <>
          <MetricCard icon={Briefcase} label="Available Opportunities" value={openJobsCount} trend={6} loading={loading} />
          <MetricCard icon={ClipboardList} label="Applications Submitted" value={applications.length} trend={8} loading={loading} />
          <MetricCard icon={UserCheck} label="Shortlisted" value={shortlistedCount} trend={4} loading={loading} />
          <MetricCard icon={UserCircle} label="Profile Completion %" value={`${profileCompletion}%`} trend={3} loading={loading} />
          <MetricCard icon={Target} label="Placement Readiness Score" value={`${readinessScore}%`} trend={5} loading={loading} />
        </>
      }
      calendar={<EventCalendar />}
      analytics={
        <article className="profile-strength profile-strength-full">
          <div className="profile-strength-top">
            <h3>Profile Strength</h3>
            <span>{readinessLabel(readinessScore)}</span>
          </div>
          <div className="profile-bar">
            <i style={{ width: `${readinessScore}%` }} />
          </div>
          <div className="suggestion-panel" style={{ marginTop: '0.55rem' }}>
            <ul className="suggestion-list">
              {profileSuggestions.map((item) => (
                <li key={item}>
                  <Sparkles size={15} />
                  <div>
                    <h4>{item}</h4>
                    <p>Keep improving profile quality for stronger recruiter matches.</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </article>
      }
      activity={
        <ActivityTimeline
          items={activityItems}
          emptyText="No recent activity yet. Start by applying to open opportunities."
        />
      }
      quickActions={
        <div className="quick-action-grid">
          <QuickActionCard
            to="/student/jobs"
            title="Browse Opportunities"
            description="Explore active jobs and internships"
            icon={Search}
          />
          <QuickActionCard
            to="/student/profile"
            title="Update Profile"
            description="Keep academics and skills current"
            icon={FilePenLine}
          />
          <QuickActionCard
            to="/student/upload-resume"
            title="Upload Resume"
            description="Share your latest resume with recruiters"
            icon={Upload}
          />
          <QuickActionCard
            to="/student/interview-schedule"
            title="View Interview Schedule"
            description="Track tests and interview slots"
            icon={CalendarClock}
          />
          <QuickActionCard
            to="/student/dashboard?tool=ai"
            title="Generate AI Interview Questions"
            description="Practice role-based mock questions"
            icon={Sparkles}
          />
        </div>
      }
      insights={<SuggestionPanel items={insightSuggestions} />}
    />
  )
}

export default StudentDashboardHome
