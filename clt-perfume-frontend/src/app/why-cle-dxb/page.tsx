import type { Metadata } from "next"
import { ContentCard } from "@/components/company/content-card"
import { PageHero } from "@/components/company/page-hero"
import { RelatedPages } from "@/components/company/related-pages"
import { companyPageLinks } from "@/lib/company-content"

export const metadata: Metadata = {
  title: "Why Cle DXB | CLE DXB Perfumes",
  description: "The brand philosophy behind personalization and scent identity.",
}

export default function WhyCleDxbPage() {
  return (
    <div className="bg-white text-black">
      <PageHero
        eyebrow="Why Cle DXB"
        title="Your Scent, Your Style"
        description="There are 8 billion people on the planet, each with different personality, memories, style, skin chemistry, and olfactive preferences. Personalization, education, creativity, and sustainability are at the center of Cle DXB."
        imageSrc="/why-cle-dxb.png"
        imageAlt="Personal fragrance expression"
        tags={["Personalization", "Education", "Creativity", "Sustainability"]}
        primaryAction={{ label: "Our Story", href: "/our-story" }}
        secondaryAction={{ label: "Clean Eau De Parfum", href: "/clean-eau-de-parfum" }}
      />

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-12 md:px-8 md:py-16 lg:grid-cols-2">
        <ContentCard
          title="Personal Fragrance Experience"
          paragraphs={[
            "No two wearers are identical. That is why our products and content are designed around individual preference and scent behavior.",
            "We focus on helping customers choose fragrance with more context, not just marketing terms.",
          ]}
        />
        <ContentCard
          title="Brand Priorities"
          paragraphs={[
            "We prioritize personalization, scent education, and creative expression while maintaining strict quality and sourcing standards.",
            "This is how Cle DXB combines modern perfume culture with practical customer trust.",
          ]}
          highlight
        />
      </section>

      <RelatedPages
        pages={companyPageLinks.filter((item) => ["/our-story", "/about", "/contact-us"].includes(item.href))}
      />
    </div>
  )
}
