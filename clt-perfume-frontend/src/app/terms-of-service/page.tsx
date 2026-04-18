import type { Metadata } from "next"
import Link from "next/link"
import { ContentCard } from "@/components/company/content-card"

export const metadata: Metadata = {
  title: "Terms of Service | CLE DXB Perfumes",
  description: "Terms and conditions for purchasing Cle DXB products.",
}

export default function TermsOfServicePage() {
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
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-600">Site Governance</p>
          </div>
          
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.1] text-neutral-900 mb-8 tracking-tight">
            Terms Of <br className="hidden md:block" /> Service
          </h1>
          
          <p className="text-lg md:text-xl font-light text-neutral-600 leading-relaxed mb-10 max-w-2xl mx-auto">
            These terms govern the use of the Cle DXB digital platform and the purchase of our signature fragrances. 
            By interacting with our boutique, you agree to these legal standards.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            {["Secure Commerce", "Product Integrity", "Customer Agreements"].map((tag) => (
              <span key={tag} className="px-4 py-1.5 rounded-full border border-neutral-200 bg-white text-[10px] uppercase tracking-widest font-bold text-neutral-500 shadow-sm">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <Link href="/privacy-policy" className="w-full sm:w-auto px-10 py-4 bg-black text-white rounded-full text-xs uppercase tracking-[0.15em] font-bold hover:bg-neutral-800 transition-all font-bold">
                Privacy Policy
             </Link>
             <Link href="/returns-refund-policy" className="w-full sm:w-auto px-10 py-4 border border-neutral-200 bg-white text-neutral-700 rounded-full text-xs uppercase tracking-[0.15em] font-bold hover:border-black hover:text-black transition-all">
                Returns Policy
             </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <div className="grid grid-cols-1 gap-8">
          <ContentCard
            title="Commercial Agreements"
            paragraphs={[
              "By initializing a transaction with Cle DXB, you affirm that all billing and logistics details submitted are accurate and legitimate.",
              "Product availability and boutique pricing are subject to adjustment based on global essence sourcing and production limited-edition cycles.",
              "Cle DXB reserves the right to decline any order suspected of fraudulent intent or unauthorized commercial resale."
            ]}
          />
          <ContentCard
            title="Product Experience"
            paragraphs={[
              "Our fragrances are handcrafted with premium concentrates. We ensure product integrity up to the moment of delivery signature.",
              "Any claims regarding bottle defects or shipping damage must be formalized through our concierge within 48 hours as per our Returns & Refund Policy.",
              "Users are responsible for maintaining the security of their boutique account credentials and order access tokens."
            ]}
          />
          <ContentCard
            title="Contact & Disputes"
            paragraphs={[
              "For inquiries concerning these governance terms, please reach our administrative atelier at cleperfumes@gmail.com.",
              "We strive to resolve any disagreements through direct concierge dialogue before escalating to official regional standard procedures."
            ]}
            highlight
          />
        </div>
      </section>
    </div>
  )
}
