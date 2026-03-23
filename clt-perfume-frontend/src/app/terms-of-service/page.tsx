import type { Metadata } from "next"
import { ContentCard } from "@/components/company/content-card"
import { PageHero } from "@/components/company/page-hero"

export const metadata: Metadata = {
  title: "Terms of Service | CLE Perfumes",
  description: "Terms and conditions for purchasing Cle DXB products.",
}

export default function TermsOfServicePage() {
  return (
    <div className="bg-white text-black">
      <PageHero
        eyebrow="Legal"
        title="Terms Of Service"
        description="These terms govern the use of the Cle DXB website and perfume purchases made through our platform."
        imageSrc="/best-deals-sets-2.png"
        imageAlt="Terms and conditions visual"
        tags={["Orders", "Payments", "Customer Responsibilities"]}
        primaryAction={{ label: "Returns Policy", href: "/returns-refund-policy" }}
        secondaryAction={{ label: "Privacy Policy", href: "/privacy-policy" }}
      />

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-12 md:px-6 md:py-16">
        <ContentCard
          title="Order Terms"
          paragraphs={[
            "By placing an order, customers confirm that submitted billing, shipping, and contact details are accurate.",
            "Availability, pricing, and promotional offers may change without prior notice.",
          ]}
        />
        <ContentCard
          title="Returns And Defects"
          paragraphs={[
            "Returns and exchanges follow the published Returns & Refund Policy and apply to perfumes only.",
            "Defective or damaged item claims must be reported within 48 hours of delivery with visual proof.",
          ]}
        />
        <ContentCard
          title="Support Contact"
          paragraphs={[
            "For questions regarding these terms, contact cleperfumes@gmail.com.",
          ]}
          highlight
        />
      </section>
    </div>
  )
}
