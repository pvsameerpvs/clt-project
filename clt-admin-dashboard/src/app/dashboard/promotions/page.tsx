"use client"

import { useEffect, useState } from "react"
import { 
  Promotion, 
  AdminProduct, 
  getAdminPromotions, 
  getAdminProducts, 
  createAdminPromotion, 
  updateAdminPromotion,
  deleteAdminPromotion 
} from "@/lib/admin-api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Sparkles, Loader2, AlertCircle } from "lucide-react"
import { PromotionForm, SelectedGift } from "@/components/dashboard/promotions/promotion-form"
import { PromotionList } from "@/components/dashboard/promotions/promotion-list"

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  async function loadData() {
    try {
      setLoading(true)
      const [promoData, productData] = await Promise.all([
        getAdminPromotions(),
        getAdminProducts()
      ])
      setPromotions(promoData)
      setProducts(productData)
    } catch (err) {
      console.error("Failed to load Promotion Studio data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreatePromotions = async (parentId: string, gifts: SelectedGift[]) => {
    try {
      setIsCreating(true)
      await Promise.all(gifts.map(gift => 
        createAdminPromotion({
          parent_id: parentId,
          child_id: gift.id,
          discount_percentage: gift.discount,
          is_active: true
        })
      ))
      await loadData()
    } catch (err) {
      alert("Some promotions failed to save. Check for duplicates.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdatePromotion = async (id: string, discount: number) => {
    try {
      await updateAdminPromotion(id, { discount_percentage: discount })
      setPromotions(promotions.map(p => p.id === id ? { ...p, discount_percentage: discount } : p))
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update discount."
      alert(`Error: ${msg}`)
    }
  }

  const handleDeletePromotion = async (id: string) => {
    try {
      await deleteAdminPromotion(id)
      setPromotions(promotions.filter(p => p.id !== id))
    } catch (err) {
      alert("Failed to delete.")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
        <Loader2 className="h-10 w-10 animate-spin text-neutral-200" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">Loading Promotion Studio</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-1000">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-3xl bg-black text-white flex items-center justify-center shadow-2xl shadow-black/20">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="text-4xl font-serif font-medium text-neutral-900 tracking-tight">Promotion Studio</h1>
            <p className="text-xs text-neutral-500 font-light italic">Orchestrate luxury bundles and complimentary experiences.</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        {/* Left Side: Create Form */}
        <div className="lg:col-span-5 space-y-8">
          <Card className="border-none bg-neutral-50/50 shadow-none rounded-[40px] p-4">
            <CardHeader className="pb-8">
              <CardTitle className="text-xl font-serif">Studio Campaign</CardTitle>
              <CardDescription className="text-[10px] uppercase tracking-widest font-bold text-neutral-400">
                Link products with custom rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PromotionForm 
                products={products} 
                isCreating={isCreating} 
                onCreate={handleCreatePromotions} 
                existingPromotions={promotions}
              />
            </CardContent>
          </Card>

          <div className="p-8 rounded-[40px] bg-neutral-900 text-white flex items-start gap-5 shadow-2xl shadow-black/10">
            <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-amber-400" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-black uppercase tracking-widest">Master Workflow</h4>
              <p className="text-xs text-neutral-400 leading-relaxed font-light">
                Each child item can have a unique discount. A 100% discount appears as a 
                <span className="text-white font-bold mx-1">Free Gift</span> while 
                lower percentages create <span className="text-white font-bold mx-1">Bundle Pricing</span>. 
                All inventory is tracked individually.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: List Management */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-8 px-2">
            <div>
              <h3 className="text-2xl font-serif">Live Offers</h3>
              <p className="text-[10px] uppercase tracking-widest font-black text-emerald-600 mt-1">
                {promotions.length} Relationships Active
              </p>
            </div>
          </div>
          <PromotionList 
            promotions={promotions} 
            onUpdate={handleUpdatePromotion}
            onDelete={handleDeletePromotion} 
          />
        </div>
      </div>
    </div>
  )
}
