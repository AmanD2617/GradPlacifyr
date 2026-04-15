import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider, useToast } from './components/ui/Toast'
import { getRoleTheme } from './utils/roleConfig'
import type { Role } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import RoleSelectionPage from './pages/auth/RoleSelectionPage'
import ProtectedRoute from './components/routing/ProtectedRoute'
import PortalLayout from './components/layout/PortalLayout'
import PublicInfoPage from './pages/public/PublicInfoPage'
import RecruitmentProcessPage from './pages/public/RecruitmentProcessPage'
import PlacementStatisticsPage from './pages/public/PlacementStatisticsPage'
import AboutPage from './pages/public/AboutPage'
import StudentDashboardHome from './pages/student/StudentDashboardHome'
import StudentProfile from './pages/student/StudentProfile'
import StudentChangePassword from './pages/student/StudentChangePassword'
import AvailableJobsPage from './pages/student/AvailableJobsPage'
import JobDetailsPage from './pages/student/JobDetailsPage'
import AppliedJobsPage from './pages/student/AppliedJobsPage'
import CompanyDashboardHome from './pages/company/CompanyDashboardHome'
import AdminDashboardHome from './pages/admin/AdminDashboardHome'
// StudentEditProfilePage removed — merged into StudentProfile
import StudentUploadResumePage from './pages/student/StudentUploadResumePage'
import StudentInterviewSchedulePage from './pages/student/StudentInterviewSchedulePage'
import CompanyPostJobPage from './pages/company/CompanyPostJobPage'
import CompanyManageJobsPage from './pages/company/CompanyManageJobsPage'
import CompanyApplicantsPage from './pages/company/CompanyApplicantsPage'
import CompanyShortlistPage from './pages/company/CompanyShortlistPage'
import CompanyUploadResultsPage from './pages/company/CompanyUploadResultsPage'
import CompanyRoundsPage from './pages/company/CompanyRoundsPage'
import TpoApproveJobsPage from './pages/tpo/TpoApproveJobsPage'
import TpoMonitorApplicationsPage from './pages/tpo/TpoMonitorApplicationsPage'
import TpoReportsPage from './pages/tpo/TpoReportsPage'
import AdminManageStudentsPage from './pages/admin/AdminManageStudentsPage'
import AdminManageCompaniesPage from './pages/admin/AdminManageCompaniesPage'
import AdminManageTPOPage from './pages/admin/AdminManageTPOPage'
import RecruiterProfile from './pages/recruiter/RecruiterProfile'
import RecruiterChangePassword from './pages/recruiter/RecruiterChangePassword'
import AdminProfile from './pages/admin/AdminProfile'
import AdminChangePassword from './pages/admin/AdminChangePassword'
import TpoDashboardHome from './pages/tpo/TpoDashboardHome'
import './App.css'

/** Listens for the login CustomEvent and shows a role-themed toast */
function LoginToastListener() {
  const { showToast } = useToast()

  useEffect(() => {
    const handler = (e: Event) => {
      const role = (e as CustomEvent).detail?.role as Role | undefined
      if (role) {
        const theme = getRoleTheme(role)
        showToast(`Welcome! Signed in as ${theme.label}`, role)
      }
    }
    window.addEventListener('placement:login', handler)
    return () => window.removeEventListener('placement:login', handler)
  }, [showToast])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
      <AuthProvider>
      <LoginToastListener />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/recruitment-process" element={<RecruitmentProcessPage />} />
          <Route path="/placement-statistics" element={<PlacementStatisticsPage />} />
          <Route path="/contact" element={
            <PublicInfoPage
              title="Contact Placement Office"
              intro="Get in touch with the JIMS Rohini Sector-5 Training and Placement team for support."
              highlights={[
                'Office timings and location',
                'Official contact email and phone',
                'Student and recruiter helpdesk',
              ]}
            />
          } />

          <Route path="/role-selection" element={<RoleSelectionPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/recruiter/dashboard" element={<Navigate to="/company/dashboard" replace />} />

          <Route element={<ProtectedRoute allowedRoles={['student', 'recruiter', 'admin', 'hod', 'tpo']} />}>
            <Route element={<PortalLayout />}>
              <Route path="/student/dashboard" element={<StudentDashboardHome />} />
              <Route path="/student/profile" element={<StudentProfile />} />
              {/* edit-profile merged into /student/profile — redirect for bookmarks */}
              <Route path="/student/edit-profile" element={<Navigate to="/student/profile" replace />} />
              <Route path="/student/upload-resume" element={<StudentUploadResumePage />} />
              <Route path="/student/jobs" element={<AvailableJobsPage />} />
              <Route path="/student/jobs/:id" element={<JobDetailsPage />} />
              <Route path="/student/applied-jobs" element={<AppliedJobsPage />} />
              <Route path="/student/interview-schedule" element={<StudentInterviewSchedulePage />} />
              <Route path="/student/change-password" element={<StudentChangePassword />} />

              <Route path="/company/dashboard" element={<CompanyDashboardHome />} />
              <Route path="/company/profile" element={<RecruiterProfile />} />
              <Route path="/company/post-job" element={<CompanyPostJobPage />} />
              <Route path="/company/manage-jobs" element={<CompanyManageJobsPage />} />
              <Route path="/company/applicants" element={<CompanyApplicantsPage />} />
              <Route path="/company/shortlist" element={<CompanyShortlistPage />} />
              <Route path="/company/rounds" element={<CompanyRoundsPage />} />
              <Route path="/company/upload-results" element={<CompanyUploadResultsPage />} />
              <Route path="/company/change-password" element={<RecruiterChangePassword />} />

              {/* ── TPO routes (dedicated dashboard + reused page components) ── */}
              <Route path="/tpo/dashboard" element={<TpoDashboardHome />} />
              <Route path="/tpo/profile" element={<AdminProfile />} />
              <Route path="/tpo/change-password" element={<AdminChangePassword />} />
              <Route path="/tpo/manage-students" element={<AdminManageStudentsPage />} />
              <Route path="/tpo/manage-companies" element={<AdminManageCompaniesPage />} />
              <Route path="/tpo/approve-jobs" element={<TpoApproveJobsPage />} />
              <Route path="/tpo/monitor-applications" element={<TpoMonitorApplicationsPage />} />
              <Route path="/tpo/rounds" element={<CompanyRoundsPage />} />
              <Route path="/tpo/reports" element={<TpoReportsPage />} />

              {/* ── Admin routes ── */}
              <Route path="/admin/dashboard" element={<AdminDashboardHome />} />
              <Route path="/admin/profile" element={<AdminProfile />} />
              <Route path="/admin/change-password" element={<AdminChangePassword />} />
              <Route path="/admin/manage-students" element={<AdminManageStudentsPage />} />
              <Route path="/admin/manage-companies" element={<AdminManageCompaniesPage />} />
              <Route path="/admin/manage-tpo" element={<AdminManageTPOPage />} />
              <Route path="/admin/approve-jobs" element={<TpoApproveJobsPage />} />
              <Route path="/admin/monitor-applications" element={<TpoMonitorApplicationsPage />} />
              <Route path="/admin/reports" element={<TpoReportsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
