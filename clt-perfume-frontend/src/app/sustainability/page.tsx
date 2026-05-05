import type { Metadata } from "next"
import { ContentCard } from "@/components/company/content-card"
import { PageHero } from "@/components/company/page-hero"
import { RelatedPages } from "@/components/company/related-pages"
import { companyPageLinks } from "@/lib/company-content"

export const metadata: Metadata = {
  title: "Sustainability | CLE Perfume",
  description: "CLE Perfume sustainability and transparency statement.",
}

export default function SustainabilityPage() {
  return (
    <div className="bg-white text-black">
      <PageHero
        eyebrow="Sustainability"
        title="Responsible By Design"
        description="We ensure sustainability and transparency by using clean, vegan, and responsibly sourced ingredients to reduce environmental impact without compromising quality."
        imageSrc="/sustainability-cle.jpg"
        imageAlt="Sustainable fragrance concept"
        tags={["Clean", "Vegan", "Responsibly Sourced"]}
        primaryAction={{ label: "Ingredients", href: "/ingredients" }}
        secondaryAction={{ label: "About", href: "/about" }}
      />

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-12 md:px-8 md:py-16 lg:grid-cols-2">
        <ContentCard
          title="Transparency Commitment"
          paragraphs={[
            "By eliminating intermediaries, we connect customers directly with Haute Couture perfumery oils.",
            "This improves traceability and supports consistency in purity, authenticity, and fairness.",
          ]}
        />
        <ContentCard
          title="Quality Without Compromise"
          paragraphs={[
            "Our sustainability model is built to protect formula quality while reducing avoidable environmental impact.",
            "The result is a clean product direction with clear sourcing values and better customer visibility.",
          ]}
          highlight
        />
      </section>

      <RelatedPages
        pages={companyPageLinks.filter((item) => ["/clean-eau-de-parfum", "/ingredients", "/bottle-design"].includes(item.href))}
      />
    </div>
  )
}
