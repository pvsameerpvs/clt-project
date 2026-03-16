"use client"

import { SingleImageUpload } from "@/components/single-image-upload"

interface CollectionsSettingsProps {
  collections: any[]
  offers: any[]
  onCollectionsChange: (cols: any[]) => void
  onOffersChange: (offers: any[]) => void
}

export function CollectionsSettings({ collections, offers, onCollectionsChange, onOffersChange }: CollectionsSettingsProps) {
  const updateCol = (idx: number, field: string, value: string) => {
    const next = [...collections]; next[idx] = { ...next[idx], [field]: value }; onCollectionsChange(next)
  }
  const updateOffer = (idx: number, field: string, value: string) => {
    const next = [...offers]; next[idx] = { ...next[idx], [field]: value }; onOffersChange(next)
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <section className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">🛍️ Curated Selections</h2>
        <div className="space-y-6">
          {collections.map((col, idx) => (
            <div key={idx} className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
              <label className="text-[10px] font-bold text-neutral-400 uppercase">Collection Title</label>
              <input className="w-full border rounded p-2 text-xs font-bold" value={col.title} onChange={(e) => updateCol(idx, 'title', e.target.value)} />
              <SingleImageUpload 
                value={col.image} 
                onUpload={(url) => updateCol(idx, 'image', url)} 
                onRemove={() => updateCol(idx, 'image', "")}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">🎟️ Promo Offer Cards</h2>
        <div className="space-y-6">
          {offers.map((offer, idx) => (
            <div key={idx} className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
              <label className="text-[10px] font-bold text-neutral-400 uppercase">Promo Title</label>
              <input className="w-full border rounded p-2 text-xs font-bold" value={offer.title} onChange={(e) => updateOffer(idx, 'title', e.target.value)} />
              <label className="text-[10px] font-bold text-neutral-400 uppercase">Content</label>
              <textarea className="w-full border rounded p-2 text-xs h-16" value={offer.description} onChange={(e) => updateOffer(idx, 'description', e.target.value)} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
