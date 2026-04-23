"use client"
import Image from "next/image"

import { AdminProduct, Promotion } from "@/lib/admin-api"
import { Search, X, Gift, Percent, Plus, Check, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { cn } from "@/lib/utils"

export interface SelectedGift extends AdminProduct {
  discount: number
}

interface PromotionFormProps {
  products: AdminProduct[]
  isCreating: boolean
  onCreate: (parentId: string, gifts: SelectedGift[]) => Promise<void>
  existingPromotions?: Promotion[]
}

export function PromotionForm({ products, isCreating, onCreate, existingPromotions = [] }: PromotionFormProps) {
  const [parentId, setParentId] = useState("")
  const [searchParent, setSearchParent] = useState("")
  const [selectedGifts, setSelectedGifts] = useState<SelectedGift[]>([])
  const [searchGift, setSearchGift] = useState("")

  const filteredParents = products.filter(p => 
    p.name.toLowerCase().includes(searchParent.toLowerCase())
  ).slice(0, 5)

  const filteredGifts = products.filter(p => 
    p.name.toLowerCase().includes(searchGift.toLowerCase())
  ).slice(0, 5)

  const handleAddGift = (product: AdminProduct) => {
    if (selectedGifts.some(g => g.id === product.id)) return
    setSelectedGifts([...selectedGifts, { ...product, discount: 100 }])
    setSearchGift("")
  }

  const updateGiftDiscount = (id: string, discount: number) => {
    setSelectedGifts(selectedGifts.map(g => 
      g.id === id ? { ...g, discount: Math.min(100, Math.max(0, discount)) } : g
    ))
  }

  const removeGift = (id: string) => {
    setSelectedGifts(selectedGifts.filter(g => g.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!parentId || selectedGifts.length === 0) return
    await onCreate(parentId, selectedGifts)
    
    // Success Reset
    setParentId("")
    setSearchParent("")
    setSelectedGifts([])
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Parent Product Selector */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
          Main Product (Trigger)
        </label>
        <div className="relative">
          <Input 
            placeholder="Search main product..." 
            value={searchParent}
            onChange={(e) => setSearchParent(e.target.value)}
            className="h-12 bg-neutral-50/50 border-neutral-100 rounded-xl pl-10 focus:ring-black"
          />
          <Search className="absolute left-3 top-3.5 h-5 w-5 text-neutral-300" />
        </div>
        
        {searchParent && !parentId && (
          <div className="rounded-2xl border border-neutral-100 bg-white shadow-2xl overflow-hidden divide-y divide-neutral-50 z-20 relative">
            {filteredParents.map(p => {
              const isAlreadyParent = existingPromotions.some(ep => ep.parent_id === p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={isAlreadyParent}
                  onClick={() => {
                    setParentId(p.id)
                    setSearchParent(p.name)
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 transition-all flex items-center justify-between group",
                    isAlreadyParent ? "bg-neutral-50/80 cursor-not-allowed" : "hover:bg-neutral-50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-neutral-100 relative">
                      {p.images?.[0] ? (
                        <Image 
                          src={p.images[0]} 
                          alt={p.name} 
                          fill 
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-neutral-300 font-bold text-[10px]">P</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold truncate">{p.name}</p>
                        {isAlreadyParent && (
                          <span className="text-[8px] font-black uppercase tracking-tighter bg-neutral-200 text-neutral-500 px-1.5 py-0.5 rounded">
                            Active Offer
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-400 truncate">{p.description || 'No description'}</p>
                    </div>
                  </div>
                  {!isAlreadyParent && <Plus size={14} className="text-neutral-200 group-hover:text-black shrink-0" />}
                </button>
              )
            })}
          </div>
        )}

        {parentId && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-black text-white animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-white/10 overflow-hidden border border-white/5 shrink-0 relative">
                {products.find(p => p.id === parentId)?.images?.[0] ? (
                  <Image 
                    src={products.find(p => p.id === parentId)?.images?.[0] || ""} 
                    alt="Selected" 
                    fill 
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-white/20">P</div>
                )}
              </div>
              <span className="text-sm font-bold truncate max-w-[200px]">
                {products.find(p => p.id === parentId)?.name}
              </span>
            </div>
            <button type="button" onClick={() => {setParentId(""); setSearchParent("")}} className="hover:text-red-400 p-1">
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Multi-Gift Selector */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
          Complimentary Gifts (Choice)
        </label>
        <div className="relative">
          <Input 
            placeholder="Search gift options..." 
            value={searchGift}
            onChange={(e) => setSearchGift(e.target.value)}
            className="h-12 bg-neutral-50/50 border-neutral-100 rounded-xl pl-10 focus:ring-black"
          />
          <Search className="absolute left-3 top-3.5 h-5 w-5 text-neutral-300" />
        </div>

        {searchGift && (
          <div className="rounded-2xl border border-neutral-100 bg-white shadow-2xl overflow-hidden divide-y divide-neutral-50 max-h-60 overflow-y-auto z-10 relative">
            {filteredGifts.map(p => {
              const isSelected = selectedGifts.some(g => g.id === p.id)
              const isAlreadyGift = existingPromotions.some(ep => ep.child_id === p.id)
              
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={isSelected || isAlreadyGift}
                  onClick={() => handleAddGift(p)}
                  className={cn(
                    "w-full text-left px-4 py-3 transition-all flex items-center justify-between group",
                    isSelected || isAlreadyGift ? "bg-neutral-50/80 cursor-not-allowed" : "hover:bg-neutral-50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-neutral-100 relative">
                      {p.images?.[0] ? (
                        <Image 
                          src={p.images[0]} 
                          alt={p.name} 
                          fill 
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-neutral-300">
                          <Gift size={16} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold truncate">{p.name}</p>
                        {isSelected && (
                          <span className="text-[8px] font-black uppercase tracking-tighter bg-black text-white px-1.5 py-0.5 rounded">
                            Added
                          </span>
                        )}
                        {isAlreadyGift && (
                          <span className="text-[8px] font-black uppercase tracking-tighter bg-neutral-200 text-neutral-500 px-1.5 py-0.5 rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-400 truncate">{p.description || 'No description'}</p>
                    </div>
                  </div>
                  {isSelected || isAlreadyGift ? (
                    <Check size={14} className={isSelected ? "text-black" : "text-neutral-300"} />
                  ) : (
                    <Plus size={14} className="text-neutral-200 group-hover:text-black shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Selected Gifts List with Individual Discounts */}
        <div className="space-y-2 mt-4">
          {selectedGifts.map((gift) => (
            <div key={gift.id} className="p-4 rounded-2xl border border-neutral-100 bg-white shadow-sm flex items-center justify-between animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-neutral-50 overflow-hidden shrink-0 border border-neutral-100 relative">
                  {gift.images?.[0] ? (
                    <Image 
                      src={gift.images[0]} 
                      alt={gift.name} 
                      fill 
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-neutral-400">
                      <Gift size={20} />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-neutral-900 truncate max-w-[150px]">{gift.name}</p>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-medium">Selected Option</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-100">
                  <Percent size={12} className="text-neutral-400" />
                  <input 
                    type="number" 
                    value={gift.discount}
                    onChange={(e) => updateGiftDiscount(gift.id, parseInt(e.target.value) || 0)}
                    className="w-10 bg-transparent border-none text-sm font-bold text-neutral-900 focus:ring-0 p-0 text-center"
                  />
                  <span className="text-[10px] font-black text-neutral-300">OFF</span>
                </div>
                <button 
                  type="button"
                  onClick={() => removeGift(gift.id)}
                  className="p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={!parentId || selectedGifts.length === 0 || isCreating}
        className="w-full h-14 rounded-2xl bg-black text-white hover:bg-neutral-800 shadow-xl shadow-black/10 text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        {isCreating ? (
          <span className="flex items-center gap-2"><Loader2 className="animate-spin h-4 w-4" /> Processing...</span>
        ) : (
          `Launch Promotion Studio (${selectedGifts.length} Gifts)`
        )}
      </Button>
    </form>
  )
}

