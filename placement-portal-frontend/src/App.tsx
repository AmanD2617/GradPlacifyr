import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import RoleSelectionPage from './pages/auth/RoleSelectionPage'
import ProtectedRoute from './components/routing/ProtectedRoute'
import PortalLayout from './components/layout/PortalLayout'
import PublicInfoPage from './pages/public/PublicInfoPage'
import StudentDashboardHome from './pages/student/StudentDashboardHome'
import StudentProfile from './pages/student/StudentProfile'
import StudentChangePassword from './pages/student/StudentChangePassword'
import AvailableJobsPage from './pages/student/AvailableJobsPage'
import JobDetailsPage from './pages/student/JobDetailsPage'
import AppliedJobsPage from './pages/student/AppliedJobsPage'
import CompanyDashboardHome from './pages/company/CompanyDashboardHome'
import TpoDashboardHome from './pages/tpo/TpoDashboardHome'
import AdminDashboardHome from './pages/admin/AdminDashboardHome'
import StudentEditProfilePage from './pages/student/StudentEditProfilePage'
import StudentUploadResumePage from './pages/student/StudentUploadResumePage'
import StudentInterviewSchedulePage from './pages/student/StudentInterviewSchedulePage'
import CompanyPostJobPage from './pages/company/CompanyPostJobPage'
import CompanyManageJobsPage from './pages/company/CompanyManageJobsPage'
import CompanyApplicantsPage from './pages/company/CompanyApplicantsPage'
import CompanyShortlistPage from './pages/company/CompanyShortlistPage'
import CompanyUploadResultsPage from './pages/company/CompanyUploadResultsPage'
import TpoApproveJobsPage from './pages/tpo/TpoApproveJobsPage'
import TpoMonitorApplicationsPage from './pages/tpo/TpoMonitorApplicationsPage'
import TpoReportsPage from './pages/tpo/TpoReportsPage'
import AdminManageStudentsPage from './pages/admin/AdminManageStudentsPage'
import AdminManageCompaniesPage from './pages/admin/AdminManageCompaniesPage'
import RecruiterProfile from './pages/recruiter/RecruiterProfile'
import RecruiterChangePassword from './pages/recruiter/RecruiterChangePassword'
import AdminProfile from './pages/admin/AdminProfile'
import AdminChangePassword from './pages/admin/AdminChangePassword'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={
            <PublicInfoPage
              title="About Placement Cell"
              intro="JIMS Rohini Sector-5 Placement Cell supports students with training, internships, and recruitment drives."
              highlights={[
                'Dedicated TPO coordination',
                'Industry partnerships and on-campus drives',
                'Resume, aptitude, and interview mentoring',
              ]}
            />
          } />
          <Route path="/recruitment-process" element={
            <PublicInfoPage
              title="Recruitment Process"
              intro="The process follows registration, eligibility screening, tests, interviews, and final selection for JIMS Rohini Sector-5."
              highlights={[
                'Job publication and eligibility checks',
                'Aptitude/technical rounds and shortlisting',
                'Final interview and offer confirmation',
              ]}
            />
          } />
          <Route path="/placement-statistics" element={
            <PublicInfoPage
              title="Placement Statistics"
              intro="Department-wise and year-wise placement outcomes at JIMS Rohini Sector-5."
              highlights={[
                'Placement percentage trends',
                'Highest and average package reports',
                'Company participation counts',
              ]}
            />
          } />
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

          <Route element={<ProtectedRoute allowedRoles={['student', 'recruiter', 'admin', 'hod']} />}>
            <Route element={<PortalLayout />}>
              <Route path="/student/dashboard" element={<StudentDashboardHome />} />
              <Route path="/student/profile" element={<StudentProfile />} />
              <Route path="/student/edit-profile" element={<StudentEditProfilePage />} />
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
              <Route path="/company/upload-results" element={<CompanyUploadResultsPage />} />
              <Route path="/company/change-password" element={<RecruiterChangePassword />} />

              <Route path="/tpo/dashboard" element={<TpoDashboardHome />} />
              <Route path="/tpo/approve-jobs" element={<TpoApproveJobsPage />} />
              <Route path="/tpo/monitor-applications" element={<TpoMonitorApplicationsPage />} />
              <Route path="/tpo/reports" element={<TpoReportsPage />} />

              <Route path="/admin/dashboard" element={<AdminDashboardHome />} />
              <Route path="/admin/profile" element={<AdminProfile />} />
              <Route path="/admin/change-password" element={<AdminChangePassword />} />
              <Route path="/admin/manage-students" element={<AdminManageStudentsPage />} />
              <Route path="/admin/manage-companies" element={<AdminManageCompaniesPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
