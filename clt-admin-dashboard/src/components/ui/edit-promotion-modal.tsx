"use client"

import { X, Percent, Gift, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { Promotion } from "@/lib/admin-api"
import Image from "next/image"

interface EditPromotionModalProps {
  isOpen: boolean
  promotion: Promotion | null
  onSave: (id: string, discount: number) => Promise<void>
  onClose: () => void
}

export function EditPromotionModal({
  isOpen,
  promotion,
  onSave,
  onClose
}: EditPromotionModalProps) {
  const [discount, setDiscount] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (promotion) {
      setDiscount(promotion.discount_percentage)
    }
  }, [promotion])

  if (!isOpen || !promotion) return null

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await onSave(promotion.id, discount)
      onClose()
    } catch (err) {
      alert("Failed to save changes")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
        <div className="p-8 pt-10">
          <div className="flex items-center justify-center gap-6 mb-10">
            <div className="relative h-20 w-20 rounded-3xl overflow-hidden border-2 border-neutral-100 shadow-lg rotate-[-6deg]">
              {promotion.parent?.images?.[0] ? (
                <Image src={promotion.parent.images[0]} alt="Parent" fill className="object-cover" unoptimized />
              ) : (
                <div className="h-full w-full bg-neutral-50 flex items-center justify-center text-xs font-black">P</div>
              )}
            </div>
            <ArrowRight className="text-neutral-200" />
            <div className="relative h-20 w-20 rounded-3xl overflow-hidden border-2 border-neutral-100 shadow-lg rotate-[6deg]">
              {promotion.child?.images?.[0] ? (
                <Image src={promotion.child.images[0]} alt="Gift" fill className="object-cover" unoptimized />
              ) : (
                <div className="h-full w-full bg-emerald-50 flex items-center justify-center text-emerald-300">
                  <Gift size={32} />
                </div>
              )}
            </div>
          </div>

          <div className="text-center mb-8">
            <h3 className="text-2xl font-serif text-neutral-900 mb-2">Adjust Offer</h3>
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-widest">
              Updating bundle: {promotion.parent?.name}
            </p>
          </div>

          <div className="space-y-4 px-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 block text-center">
              Discount Percentage
            </label>
            <div className="relative max-w-[160px] mx-auto">
              <Input 
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                className="h-16 text-center text-2xl font-serif rounded-2xl bg-neutral-50 border-none focus:ring-black pr-12"
              />
              <div className="absolute right-4 top-5 text-neutral-300">
                <Percent size={24} />
              </div>
            </div>
            <p className="text-[10px] text-center text-neutral-400 italic">
              {discount === 100 ? "This item will be gifted for free." : `The customer pays ${100 - discount}% of the price.`}
            </p>
          </div>
        </div>

        <div className="p-6 bg-neutral-50 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-14 rounded-2xl border-neutral-200 text-xs font-black uppercase tracking-widest hover:bg-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 h-14 rounded-2xl bg-black hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-black/10 transition-all active:scale-95"
          >
            {isSaving ? "Saving..." : "Update Offer"}
          </Button>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-neutral-300 hover:text-black transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  )
}
