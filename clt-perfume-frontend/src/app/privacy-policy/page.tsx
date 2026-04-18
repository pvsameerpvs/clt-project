import type { Metadata } from "next"
import Link from "next/link"
import { ContentCard } from "@/components/company/content-card"

export const metadata: Metadata = {
  title: "Privacy Policy | CLE DXB Perfumes",
  description: "Privacy policy overview for Cle DXB website customers.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white text-black min-h-screen selection:bg-black selection:text-white">
      {/* Text-Only Premium Hero */}
      <section className="relative border-b border-neutral-100 bg-neutral-50/50 py-20 lg:py-32 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-40">
           <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neutral-200/50 rounded-full blur-[120px]" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neutral-200/50 rounded-full blur-[120px]" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-1.5 mb-8 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-black animate-pulse" />
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-600">Legal Protection</p>
          </div>
          
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.1] text-neutral-900 mb-8 tracking-tight">
            Privacy <br className="hidden md:block" /> Policy
          </h1>
          
          <p className="text-lg md:text-xl font-light text-neutral-600 leading-relaxed mb-10 max-w-2xl mx-auto">
            Your trust is our most valuable asset. This policy outlines how Cle DXB handles your personal information 
            with the highest standards of security and transparency.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            {["Data Protection", "Order Security", "Encrypted Transactions"].map((tag) => (
              <span key={tag} className="px-4 py-1.5 rounded-full border border-neutral-200 bg-white text-[10px] uppercase tracking-widest font-bold text-neutral-500 shadow-sm">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <Link href="/terms-of-service" className="w-full sm:w-auto px-10 py-4 bg-black text-white rounded-full text-xs uppercase tracking-[0.15em] font-bold hover:bg-neutral-800 transition-all font-bold">
                Terms Of Service
             </Link>
             <Link href="/contact-us" className="w-full sm:w-auto px-10 py-4 border border-neutral-200 bg-white text-neutral-700 rounded-full text-xs uppercase tracking-[0.15em] font-bold hover:border-black hover:text-black transition-all">
                Contact Concierge
             </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <div className="grid grid-cols-1 gap-8">
          <ContentCard
            title="Data Collection"
            paragraphs={[
              "We collect only essential information required for secure account authentication, checkout processing, and white-glove delivery coordination.",
              "This data includes your name, verified contact details, shipping topography, and historical order transaction metadata necessary for our archive.",
              "Our collection happens via secure Shopify-integrated protocols and encrypted direct interactions."
            ]}
          />
          <ContentCard
            title="Strategic Data Usage"
            paragraphs={[
              "Your information is utilized solely to fulfill your olfactive desires: processing purchases, arranging boutique delivery, and managing order inquiries.",
              "We do not sell, trade, or share your personal identities with third-party marketing networks outside our core operational requirements.",
              "Security protocols are in place to prevent unauthorized access and ensure your privacy remains absolute."
            ]}
          />
          <ContentCard
            title="Information Rights"
            paragraphs={[
              "For any privacy-related corrections, documentation requests, or data erasure, please contact cleperfumes@gmail.com directly.",
              "Verification will be required to ensure the security of the account holder's data before any access is granted."
            ]}
            highlight
          />
        </div>
      </section>
    </div>
  )
}
