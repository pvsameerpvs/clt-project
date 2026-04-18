import type { Metadata } from "next"
import { ContentCard } from "@/components/company/content-card"
import { PageHero } from "@/components/company/page-hero"
import { RelatedPages } from "@/components/company/related-pages"
import { companyPageLinks } from "@/lib/company-content"

export const metadata: Metadata = {
  title: "Clean Eau De Parfum | CLE DXB Perfumes",
  description: "Formula standards and clean perfume positioning of Cle DXB.",
}

export default function CleanEauDeParfumPage() {
  return (
    <div className="bg-white text-black">
      <PageHero
        eyebrow="Clean Eau De Parfum"
        title="High Concentrate, Cleaner Formula Direction"
        description="All our perfumes contain 30% perfume concentrate, one of the highest levels in the industry. Every formula is 100% cruelty-free with no preservatives, GMO, CRM, phthalates, or paraffin."
        imageSrc="/clean-eau-de-parfum.jpeg"
        imageAlt="Clean formula fragrance"
        tags={["30% Concentrate", "Cruelty-Free", "No Phthalates"]}
        primaryAction={{ label: "Ingredients", href: "/ingredients" }}
        secondaryAction={{ label: "Sustainability", href: "/sustainability" }}
      />

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-12 md:px-8 md:py-16 lg:grid-cols-2">
        <ContentCard
          title="Performance And Character"
          paragraphs={[
            "A 30% perfume concentrate profile is chosen to support stronger projection and longer wear.",
            "The objective is to deliver clear scent identity while maintaining refinement in daily use.",
          ]}
        />
        <ContentCard
          title="Ingredient Standards"
          paragraphs={[
            "Our clean direction excludes preservatives, GMO, CRM, phthalates, and paraffin.",
            "This policy works together with responsible ingredient sourcing and transparent declarations.",
          ]}
          highlight
        />
      </section>

      <RelatedPages
        pages={companyPageLinks.filter((item) => ["/ingredients", "/sustainability", "/returns-refund-policy"].includes(item.href))}
      />
    </div>
  )
}
