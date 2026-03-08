import LandingHeader from '../components/landing/LandingHeader'
import HeroSection from '../components/landing/HeroSection'
import StatsSection from '../components/landing/StatsSection'
import FeaturesSection from '../components/landing/FeaturesSection'
import ProcessSection from '../components/landing/ProcessSection'
import PlatformPreviewSection from '../components/landing/PlatformPreviewSection'
import TestimonialsSection from '../components/landing/TestimonialsSection'
import CTASection from '../components/landing/CTASection'
import LandingFooter from '../components/landing/LandingFooter'

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#edf2ff] text-slate-900">
      <LandingHeader />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <ProcessSection />
        <PlatformPreviewSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  )
}

export default LandingPage
