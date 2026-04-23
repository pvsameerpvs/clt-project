"use client"
import Image from "next/image"
import { Promotion } from "@/lib/products"
import { Gift, Sparkles, CheckCircle2, Percent, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface GiftSelectorProps {
  promotions: Promotion[]
  selectedGiftId: string | null
  onSelect: (id: string | null) => void
  productName: string
}

export function GiftSelector({ promotions, selectedGiftId, onSelect, productName }: GiftSelectorProps) {
  if (promotions.length === 0) return null

  return (
    <div className="mb-10 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-5 px-1">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full bg-amber-50 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <span className="text-xs font-black uppercase tracking-[0.2em] text-neutral-900">
            Exclusive Selection
          </span>
        </div>
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[9px] font-black tracking-widest px-3 py-1">
          COMPLIMENTARY
        </Badge>
      </div>
      
      <p className="text-xs text-neutral-500 font-light italic mb-6 px-1">
        Enhance your {productName} experience with a curated gift of your choice.
      </p>

      <div className="grid grid-cols-1 gap-4">
        {promotions.map((promo) => {
          const isSelected = selectedGiftId === promo.child_id
          const gift = promo.gift
          if (!gift) return null

          const isFree = promo.discount_percentage === 100

          return (
            <button
              key={promo.id}
              onClick={() => onSelect(isSelected ? null : promo.child_id)}
              className={cn(
                "flex items-center justify-between p-5 rounded-[24px] border transition-all duration-500 text-left group relative overflow-hidden",
                isSelected 
                  ? "border-black bg-neutral-50 shadow-xl shadow-black/5 ring-1 ring-black" 
                  : "border-neutral-100 hover:border-neutral-900 bg-white"
              )}
            >
              {/* Animated Background Shine */}
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              )}

              <div className="flex items-center gap-5 relative z-10 w-full">
                <div className={cn(
                  "h-16 w-16 rounded-2xl overflow-hidden shrink-0 transition-all duration-500 border border-neutral-100 relative",
                  isSelected 
                    ? "rotate-[-6deg] scale-110 shadow-lg" 
                    : "group-hover:rotate-[-3deg]"
                )}>
                  {gift.images?.[0] ? (
                    <Image 
                      src={gift.images[0]} 
                      alt={gift.name} 
                      fill 
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-neutral-50 flex items-center justify-center text-neutral-300">
                      <Gift className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <p className="text-sm font-black text-neutral-900 group-hover:tracking-tight transition-all truncate">{gift.name}</p>
                  <p className="text-[10px] text-neutral-400 font-medium line-clamp-1 mb-2 italic">
                    {gift.description || 'Exclusive discovery item'}
                  </p>
                  <div className="flex items-center gap-2">
                    {isFree ? (
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                        Free Gift
                      </span>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                        <Percent size={10} />
                        <span>{promo.discount_percentage}% Discovery Offer</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="absolute right-5 top-1/2 -translate-y-1/2 z-10">
                {isSelected ? (
                  <CheckCircle2 className="h-6 w-6 text-black animate-in zoom-in duration-300" />
                ) : (
                  <div className="h-6 w-6 rounded-full border-2 border-neutral-100 group-hover:border-neutral-300 transition-colors" />
                )}
              </div>
            </button>
          )
        })}
      </div>
      
      {!selectedGiftId && (
        <div className="mt-5 p-4 rounded-2xl bg-amber-50/50 border border-amber-100/50 animate-in fade-in duration-1000">
          <p className="text-[10px] font-black text-amber-700 flex items-center gap-2 uppercase tracking-widest">
            <AlertCircle className="h-3.5 w-3.5" />
            Selection Required
          </p>
        </div>
      )}
    </div>
  )
}
