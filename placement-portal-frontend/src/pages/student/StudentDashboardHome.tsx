import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  Briefcase,
  ChevronRight,
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
import { Link } from 'react-router-dom'
import { getJobs, type Job } from '../../api/jobs'
import { getMyApplications, type StudentApplication } from '../../api/applications'
import { getMyProfile, type StudentProfile } from '../../api/profile'
import { getRoleTheme } from '../../utils/roleConfig'
import { API_BASE } from '../../config'
import {
  ActivityTimeline,
  DashboardLayout,
  EventCalendar,
  JobOpportunityCard,
  MetricCard,
  QuickActionCard,
  SuggestionPanel,
  type JobCardData,
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
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<StudentApplication[]>([])
  const [profile, setProfile] = useState<StudentProfile | null>(null)

  useEffect(() => {
    let cancelled = false
    setError(null)

    // Use allSettled so a transient failure on ONE endpoint doesn't blank
    // the whole dashboard. We only surface a top-level error if every
    // request failed (true "API is down" scenario).
    Promise.allSettled([getJobs(), getMyApplications(), getMyProfile()])
      .then(([jobsRes, appsRes, profileRes]) => {
        if (cancelled) return

        if (jobsRes.status === 'fulfilled') setJobs(jobsRes.value)
        if (appsRes.status === 'fulfilled') setApplications(appsRes.value)
        if (profileRes.status === 'fulfilled') setProfile(profileRes.value)

        const failures = [jobsRes, appsRes, profileRes].filter(
          (r): r is PromiseRejectedResult => r.status === 'rejected'
        )

        if (failures.length === 3) {
          const raw = failures[0].reason instanceof Error
            ? failures[0].reason.message
            : 'Failed to load dashboard data'
          setError(
            raw === 'Failed to fetch'
              ? 'Cannot reach the placement API. Please check that the backend server is running.'
              : raw
          )
        } else if (failures.length > 0) {
          // Partial failure — log silently; the visible sections will just show empty state.
          console.warn('[dashboard] Partial load failure:', failures.map((f) => f.reason))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const openJobs = useMemo(() => jobs.filter((j) => j.status === 'open'), [jobs])
  const openJobsCount = openJobs.length

  const appliedJobIds = useMemo(
    () => new Set(applications.map((a) => a.jobId)),
    [applications]
  )

  const shortlistedCount = useMemo(
    () =>
      applications.filter((item) =>
        ['shortlisted', 'test_scheduled', 'interview_scheduled', 'selected'].includes(item.status)
      ).length,
    [applications]
  )

  const interviewCount = useMemo(
    () =>
      applications.filter((item) =>
        ['test_scheduled', 'interview_scheduled'].includes(item.status)
      ).length,
    [applications]
  )

  const profileCompletion = useMemo(() => (profile ? scoreProfile(profile) : 0), [profile])
  const readinessScore = useMemo(() => {
    const appFactor = applications.length ? Math.min(20, applications.length * 2) : 0
    const shortListFactor = applications.length
      ? Math.round((shortlistedCount / applications.length) * 20)
      : 0
    return Math.min(100, profileCompletion + appFactor + shortListFactor)
  }, [applications.length, shortlistedCount, profileCompletion])

  const profileSuggestions = useMemo(() => {
    if (!profile) return ['Add more skills', 'Upload resume', 'Add certifications']
    const items: string[] = []
    if (!profile.programmingLanguages.trim()) items.push('Add more skills')
    if (!profile.certifications.trim()) items.push('Add certifications to boost recruiter visibility')
    if (!profile.projects.length) items.push('Add projects to strengthen profile')
    if (!profile.linkedinUrl.trim()) items.push('Add your LinkedIn URL to complete your social presence')
    return items.length ? items : ['Maintain regular updates before drives']
  }, [profile])

  const activityItems = useMemo<TimelineItem[]>(
    () =>
      applications.slice(0, 5).map((item) => ({
        id: item.id,
        title: `Applied to ${item.jobTitle}`,
        description: `${item.company} | Status: ${item.status}`,
        time: new Date(item.appliedAt).toLocaleDateString(),
        tone:
          item.status === 'selected'
            ? 'success'
            : item.status.includes('interview')
              ? 'warning'
              : 'default',
      })),
    [applications]
  )

  const insightSuggestions = useMemo<SuggestionItem[]>(
    () => [
      {
        id: 'new-jobs',
        title: 'Apply to new jobs this week',
        detail: `${openJobsCount} opportunities are open. Early applicants get 2x shortlist rate.`,
      },
      {
        id: 'profile',
        title: 'Improve profile quality',
        detail: `At ${profileCompletion}% — complete missing sections for better recruiter matches.`,
      },
      {
        id: 'interview',
        title: 'Prepare for interviews',
        detail: `${interviewCount} interview round${interviewCount !== 1 ? 's' : ''} in your pipeline. Practice role-specific questions daily.`,
      },
    ],
    [openJobsCount, profileCompletion, interviewCount]
  )

  // Build job card data (top 4 open jobs, with applied status)
  const jobCards = useMemo<JobCardData[]>(() => {
    // Show up to 4 jobs: prioritize open, then show applied
    const cards: JobCardData[] = openJobs.slice(0, 4).map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      ctc: job.ctc,
      location: job.location,
      deadline: job.deadline,
      employmentType: job.employmentType,
      status: appliedJobIds.has(job.id) ? 'applied' as const : 'open' as const,
    }))

    // If fewer than 4 open jobs, pad with recently applied jobs
    if (cards.length < 4) {
      const openIds = new Set(cards.map((c) => c.id))
      const appliedJobs = jobs
        .filter((j) => appliedJobIds.has(j.id) && !openIds.has(j.id))
        .slice(0, 4 - cards.length)

      for (const job of appliedJobs) {
        cards.push({
          id: job.id,
          title: job.title,
          company: job.company,
          ctc: job.ctc,
          location: job.location,
          deadline: job.deadline,
          employmentType: job.employmentType,
          status: 'applied',
        })
      }
    }

    return cards
  }, [openJobs, jobs, appliedJobIds])

  const roleTheme = getRoleTheme('student')

  // ── SSO: launch AI MCQ practice in AIMCQTest ────────────────────────────
  const handleAiMockInterview = async () => {
    try {
      const res = await fetch(`${API_BASE}/sso/generate-ticket`, {
        method: 'POST',
        credentials: 'include', // send the HttpOnly auth cookie
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        console.error('SSO ticket generation failed:', body)
        return
      }
      const { redirectUrl } = await res.json()
      window.location.href = redirectUrl
    } catch (err) {
      console.error('Failed to launch AI practice session:', err)
    }
  }

  return (
    <DashboardLayout
      greeting={`Welcome back, ${user?.name ?? 'Student'}`}
      title="Student Dashboard"
      subtitle="Track opportunities, monitor your funnel & improve your placement readiness."
      compactLayout
      heroGradient={roleTheme.heroGradient}
      roleIcon={roleTheme.icon}
      error={error}
      readinessLabel={`Placement Readiness: ${readinessLabel(readinessScore)}`}
      readinessPercent={readinessScore}
      heroStats={[
        { label: 'Jobs Open', value: openJobsCount },
        { label: 'Shortlisted', value: shortlistedCount },
      ]}
      primaryContentTitle="Job Opportunities"
      primaryContentSubtitle="Top picks based on your profile"
      primaryContentHeaderRight={
        <Link to="/student/jobs" className="section-view-all">
          View All Jobs <ChevronRight size={14} />
        </Link>
      }
      kpis={
        <>
          <MetricCard
            icon={Briefcase}
            label="Available Opportunities"
            value={openJobsCount}
            trend={6}
            loading={loading}
          />
          <MetricCard
            icon={ClipboardList}
            label="Applications Submitted"
            value={applications.length}
            trend={8}
            loading={loading}
          />
          <MetricCard
            icon={UserCheck}
            label="Shortlisted"
            value={shortlistedCount}
            trend={4}
            loading={loading}
          />
          <MetricCard
            icon={UserCircle}
            label="Profile Completion %"
            value={`${profileCompletion}%`}
            trend={3}
            loading={loading}
          />
          <MetricCard
            icon={Target}
            label="Placement Readiness"
            value={`${readinessScore}%`}
            trend={5}
            loading={loading}
          />
        </>
      }
      analyticsTitle="Profile Strength"
      analyticsSubtitle="Improve your profile to boost placement readiness"
      activityTitle="Recent Activity"
      activitySubtitle="Your latest placement actions"
      primaryContent={
        jobCards.length > 0 ? (
          <div className="job-opp-scroll">
            {jobCards.map((job) => (
              <JobOpportunityCard key={job.id} job={job} />
            ))}
          </div>
        ) : loading ? (
          <div style={{ display: 'flex', gap: '0.85rem' }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="skeleton-block"
                style={{ height: 200, flex: 1, borderRadius: '0.95rem' }}
              />
            ))}
          </div>
        ) : (
          <p className="dashboard-empty">
            No open opportunities at the moment. Check back soon!
          </p>
        )
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
          <div className="suggestion-panel" style={{ marginTop: '0.65rem' }}>
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
            title="Browse Jobs"
            description="Explore all open opportunities"
            icon={Search}
          />
          <QuickActionCard
            to="/student/profile"
            title="Update Profile"
            description="Keep academics and skills fresh"
            icon={FilePenLine}
          />
          <QuickActionCard
            to="/student/upload-resume"
            title="Upload Resume"
            description="Share latest CV with recruiters"
            icon={Upload}
          />
          <QuickActionCard
            to="/student/interview-schedule"
            title="Interview Schedule"
            description="Track tests and interview slots"
            icon={CalendarClock}
          />
          <QuickActionCard
            to="/student/dashboard?tool=ai"
            title="AI Mock Interview"
            description="Practice role-based questions"
            icon={Sparkles}
            onClick={handleAiMockInterview}
          />
        </div>
      }
      insights={<SuggestionPanel title="AI Insights" items={insightSuggestions} />}
    />
  )
}

export default StudentDashboardHome
