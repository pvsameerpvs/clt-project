import type { Metadata } from "next"
import { ContentCard } from "@/components/company/content-card"
import { PageHero } from "@/components/company/page-hero"
import { RelatedPages } from "@/components/company/related-pages"
import { companyPageLinks } from "@/lib/company-content"

export const metadata: Metadata = {
  title: "Contact Us | CLE Perfumes",
  description: "Customer support and returns support details for Cle DXB.",
}

export default function ContactUsPage() {
  return (
    <div className="bg-white text-black">
      <PageHero
        eyebrow="Contact Us"
        title="Customer Support"
        description="For assistance with orders, delivery concerns, and returns, contact our support team by email. For damaged, leaking, or defective perfume claims, share clear photos or videos within 48 hours of delivery."
        imageSrc="/prfume-bannar-1.jpg"
        imageAlt="Customer support visual"
        tags={["Email Support", "48-Hour Defect Reporting", "Order Assistance"]}
        primaryAction={{ label: "Returns Policy", href: "/returns-refund-policy" }}
        secondaryAction={{ label: "About", href: "/about" }}
      />

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-12 md:px-8 md:py-16 lg:grid-cols-2">
        <ContentCard
          title="Support Email"
          paragraphs={[
            "Primary support email: cleperfumes@gmail.com",
            "Please include your order number and key issue details so we can respond faster.",
          ]}
        >
          <a
            href="mailto:cleperfumes@gmail.com"
            className="inline-flex rounded-full border border-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-black transition hover:bg-black hover:text-white"
          >
            Contact Support
          </a>
        </ContentCard>
        <ContentCard
          title="Defective Item Reporting"
          paragraphs={[
            "If a perfume arrives damaged, leaking, or defective, contact us within 48 hours of delivery.",
            "After verification, we offer a replacement of the same item (subject to availability) or a refund to the original payment method.",
          ]}
          highlight
        />
      </section>

      <RelatedPages
        pages={companyPageLinks.filter((item) => ["/returns-refund-policy", "/about", "/ingredients"].includes(item.href))}
      />
    </div>
  )
}
