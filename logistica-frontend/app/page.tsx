"use client"

import { ParticleCanvas } from "@/components/landing/particle-canvas"
import { Nav } from "@/components/landing/nav"
import { Hero } from "@/components/landing/hero"
import { LogoBar } from "@/components/landing/logo-bar"
import { Features } from "@/components/landing/features"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Testimonials } from "@/components/landing/testimonials"
import { CtaSection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"

export default function LandingPage() {
  return (
    <div className="landing-dark">
      <ParticleCanvas />
      <Nav />
      <main className="relative z-10 font-body">
        <Hero />
        <LogoBar />
        <Features />
        <HowItWorks />
        <Testimonials />
        <CtaSection />
      </main>
      <Footer />
    </div>
  )
}
