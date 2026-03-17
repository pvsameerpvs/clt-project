import { useState, useEffect } from "react"
import { SingleImageUpload } from "@/components/single-image-upload"
import { CollectionsPreview } from "@/components/preview/collections-preview"
import { OffersPreview } from "@/components/preview/offers-preview"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getAdminCategories, getAdminProducts, type Category, type AdminProduct } from "@/lib/admin-api"
import { Plus, Trash2, Palette, Link2 } from "lucide-react"

interface CollectionsSettingsProps {
  collections: any[]
  offers: any[]
  onCollectionsChange: (cols: any[]) => void
  onOffersChange: (offers: any[]) => void
}

const PRESET_COLORS = [
  { name: 'Soft Sand', class: 'bg-[#F3F0EA]' },
  { name: 'Misty Blue', class: 'bg-[#EBEFF5]' },
  { name: 'Rose Cloud', class: 'bg-[#F5EBEB]' },
  { name: 'Sage Leaf', class: 'bg-[#F0F4F2]' },
  { name: 'Noir', class: 'bg-[#1A1A1A] text-white' },
]

export function CollectionsSettings({ collections, offers, onCollectionsChange, onOffersChange }: CollectionsSettingsProps) {
  const [activeModal, setActiveModal] = useState<'collections' | 'offers' | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<AdminProduct[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const [cats, prods] = await Promise.all([getAdminCategories(), getAdminProducts()])
        setCategories(cats)
        setProducts(prods)
      } catch (err) {
        console.error("Failed to fetch data:", err)
      }
    }
    fetchData()
  }, [])

  const updateCol = (idx: number, field: string, value: string) => {
    const next = [...collections]; next[idx] = { ...next[idx], [field]: value }; onCollectionsChange(next)
  }
  
  const updateOffer = (idx: number, field: string, value: string) => {
    const next = [...offers]; next[idx] = { ...next[idx], [field]: value }; onOffersChange(next)
  }

  const addOffer = () => {
    onOffersChange([...offers, { title: "New Offer", description: "Special promotion details here...", action: "Shop Now", href: "", badge: "", bgColor: "bg-[#F3F0EA]" }])
  }

  const removeOffer = (idx: number) => {
    onOffersChange(offers.filter((_, i) => i !== idx))
  }

  return (
    <div className="grid gap-8">
      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif text-neutral-900">Curated Selections Preview</h2>
            <p className="mt-1 text-sm text-neutral-500">Main collection banners on your home page.</p>
          </div>
          <Button onClick={() => setActiveModal('collections')} variant="outline" className="rounded-full">
            Edit Collections
          </Button>
        </div>

        <CollectionsPreview collections={collections} onEditClick={() => setActiveModal('collections')} />
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif text-neutral-900">Promo Offers Preview</h2>
            <p className="mt-1 text-sm text-neutral-500">Promotional cards with quick links.</p>
          </div>
          <Button onClick={() => setActiveModal('offers')} variant="outline" className="rounded-full">
            Manage Offers
          </Button>
        </div>

        <OffersPreview offers={offers} onEditClick={() => setActiveModal('offers')} />
      </section>

      {/* Collections Modal */}
      <Dialog open={activeModal === 'collections'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif">Edit Curated Selections</DialogTitle>
            <DialogDescription>Change the titles, images, and links for your three main collection cards.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 mt-6 md:grid-cols-3">
            {collections.map((col, idx) => (
              <div key={idx} className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-4">
                <div className="flex items-center gap-2">
                   <span className="bg-black text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold">{idx + 1}</span>
                   <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Card {idx + 1}</span>
                </div>
                
                <SingleImageUpload 
                  value={col.image} 
                  onUpload={(url) => updateCol(idx, 'image', url)} 
                  onRemove={() => updateCol(idx, 'image', "")}
                />

                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest px-1">Subtitle</label>
                      <input className="w-full border border-neutral-200 bg-white rounded-xl p-3 text-xs" value={col.subtitle} onChange={(e) => updateCol(idx, 'subtitle', e.target.value)} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest px-1">Title (HTML)</label>
                      <input className="w-full border border-neutral-200 bg-white rounded-xl p-3 text-xs font-bold" value={col.title} onChange={(e) => updateCol(idx, 'title', e.target.value)} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest px-1 flex items-center gap-1"><Link2 className="h-2 w-2"/> Pick Category</label>
                      <select 
                        className="w-full border border-neutral-200 bg-white rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-black transition-all appearance-none cursor-pointer"
                        value=""
                        onChange={(e) => updateCol(idx, 'href', `/categories/${e.target.value}`)}
                      >
                        <option value="" disabled>Select a category...</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.slug}>{cat.name}</option>
                        ))}
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest px-1">Deep Link / Slug</label>
                      <input className="w-full border border-neutral-200 bg-white rounded-xl p-3 text-xs" value={col.href} onChange={(e) => updateCol(idx, 'href', e.target.value)} />
                   </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-6 border-t mt-6">
            <Button onClick={() => setActiveModal(null)} variant="secondary" className="px-8 rounded-full">
              Finish Layout
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PROMO OFFERS MODAL (ENHANCED) */}
      <Dialog open={activeModal === 'offers'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <div className="flex items-center justify-between w-full pr-12">
              <div>
                <DialogTitle className="text-3xl font-serif">Promo Offers Studio</DialogTitle>
                <DialogDescription>Create and manage your promotional cards with standard slugs.</DialogDescription>
              </div>
              <Button onClick={addOffer} className="rounded-full gap-2">
                <Plus className="h-4 w-4" /> Add New Offer
              </Button>
            </div>
          </DialogHeader>

          <div className="grid gap-6 mt-2 md:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer, idx) => (
              <div key={idx} className="group relative p-6 bg-white rounded-3xl border border-neutral-200 shadow-sm space-y-5">
                 {/* Delete Button */}
                 <button 
                   onClick={() => removeOffer(idx)}
                   className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600"
                 >
                   <Trash2 className="h-4 w-4" />
                 </button>

                 <div className="flex items-center justify-between border-b pb-3">
                   <div className="flex items-center gap-2">
                     <span className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                     <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.1em]">Card Configuration</span>
                   </div>
                 </div>
                
                <div className="space-y-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Offer Title</label>
                      <input className="w-full border border-neutral-200 bg-neutral-50 rounded-xl p-3 text-sm font-serif italic" value={offer.title} onChange={(e) => updateOffer(idx, 'title', e.target.value)} />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Badge (Text)</label>
                        <input placeholder="e.g. New" className="w-full border border-neutral-200 bg-white rounded-xl p-2.5 text-xs text-center font-bold" value={offer.badge || ""} onChange={(e) => updateOffer(idx, 'badge', e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Action Text</label>
                        <input placeholder="Shop Now" className="w-full border border-neutral-200 bg-white rounded-xl p-2.5 text-xs text-center" value={offer.action || ""} onChange={(e) => updateOffer(idx, 'action', e.target.value)} />
                      </div>
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Description</label>
                      <textarea className="w-full border border-neutral-200 bg-neutral-50 rounded-xl p-3 text-xs h-20 resize-none font-light" value={offer.description} onChange={(e) => updateOffer(idx, 'description', e.target.value)} />
                   </div>

                   <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1 flex items-center gap-1.5"><Palette className="h-3 w-3"/> Card Theme</label>
                        <div className="flex flex-wrap gap-2 px-1">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color.name}
                              className={`w-8 h-8 rounded-full border-2 ${color.class} ${offer.bgColor === color.class ? 'border-black scale-110' : 'border-transparent'} transition-all`}
                              onClick={() => updateOffer(idx, 'bgColor', color.class)}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1 flex items-center gap-1.5"><Link2 className="h-3 w-3"/> Standard Slug Link</label>
                        <select 
                          className="w-full border border-neutral-200 bg-white rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-black transition-all appearance-none cursor-pointer font-medium"
                          value=""
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.startsWith('cat:')) updateOffer(idx, 'href', `/categories/${val.replace('cat:', '')}`)
                            else if (val.startsWith('prod:')) updateOffer(idx, 'href', `/products/${val.replace('prod:', '')}`)
                          }}
                        >
                          <option value="" disabled>Link to Category or Product...</option>
                          <optgroup label="Categories">
                            {categories.map((cat) => (
                              <option key={cat.id} value={`cat:${cat.slug}`}>{cat.name}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Products">
                            {products.map((prod) => (
                              <option key={prod.id} value={`prod:${prod.slug}`}>{prod.name}</option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest px-1">Manual Deep Link</label>
                        <input className="w-full border border-neutral-200 bg-white rounded-xl px-3 py-2 text-[10px] font-mono" value={offer.href} onChange={(e) => updateOffer(idx, 'href', e.target.value)} />
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-6 border-y mt-8 bg-white/50 backdrop-blur-md sticky bottom-0 -mx-6 px-6 pb-6 rounded-b-[2rem] z-20">
            <Button onClick={() => setActiveModal(null)} variant="secondary" className="px-12 py-6 rounded-full font-black tracking-[0.2em] text-xs">
              SAVE ALL OFFERS
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
