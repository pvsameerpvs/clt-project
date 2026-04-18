import type { Metadata } from "next"
import { ContentCard } from "@/components/company/content-card"
import { PageHero } from "@/components/company/page-hero"
import { RelatedPages } from "@/components/company/related-pages"
import { companyPageLinks } from "@/lib/company-content"

export const metadata: Metadata = {
  title: "About Cle DXB | CLE DXB Perfumes",
  description:
    "Discover Cle DXB through our story, clean formula standards, sustainability values, and signature collection.",
}

export default function AboutPage() {
  return (
    <div className="bg-white text-black">
      <PageHero
        eyebrow="Company"
        title="A New Fragrance House Built In Dubai"
        description="Cle DXB debuts with a curated collection of five signature fragrances in 50 ml and 100 ml. Every page in this section gives you full detail on our story, formula standards, bottle design, and customer policies."
        imageSrc="/about-hero-section.png"
        imageAlt="Cle DXB fragrance collection"
        tags={["5 Signature Fragrances", "50 ml & 100 ml", "Clean Formula Focus"]}
        primaryAction={{ label: "Our Story", href: "/our-story" }}
        secondaryAction={{ label: "Returns Policy", href: "/returns-refund-policy" }}
      />

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-12 md:px-8 md:py-16 lg:grid-cols-2">
        <ContentCard
          title="Built For Quality And Transparency"
          paragraphs={[
            "Our philosophy is to pair perfume craftsmanship with clear communication. From ingredients to returns rules, we structure every detail so customers know exactly what they are buying.",
            "Each major topic now has its own page to keep information easy to find, easy to compare, and easy to trust.",
          ]}
        />
        <ContentCard
          title="Inside The Company Section"
          paragraphs={[
            "Explore dedicated pages for Our Story, Why Cle DXB, Bottle Design, Clean Eau De Parfum, Sustainability, Ingredients, Returns & Refund Policy, and Contact support.",
            "This section is now fully separated by route with no anchor-based navigation.",
          ]}
          highlight
        />
      </section>

      <RelatedPages title="Company Pages" pages={companyPageLinks.filter((item) => item.href !== "/about")} />
    </div>
  )
}
