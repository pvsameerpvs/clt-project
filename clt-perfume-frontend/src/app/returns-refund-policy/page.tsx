import type { Metadata } from "next"
import Link from "next/link"
import { ContentCard } from "@/components/company/content-card"
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
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-600">Company Policy</p>
          </div>
          
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.1] text-neutral-900 mb-8 tracking-tight">
            Returns & <br className="hidden md:block" /> Refund Policy
          </h1>
          
          <p className="text-lg md:text-xl font-light text-neutral-600 leading-relaxed mb-10 max-w-2xl mx-auto">
            Our commitment to quality ensures every bottle of Cle DXB meets the highest standards. 
            All returns are processed in accordance with UAE consumer protection regulations.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            {["30 Day Window", "Perfumes Only", "Official UAE Standard"].map((tag) => (
              <span key={tag} className="px-4 py-1.5 rounded-full border border-neutral-200 bg-white text-[10px] uppercase tracking-widest font-bold text-neutral-500 shadow-sm">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <Link href="/contact-us" className="w-full sm:w-auto px-10 py-4 bg-black text-white rounded-full text-xs uppercase tracking-[0.15em] font-bold hover:bg-neutral-800 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/5">
                Submit A Request
             </Link>
             <Link href="/about" className="w-full sm:w-auto px-10 py-4 border border-neutral-200 bg-white text-neutral-700 rounded-full text-xs uppercase tracking-[0.15em] font-bold hover:border-black hover:text-black transition-all">
                The Cle Story
             </Link>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <ContentCard
            title="Eligibility Conditions"
            paragraphs={[
              "To be eligible for a return, perfumes must be entirely unused, unopened, and presented in their original factory-sealed packaging with all safety seals intact.",
              "Due to hygiene, health protection, and pharmaceutical safety standards (UAE DED), opened or tried fragrances cannot be returned or exchanged under any circumstances.",
              "A valid digital or physical receipt from Cle DXB is mandatory for all policy procedures."
            ]}
          />

          <ContentCard title="Non-Returnable Items" highlight>
            <ul className="list-disc space-y-3 pl-5 text-neutral-300">
              {nonReturnableItems.map((item) => (
                <li key={item} className="text-sm md:text-base leading-relaxed tracking-wide">{item}</li>
              ))}
            </ul>
          </ContentCard>

          <ContentCard
            title="Defective Shipments"
            paragraphs={[
              "In the rare event of a leak, pump failure, or damaged vessel upon arrival, please contact our concierge within 48 hours of delivery signature.",
              "Visual verification (photo/video) is required to initiate a high-priority exchange or a full refund to your original payment method.",
              "The replacement will be for the same olfactive reference, subject to boutique stock availability."
            ]}
          />

          <ContentCard
            title="Refund Processing"
            paragraphs={[
              "Once your return is inspected and approved by our quality control atelier, your refund will be processed immediately.",
              "Please allow 7-14 business days for funds to reflect in your account, depending on your banking institution's processing cycles.",
              "Note that promotional, sale, or archive collection items are final sale and non-refundable unless verified as defective."
            ]}
          />
        </div>

        {/* Professional Support Box */}
        <div className="mt-20 rounded-[32px] bg-black p-8 md:p-14 text-white overflow-hidden relative group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/10 transition-colors" />
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                 <h2 className="font-serif text-3xl md:text-4xl mb-4">Concierge Support</h2>
                 <p className="text-neutral-400 font-light max-w-md">Our team is available to assist with any policy inquiries or tracking requests. We aim to respond within 24 business hours.</p>
              </div>
              <a 
                href="mailto:cleperfumes@gmail.com" 
                className="px-12 py-5 bg-white text-black rounded-full text-xs uppercase tracking-[0.2em] font-bold hover:bg-neutral-100 transition-all hover:px-14 shadow-xl shadow-white/5"
              >
                Email Support
              </a>
           </div>
        </div>
      </section>

      <RelatedPages
        pages={companyPageLinks.filter((item) => ["/contact-us", "/ingredients", "/terms-of-service"].includes(item.href))}
      />
    </div>
  )
}
