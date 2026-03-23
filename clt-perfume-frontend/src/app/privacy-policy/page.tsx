import type { Metadata } from "next"
import { ContentCard } from "@/components/company/content-card"
import { PageHero } from "@/components/company/page-hero"

export const metadata: Metadata = {
  title: "Privacy Policy | CLE Perfumes",
  description: "Privacy policy overview for Cle DXB website customers.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white text-black">
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        description="This page explains how Cle DXB handles personal information provided through orders, account activity, and customer support communications."
        imageSrc="/best-deals-sets.png"
        imageAlt="Privacy policy visual"
        tags={["Data Protection", "Order Information", "Customer Support"]}
        primaryAction={{ label: "Terms Of Service", href: "/terms-of-service" }}
        secondaryAction={{ label: "Contact Us", href: "/contact-us" }}
      />

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-12 md:px-6 md:py-16">
        <ContentCard
          title="Data We Collect"
          paragraphs={[
            "We collect only information required for account access, checkout, delivery coordination, and customer service.",
            "This can include name, contact details, delivery address, and order transaction metadata.",
          ]}
        />
        <ContentCard
          title="How Data Is Used"
          paragraphs={[
            "Data is used to process purchases, arrange delivery, manage returns, prevent fraud, and communicate order status.",
            "We do not use personal data for unrelated purposes outside operational needs and customer support.",
          ]}
        />
        <ContentCard
          title="Support And Requests"
          paragraphs={[
            "For privacy-related requests or corrections, contact cleperfumes@gmail.com from the email linked to your order or account.",
          ]}
          highlight
        />
      </section>
    </div>
  )
}
