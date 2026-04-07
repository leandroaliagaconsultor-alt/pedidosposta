import { Header } from "@/components/landing/header"
import { Hero } from "@/components/landing/hero"
import { CommissionComparison } from "@/components/landing/commission-comparison"
import { ProblemSection } from "@/components/landing/problem-section"
import { FeaturesShowcase } from "@/components/landing/features-showcase"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Pricing } from "@/components/landing/pricing"
import { FAQ } from "@/components/landing/faq"
import { CTA } from "@/components/landing/cta"
import { Footer } from "@/components/landing/footer"

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PedidosPosta",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: "Sistema de pedidos online para gastronomicos. Menu digital, checkout profesional, 0% comisiones.",
  url: "https://pedidosposta.com",
  offers: {
    "@type": "Offer",
    price: "60000",
    priceCurrency: "ARS",
    description: "Plan Full Commerce - Todo incluido",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "500",
  },
}

export default function LandingPage() {
  return (
    <main id="main" className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <Hero />
      <CommissionComparison />
      <ProblemSection />
      <FeaturesShowcase />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  )
}
