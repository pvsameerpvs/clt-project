import type { Metadata } from "next"
import { ContentCard } from "@/components/company/content-card"
import { PageHero } from "@/components/company/page-hero"
import { RelatedPages } from "@/components/company/related-pages"
import { companyPageLinks } from "@/lib/company-content"

export const metadata: Metadata = {
  title: "Returns & Refund Policy | CLE Perfumes",
  description: "Returns and refund policy for Cle DXB perfumes.",
}

const nonReturnableItems = [
  "Opened or used perfumes",
  "Items with damaged or missing packaging or safety seals",
  "Products damaged by misuse or improper storage",
  "Customized or special-order perfumes",
]

export default function ReturnsRefundPolicyPage() {
  return (
    <div className="bg-white text-black">
      <PageHero
        eyebrow="Policy"
        title="Returns & Refund Policy"
        description="Returns are accepted within 30 days from the date of purchase in accordance with UAE consumer protection regulations. This policy applies to perfumes only."
        imageSrc="/prfume-bannar-2.jpg"
        imageAlt="Returns and policy visual"
        tags={["30 Days", "Perfumes Only", "UAE Consumer Rules"]}
        primaryAction={{ label: "Contact Us", href: "/contact-us" }}
        secondaryAction={{ label: "About", href: "/about" }}
      />

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-12 md:px-6 md:py-16 lg:grid-cols-2">
        <ContentCard
          title="Eligibility Conditions"
          paragraphs={[
            "To be eligible for returns, perfumes must be unused, unopened, in original condition, and in original sealed packaging.",
            "Opened or used perfumes cannot be returned or exchanged for hygiene and safety reasons, unless proven defective or damaged upon delivery.",
            "A valid receipt or proof of purchase is required for all returns.",
          ]}
        />

        <ContentCard title="Non-Returnable Items" highlight>
          <ul className="list-disc space-y-2 pl-5">
            {nonReturnableItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </ContentCard>

        <ContentCard
          title="Damaged, Leaking, or Defective Perfumes"
          paragraphs={[
            "Customers must contact us within 48 hours of delivery with clear photos or videos.",
            "Once verified, a replacement of the same item or a refund to the original payment method will be offered.",
            "Exchanges are only offered for defective or damaged perfumes and are subject to availability for the same item.",
          ]}
        />

        <ContentCard
          title="Refund Processing"
          paragraphs={[
            "Approved refunds are processed after inspection and credited to the original payment method within a reasonable timeframe, subject to bank and payment provider processing times and in line with UAE and Shopify regulations.",
            "Only regular-priced perfumes are eligible for refunds. Sale or discounted perfumes are non-refundable unless defective upon delivery.",
          ]}
        />
      </section>

      <section className="border-t border-neutral-200 bg-black text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-6 md:py-12">
          <div>
            <h2 className="font-serif text-2xl">Support Contact</h2>
            <p className="mt-2 text-sm text-neutral-300">For assistance, contact us at cleperfumes@gmail.com</p>
          </div>
          <a
            className="inline-flex rounded-full border border-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] transition hover:bg-white hover:text-black"
            href="mailto:cleperfumes@gmail.com"
          >
            Email Support
          </a>
        </div>
      </section>

      <RelatedPages
        pages={companyPageLinks.filter((item) => ["/contact-us", "/ingredients", "/terms-of-service"].includes(item.href))}
      />
    </div>
  )
}
