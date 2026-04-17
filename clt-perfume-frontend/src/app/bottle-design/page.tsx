import type { Metadata } from "next"
import { ContentCard } from "@/components/company/content-card"
import { PageHero } from "@/components/company/page-hero"
import { RelatedPages } from "@/components/company/related-pages"
import { companyPageLinks } from "@/lib/company-content"

export const metadata: Metadata = {
  title: "Bottle Design | CLE Perfumes",
  description: "The Cle DXB bottle concept: art, function, and sustainability.",
}

export default function BottleDesignPage() {
  return (
    <div className="bg-white text-black">
      <PageHero
        eyebrow="Bottle Design"
        title="A Bottle Beyond Convention"
        description="At Cle DXB, we believe the bottle should be as expressive as the scent itself. After one year of design and development, we created a sculptural vessel that combines artistry, function, sustainability, and creative expression."
        imageSrc="/prfume-bannar-2.jpg"
        imageAlt="Cle DXB bottle design concept"
        tags={["Art Meets Essence", "One Year Development", "Sculptural Form"]}
        primaryAction={{ label: "Our Story", href: "/our-story" }}
        secondaryAction={{ label: "Why Cle DXB", href: "/why-cle-dxb" }}
      />

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-12 md:px-8 md:py-16 lg:grid-cols-2">
        <ContentCard
          title="Form Meets Function"
          paragraphs={[
            "The bottle is designed as more than packaging. It works as a long-term object that carries the same creative value as the fragrance inside.",
            "Every contour and proportion was refined to balance visual identity and practical daily use.",
          ]}
        />
        <ContentCard
          title="Design With Responsibility"
          paragraphs={[
            "The concept aligns with our broader sustainability goals by prioritizing thoughtful development over disposable trends.",
            "This design process reflects our long-term brand language and product quality standards.",
          ]}
          highlight
        />
      </section>

      <RelatedPages
        pages={companyPageLinks.filter((item) => ["/our-story", "/sustainability", "/about"].includes(item.href))}
      />
    </div>
  )
}
