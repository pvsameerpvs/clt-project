"use client"

import { Edit3, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OffersPreviewProps {
  offers: any[]
  onEditClick: () => void
}

export function OffersPreview({ offers, onEditClick }: OffersPreviewProps) {
  const bgColors = ["bg-[#F3F0EA]", "bg-[#EBEFF5]", "bg-[#F5EBEB]"]

  return (
    <div className="group relative">
      <section className="py-12 bg-white rounded-3xl border border-neutral-100 px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {offers.map((card, idx) => {
              const defaultColors = ["bg-[#F3F0EA]", "bg-[#EBEFF5]", "bg-[#F5EBEB]"]
              const bgColor = card.bgColor || defaultColors[idx % 3]
              
              return (
                <div 
                  key={idx}
                  className={`${bgColor} p-8 h-[320px] flex flex-col justify-between group/card border border-black/5 rounded-[2rem] transition-transform hover:scale-[1.02] duration-300 relative overflow-hidden`}
                >
                  {card.badge && (
                    <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-black/5">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-black">{card.badge}</span>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-2xl font-serif mb-3 text-neutral-900 leading-tight">{card.title}</h3>
                    <p className="text-neutral-600 font-light text-[12px] leading-relaxed max-w-[200px]">
                      {card.description}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-black border-b border-black/20 w-fit pb-1 group-hover/card:border-black transition-colors">
                    {card.action || "Discover"} <ArrowRight className="w-3 h-3 group-hover/card:translate-x-1 transition-transform" />
                  </div>
                </div>
              )
            })}
        </div>
      </section>
      
      {/* Edit Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-3xl z-20 pointer-events-none group-hover:pointer-events-auto">
         <Button 
            className="flex items-center gap-2 rounded-full bg-white px-8 py-6 text-black hover:bg-neutral-200 shadow-2xl scale-95 group-hover:scale-100 transition-all duration-300"
            onClick={onEditClick}
         >
            <Edit3 className="h-5 w-5" />
            <span className="font-bold uppercase tracking-widest text-[10px]">Edit Promo Offers</span>
         </Button>
      </div>
    </div>
  )
}
