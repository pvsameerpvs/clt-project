"use client"
import { Promotion } from "@/lib/admin-api"
import { Trash2, Gift, ArrowRight, Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import { EditPromotionModal } from "@/components/ui/edit-promotion-modal"
import Image from "next/image"

interface PromotionListProps {
  promotions: Promotion[]
  onUpdate: (id: string, discount: number) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function PromotionList({ promotions, onUpdate, onDelete }: PromotionListProps) {
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (promotions.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center text-center p-8 rounded-3xl border border-dashed border-neutral-200 bg-neutral-50/50">
        <Gift className="h-8 w-8 mb-4 text-neutral-300" />
        <p className="text-sm font-medium text-neutral-400">Your Promotion Studio is empty.</p>
        <p className="text-[10px] text-neutral-300 uppercase tracking-widest mt-1">Start by creating your first bundle offer</p>
      </div>
    )
  }

  // Group by parent_id
  const grouped = promotions.reduce((acc, p) => {
    if (!acc[p.parent_id]) {
      acc[p.parent_id] = {
        parent: p.parent,
        relationships: []
      }
    }
    acc[p.parent_id].relationships.push(p)
    return acc
  }, {} as Record<string, { parent: Promotion['parent'], relationships: Promotion[] }>)

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([parentId, data]) => (
        <div 
          key={parentId} 
          className="rounded-[32px] border border-neutral-100 bg-white overflow-hidden hover:border-black transition-all duration-500 hover:shadow-2xl hover:shadow-black/5"
        >
          {/* Parent Header */}
          <div className="p-6 border-b border-neutral-50 flex items-center justify-between bg-neutral-50/30">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white border border-neutral-100 shadow-sm overflow-hidden relative">
                {data.parent?.images?.[0] ? (
                  <Image 
                    src={data.parent.images[0]} 
                    alt="Parent" 
                    fill 
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-[10px] font-black">P</div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-black text-neutral-900">{data.parent?.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Master Product</span>
                  <span className="h-1 w-1 rounded-full bg-neutral-200" />
                  <span className="text-[10px] font-black text-emerald-600 uppercase">
                    {data.relationships.length} Relationship{data.relationships.length > 1 ? 's' : ''} Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Relationships List */}
          <div className="divide-y divide-neutral-50">
            {data.relationships.map((promo) => (
              <div key={promo.id} className="group p-5 flex items-center justify-between hover:bg-neutral-50/50 transition-colors">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <ArrowRight size={14} className="text-neutral-200" />
                    <div className="h-10 w-10 rounded-xl bg-white border border-neutral-100 overflow-hidden relative shadow-sm">
                      {promo.child?.images?.[0] ? (
                        <Image 
                          src={promo.child.images[0]} 
                          alt="Gift" 
                          fill 
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-emerald-600">
                          <Gift size={16} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-neutral-800 truncate">{promo.child?.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "text-[9px] font-black px-2 py-0.5 rounded-full",
                        promo.discount_percentage === 100 
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                          : "bg-amber-50 text-amber-600 border border-amber-100"
                      )}>
                        {promo.discount_percentage === 100 ? "FREE GIFT" : `${promo.discount_percentage}% OFF`}
                      </span>
                      <span className="text-[8px] text-neutral-400 font-bold uppercase tracking-tighter">
                        Since {new Date(promo.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setEditingPromo(promo)}
                    className="h-9 w-9 text-neutral-300 hover:text-black hover:bg-white rounded-xl"
                  >
                    <Edit3 size={14} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setDeletingId(promo.id)}
                    className="h-9 w-9 text-neutral-300 hover:text-red-500 hover:bg-white rounded-xl"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <ConfirmationModal 
        isOpen={!!deletingId}
        title="Deactivate Offer?"
        message="This will remove the complimentary gift relationship. Existing orders won't be affected."
        onConfirm={() => deletingId && onDelete(deletingId)}
        onCancel={() => setDeletingId(null)}
      />

      <EditPromotionModal 
        isOpen={!!editingPromo}
        promotion={editingPromo}
        onSave={onUpdate}
        onClose={() => setEditingPromo(null)}
      />
    </div>
  )
}
