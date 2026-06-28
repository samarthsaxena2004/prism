import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { FeatureGrid } from "@/components/feature-grid"
import { AboutSection } from "@/components/about-section"
import { Footer } from "@/components/footer"

export default function Page() {
  return (
    <div className="theme-brutalist bg-background text-foreground min-h-screen">
      <div className="min-h-screen dot-grid-bg">
        <Navbar />
        <main>
          <HeroSection />
          <FeatureGrid />
          <AboutSection />
        </main>
        <Footer />
      </div>
    </div>
  )
}
