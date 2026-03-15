import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Gift } from "lucide-react"
import { products } from "@/lib/products"
import { ProductCard } from "@/components/product/product-card"

export default function SignatureSetsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Banner */}
      <div className="bg-[#F3F0EA] py-24 relative overflow-hidden flex items-center justify-center">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-10 mix-blend-multiply" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-neutral-600 hover:text-black transition-colors mb-12">
            <ArrowLeft className="h-4 w-4" /> Return to Boutique
          </Link>

          <div className="max-w-3xl">
            <Gift className="h-12 w-12 text-neutral-400 mb-6" />
            <h1 className="text-5xl md:text-7xl font-serif font-light text-neutral-900 mb-6 leading-tight">
              Signature Sets
            </h1>
            <p className="text-xl md:text-2xl font-light text-neutral-600 leading-relaxed max-w-xl">
              Curated collections of our finest scents, beautifully bundled and packaged.
            </p>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="container mx-auto px-4 md:px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Image Pane */}
          <div className="relative aspect-[4/5] w-full max-h-[800px] overflow-hidden shadow-2xl bg-neutral-100">
             <Image 
               src="/Philosophy.png"
               alt="Signature Sets"
               fill
               className="object-cover scale-105 hover:scale-110 transition-transform duration-1000 grayscale hover:grayscale-0"
               priority
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>

          {/* Details Pane */}
          <div className="space-y-12">
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">The Details</span>
              <h2 className="text-3xl md:text-4xl font-serif text-neutral-900 leading-tight">Exclusive Perks & Specifications</h2>
            </div>
            
            <ul className="space-y-8">
              <li className="flex items-start gap-6">
                <span className="text-sm font-serif italic text-neutral-400 shrink-0 mt-1">01</span>
                <p className="text-neutral-600 font-light leading-relaxed text-lg">
                  Select any 3 full-size fragrances and receive a bespoke leather traveler case.
                </p>
              </li>
              <li className="flex items-start gap-6">
                <span className="text-sm font-serif italic text-neutral-400 shrink-0 mt-1">02</span>
                <p className="text-neutral-600 font-light leading-relaxed text-lg">
                  Each set is hand-packaged with our signature black ribbon and a personalized card.
                </p>
              </li>
              <li className="flex items-start gap-6">
                <span className="text-sm font-serif italic text-neutral-400 shrink-0 mt-1">03</span>
                <p className="text-neutral-600 font-light leading-relaxed text-lg">
                  Discover complementary notes perfectly matched by our master perfumers.
                </p>
              </li>
            </ul>

            <div className="pt-8 border-t border-neutral-100">
              <Button className="h-16 px-10 rounded-none bg-black text-white hover:bg-neutral-800 uppercase tracking-widest text-sm font-medium transition-all w-full sm:w-auto">
                Shop Sets Now
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Eligible Items Section */}
      <div className="bg-neutral-50 py-24 border-t border-neutral-100">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Shop The Offer</span>
              <h2 className="text-3xl md:text-5xl font-serif font-medium tracking-tight text-neutral-900">
                Eligible Items
              </h2>
            </div>
            <Button variant="link" className="text-black underline-offset-4 hover:text-neutral-600 px-0">
              View All Eligible
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
