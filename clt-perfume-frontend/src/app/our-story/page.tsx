import type { Metadata } from "next"
import { ContentCard } from "@/components/company/content-card"
import { PageHero } from "@/components/company/page-hero"
import { RelatedPages } from "@/components/company/related-pages"
import { companyPageLinks } from "@/lib/company-content"

export const metadata: Metadata = {
  title: "Our Story | CLE Perfumes",
  description: "The brand story and launch vision behind Cle DXB.",
}

export default function OurStoryPage() {
  return (
    <div className="bg-white text-black">
      <PageHero
        eyebrow="Our Story"
        title="The Debut Of Cle DXB"
        description="Cle DXB launches with a curated collection of five signature fragrances, offered in 50 ml and 100 ml. The project was built to bring luxury fragrance quality into a cleaner, more transparent customer experience."
        imageSrc="/our-story.jpeg"
        imageAlt="Cle DXB story visual"
        tags={["Curated Launch", "Signature Fragrances", "Dubai"]}
        primaryAction={{ label: "Why Cle DXB", href: "/why-cle-dxb" }}
        secondaryAction={{ label: "About", href: "/about" }}
      />

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-12 md:px-8 md:py-16 lg:grid-cols-2">
        <ContentCard
          title="Our Launch Direction"
          paragraphs={[
            "The first collection focuses on five fragrances selected for personality range and wearability. The 50 ml and 100 ml format options are chosen to match both discovery and long-term use.",
            "Our objective is not just product variety, but disciplined curation with strong quality control.",
          ]}
        />
        <ContentCard
          title="Built Around Customer Clarity"
          paragraphs={[
            "We present company information in dedicated pages so customers can clearly review formulas, sustainability, policy terms, and support channels before buying.",
            "This approach strengthens trust and improves purchase confidence.",
          ]}
          highlight
        />
      </section>

      <RelatedPages
        title="Continue Exploring"
        pages={companyPageLinks.filter((item) => ["/why-cle-dxb", "/bottle-design", "/clean-eau-de-parfum"].includes(item.href))}
      />
    </div>
  )
}
