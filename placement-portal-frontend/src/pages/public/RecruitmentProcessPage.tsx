import LandingHeader from '../../components/landing/LandingHeader'
import ProcessSection from '../../components/landing/ProcessSection'
import LandingFooter from '../../components/landing/LandingFooter'

const RecruitmentProcessPage = () => {
  return (
    <div className="min-h-screen bg-[#edf2ff] text-slate-900">
      <LandingHeader />
      <main className="py-8 md:py-12">
        <ProcessSection />
      </main>
      <LandingFooter />
    </div>
  )
}

export default RecruitmentProcessPage
