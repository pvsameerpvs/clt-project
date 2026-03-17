"use client"

import { Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TickerPreviewProps {
  text: string
  onEditClick: () => void
}

export function TickerPreview({ text, onEditClick }: TickerPreviewProps) {
  return (
    <div className="group relative">
      <div className="bg-black text-white text-[10px] py-2 overflow-hidden flex rounded-t-2xl">
        <div className="animate-marquee whitespace-nowrap flex min-w-full">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="mx-8 uppercase tracking-widest font-medium">
              {text || "FREE SHIPPING ON ALL ORDERS OVER 200 AED 🚚 SHOP OUR NEW ARRIVALS NOW!"}
            </span>
          ))}
        </div>
      </div>
      
      {/* Edit Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-t-2xl z-20 pointer-events-none group-hover:pointer-events-auto">
         <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-black hover:bg-neutral-200 shadow-xl scale-95 group-hover:scale-100 transition-all duration-300"
            onClick={onEditClick}
         >
            <Edit3 className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Edit Announcement</span>
         </Button>
      </div>
    </div>
  )
}
