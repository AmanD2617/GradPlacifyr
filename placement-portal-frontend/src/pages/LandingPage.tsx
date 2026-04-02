import LandingHeader from '../components/landing/LandingHeader'
import HeroSection from '../components/landing/HeroSection'
import StatsSection from '../components/landing/StatsSection'
import TestimonialsSection from '../components/landing/TestimonialsSection'
import LandingFooter from '../components/landing/LandingFooter'

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#edf2ff] text-slate-900">
      <LandingHeader />
      <main>
        <HeroSection />
        <StatsSection />
        <TestimonialsSection />
      </main>
      <LandingFooter />
    </div>
  )
}

export default LandingPage
