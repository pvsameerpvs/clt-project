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
    <div className="grid gap-8 md:grid-cols-2">
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-2xl font-serif text-neutral-900">Curated Selections</h2>
        <p className="mt-1 mb-6 text-sm text-neutral-500">Main collection cards shown below the hero section.</p>
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

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-2xl font-serif text-neutral-900">Promo Offer Cards</h2>
        <p className="mt-1 mb-6 text-sm text-neutral-500">Offer cards above pocket-friendly section.</p>
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
