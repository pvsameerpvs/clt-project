import { OfferCards } from "@/components/offer-cards"
import { Sparkles } from "lucide-react"
import { getSiteSettings } from "@/lib/api"

export default async function OffersPage() {
  const settings = await getSiteSettings()

  return (
    <div className="min-h-screen bg-white text-black pt-32 pb-12">
      <div className="container mx-auto px-4 md:px-6 mb-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center">
             <Sparkles className="h-6 w-6 text-neutral-400" />
          </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-serif text-neutral-900 mb-6">Exclusive Boutique Offers</h1>
        <p className="text-neutral-500 max-w-2xl mx-auto text-lg font-light leading-relaxed">
          Discover our curated selection of special privileges, complimentary gifts, and bespoke services designed to elevate your fragrance experience.
        </p>
      </div>
      
      <OfferCards initialOffers={settings?.offers} />
    </div>
  )
}
