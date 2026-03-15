
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function BrandStory() {
  return (
    <section className="py-24 bg-neutral-900 text-white overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-[3/4] md:aspect-square w-full rounded-2xl overflow-hidden">
            <Image
              src="/Philosophy.png"
              alt="Perfume bottle on dark stone"
              fill
              className="object-cover grayscale contrast-125 hover:scale-105 transition-transform duration-700"
            />
          </div>
          
          <div className="space-y-8">
            <span className="text-xs uppercase tracking-[0.2em] text-neutral-400">Our Core Philosophy</span>
            <h2 className="text-4xl md:text-6xl font-serif font-light leading-tight">
              Crafted for the <br/> <span className="italic font-normal">Discerning Individual</span>
            </h2>
            <p className="text-neutral-300 text-lg font-light leading-relaxed max-w-md">
              A symphony of scents that transcends words. It is not just a perfume, but an extension of the ambition and authority of a true icon.
            </p>
            
            <div className="grid grid-cols-2 gap-8 py-8 border-t border-white/10 mt-8">
              <div>
                <h4 className="text-white text-xl font-serif mb-2">Clean Formulas</h4>
                <p className="text-neutral-500 text-sm">No heavy musk or sweetness. Just crisp, cool mineral finish.</p>
              </div>
              <div>
                <h4 className="text-white text-xl font-serif mb-2">Sustainable Sourcing</h4>
                <p className="text-neutral-500 text-sm">Ingredients ethically harvested from around the globe.</p>
              </div>
            </div>

            <Button variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-black rounded-none px-8 py-6 uppercase tracking-widest text-xs transition-colors duration-300">
              Read Our Story
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
