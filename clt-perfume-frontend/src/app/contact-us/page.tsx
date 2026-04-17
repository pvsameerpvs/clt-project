import type { Metadata } from "next"
import Link from "next/link"
import { RelatedPages } from "@/components/company/related-pages"
import { companyPageLinks } from "@/lib/company-content"
import { Mail, MessageSquare, Clock, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Contact Concierge | CLE Perfumes",
  description: "Boutique support and concierge services for Cle DXB.",
}

export default function ContactUsPage() {
  return (
    <div className="bg-white text-black min-h-screen selection:bg-black selection:text-white">
      {/* Premium Centered Hero */}
      <section className="relative border-b border-neutral-100 bg-neutral-50/50 py-20 lg:py-32 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-40">
           <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neutral-200/50 rounded-full blur-[120px]" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neutral-200/50 rounded-full blur-[120px]" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-1.5 mb-8 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-black animate-pulse" />
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-600">Boutique Concierge</p>
          </div>
          
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.1] text-neutral-900 mb-8 tracking-tight">
            How Can We <br className="hidden md:block" /> Assist You?
          </h1>
          
          <p className="text-lg md:text-xl font-light text-neutral-600 leading-relaxed mb-6 max-w-2xl mx-auto">
            Whether you need guidance on selecting a signature scent or assistance with an existing order, 
            our concierge team is here to provide exceptional service.
          </p>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
          
          {/* Left: Contact Info */}
          <div className="lg:col-span-5 space-y-12">
            <div>
              <h2 className="font-serif text-3xl mb-8 tracking-tight">Get in Touch</h2>
              <p className="text-neutral-500 font-light leading-relaxed mb-8">
                Our support atelier is available from Monday to Friday, 9:00 AM — 6:00 PM (GST). 
                We aim to respond to all inquiries within one business day.
              </p>
            </div>

            <div className="space-y-8">
              <div className="flex gap-5">
                <div className="h-12 w-12 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-900 shadow-sm">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-neutral-400 mb-2">Email Inquiries</h3>
                  <a href="mailto:cleperfumes@gmail.com" className="text-lg hover:text-neutral-500 transition-colors border-b border-neutral-200 pb-1">cleperfumes@gmail.com</a>
                </div>
              </div>

              <div className="flex gap-5">
                <div className="h-12 w-12 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-900 shadow-sm">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-neutral-400 mb-2">Press & Partnerships</h3>
                  <p className="text-lg text-neutral-800">For collaboration requests, please contact our administrative atelier by email.</p>
                </div>
              </div>

              <div className="flex gap-5">
                <div className="h-12 w-12 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-900 shadow-sm">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-neutral-400 mb-2">Support Hours</h3>
                  <p className="text-lg text-neutral-800">Mon — Fri: 9:00 - 18:00 (GST)<br />Sat — Sun: Limited Correspondence</p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-neutral-100">
               <div className="p-8 rounded-[32px] bg-neutral-900 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/10 transition-colors" />
                  <h3 className="font-serif text-xl mb-3">Damaged Products?</h3>
                  <p className="text-neutral-400 text-sm font-light leading-relaxed mb-6">If your perfume arrived damaged or leaking, please include clear photos in your email within 48 hours for a priority replacement.</p>
                  <Link href="/returns-refund-policy" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-white hover:gap-3 transition-all">
                    View Refund Policy <ArrowRight className="h-3 w-3" />
                  </Link>
               </div>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-[40px] border border-neutral-100 p-8 md:p-12 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.08)]">
              <h3 className="font-serif text-2xl mb-8">Send a Message</h3>
              <form className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 pl-1">Full Name</label>
                       <input type="text" placeholder="Your name" className="w-full h-14 px-6 rounded-2xl bg-neutral-50 border border-transparent focus:border-black focus:bg-white text-sm outline-none transition-all placeholder:text-neutral-300" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 pl-1">Email Address</label>
                       <input type="email" placeholder="you@example.com" className="w-full h-14 px-6 rounded-2xl bg-neutral-50 border border-transparent focus:border-black focus:bg-white text-sm outline-none transition-all placeholder:text-neutral-300" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 pl-1">Subject</label>
                    <input type="text" placeholder="How can we help?" className="w-full h-14 px-6 rounded-2xl bg-neutral-50 border border-transparent focus:border-black focus:bg-white text-sm outline-none transition-all placeholder:text-neutral-300" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 pl-1">Message</label>
                    <textarea placeholder="Tell us more details..." className="w-full h-40 p-6 rounded-2xl bg-neutral-50 border border-transparent focus:border-black focus:bg-white text-sm outline-none transition-all resize-none placeholder:text-neutral-300"></textarea>
                 </div>
                 <button className="w-full h-16 bg-black text-white rounded-2xl text-xs uppercase tracking-[0.2em] font-bold hover:bg-neutral-800 transition-all transform hover:translate-y-[-2px] active:translate-y-[0] shadow-xl shadow-black/10">
                    Send Inquiry
                 </button>
              </form>
            </div>
          </div>

        </div>
      </section>

      <RelatedPages
        pages={companyPageLinks.filter((item) => ["/returns-refund-policy", "/about", "/ingredients"].includes(item.href))}
      />
    </div>
  )
}
