"use client"

import { Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PocketPreviewProps {
  configs: number[]
  onEditClick: () => void
}

export function PocketPreview({ configs, onEditClick }: PocketPreviewProps) {
  return (
    <div className="group relative">
      <section className="py-12 bg-white rounded-3xl border border-neutral-100 overflow-hidden">
        <div className="px-4 md:px-8">
          <div className="w-full bg-black p-8 flex flex-col items-center justify-between gap-8 h-auto rounded-3xl">
            <div className="flex flex-col text-center shrink-0">
              <h2 className="text-4xl md:text-5xl font-black tracking-[0.2em] text-white leading-none mb-1">POCKET</h2>
              {/* <p className="text-amber-500 text-xs tracking-[0.3em] uppercase font-bold mt-1 mb-4">Affordable Luxury</p> */}
              {/* <div className="w-24 h-[1px] bg-amber-500 mx-auto"></div> */}
            </div>

            <div className="flex flex-wrap justify-center gap-4 items-center">
              {configs.map((price: number, idx: number) => (
                <div
                  key={idx}
                  className="shrink-0 w-[90px] h-[90px] md:w-[120px] md:h-[110px] bg-white rounded-2xl flex flex-col items-center justify-center shadow-sm"
                >
                  <span className="text-[8px] md:text-xs font-black uppercase tracking-wider text-black">Under</span>
                  <span className="text-2xl md:text-4xl font-serif font-bold text-black my-1 leading-none">{price}</span>
                  <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-black">AED</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Edit Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-3xl z-20 pointer-events-none group-hover:pointer-events-auto">
         <Button 
            className="flex items-center gap-2 rounded-full bg-white px-8 py-6 text-black hover:bg-neutral-200 shadow-2xl scale-95 group-hover:scale-100 transition-all duration-300"
            onClick={onEditClick}
         >
            <Edit3 className="h-5 w-5" />
            <span className="font-bold uppercase tracking-widest text-[10px]">Edit Price Points</span>
         </Button>
      </div>
    </div>
  )
}
